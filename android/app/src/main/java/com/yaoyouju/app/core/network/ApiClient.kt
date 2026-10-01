package com.yaoyouju.app.core.network

import com.jakewharton.retrofit2.converter.kotlinx.serialization.asConverterFactory
import com.yaoyouju.app.data.ApiResponse
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonElement
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import retrofit2.HttpException
import retrofit2.Retrofit
import java.io.IOException
import java.util.concurrent.TimeUnit

/** 全局鉴权事件（登录过期时通知上层回到登录页） */
object ApiEvents {
    @Volatile
    var onUnauthorized: (() -> Unit)? = null

    /** 已撤回健康信息处理同意：所有写入类接口会失败，需要明确提示用户 */
    @Volatile
    var onConsentMissing: (() -> Unit)? = null
}

/**
 * 网络层：统一响应格式解析、Bearer 令牌注入、中文错误提示。
 * 基地址来自 BuildConfig.API_BASE_URL。
 */
object ApiClient {

    val json: Json = Json {
        ignoreUnknownKeys = true
        explicitNulls = false
        encodeDefaults = true
        coerceInputValues = true
    }

    fun create(baseUrl: String, tokenProvider: () -> String?): ApiService {
        val client = OkHttpClient.Builder()
            .addInterceptor { chain ->
                val token = tokenProvider()
                val builder = chain.request().newBuilder()
                    .header("Accept", "application/json")
                if (!token.isNullOrBlank()) {
                    builder.header("Authorization", "Bearer $token")
                }
                chain.proceed(builder.build())
            }
            .connectTimeout(15, TimeUnit.SECONDS)
            .readTimeout(90, TimeUnit.SECONDS)
            .writeTimeout(30, TimeUnit.SECONDS)
            .build()

        val retrofit = Retrofit.Builder()
            .baseUrl(baseUrl.trimEnd('/') + "/")
            .client(client)
            .addConverterFactory(json.asConverterFactory("application/json".toMediaType()))
            .build()

        return retrofit.create(ApiService::class.java)
    }
}

/**
 * 执行一次接口调用：把统一响应格式解包成业务数据。
 * 出错时抛出中文 message 的 ApiException。
 */
suspend fun <T> apiCall(block: suspend () -> ApiResponse<T>): T? {
    try {
        val resp = block()
        if (resp.code != 0) throw ApiException(resp.code, resp.message)
        return resp.data
    } catch (e: ApiException) {
        if (e.isUnauthorized) ApiEvents.onUnauthorized?.invoke()
        if (e.isConsentMissing) ApiEvents.onConsentMissing?.invoke()
        throw e
    } catch (e: HttpException) {
        val body = runCatching { e.response()?.errorBody()?.string() }.getOrNull()
        val parsed = body?.let {
            runCatching { ApiClient.json.decodeFromString<ApiResponse<JsonElement>>(it) }.getOrNull()
        }
        val code = parsed?.code ?: e.code()
        val message = parsed?.message?.takeIf { it.isNotBlank() } ?: "请求失败"
        val ex = ApiException(code, message)
        if (ex.isUnauthorized) ApiEvents.onUnauthorized?.invoke()
        if (ex.isConsentMissing) ApiEvents.onConsentMissing?.invoke()
        throw ex
    } catch (e: IOException) {
        throw ApiException(5002, "网络不可用，请检查网络后重试")
    }
}

/** 需要非空结果时使用；data 为空视为服务异常。 */
suspend fun <T : Any> apiCallRequired(block: suspend () -> ApiResponse<T>): T =
    apiCall(block) ?: throw ApiException(5001, "服务返回数据为空")
