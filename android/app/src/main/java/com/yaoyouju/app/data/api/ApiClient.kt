package com.yaoyouju.app.data.api

import com.yaoyouju.app.BuildConfig
import com.yaoyouju.app.data.TokenStore
import kotlinx.coroutines.runBlocking
import kotlinx.serialization.json.Json
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.kotlinx.serialization.asConverterFactory
import java.util.concurrent.TimeUnit

/**
 * 网络层：统一响应格式解析（code != 0 抛 ApiException），自动附带 Bearer token。
 */
object ApiClient {

    private val json = Json {
        ignoreUnknownKeys = true
        coerceInputValues = true
        explicitNulls = false
    }

    private val okHttp = OkHttpClient.Builder()
        .addInterceptor { chain ->
            val request = chain.request().newBuilder()
            TokenStore.getToken()?.let { request.header("Authorization", "Bearer $it") }
            chain.proceed(request.build())
        }
        .addInterceptor(HttpLoggingInterceptor().apply { level = HttpLoggingInterceptor.Level.BASIC })
        .connectTimeout(15, TimeUnit.SECONDS)
        .readTimeout(30, TimeUnit.SECONDS)
        .build()

    private val retrofit = Retrofit.Builder()
        .baseUrl(BuildConfig.BASE_URL)
        .client(okHttp)
        .addConverterFactory(json.asConverterFactory("application/json".toMediaType()))
        .build()

    val api: YyjApi = retrofit.create(YyjApi::class.java)
}

/** 同步取数的便捷封装（ViewModel 中用协程，此处供测试与简单场景使用） */
fun <T> ApiResponse<T>.unwrap(): T {
    if (code != 0 || data == null) throw ApiException(code, message)
    return data
}
