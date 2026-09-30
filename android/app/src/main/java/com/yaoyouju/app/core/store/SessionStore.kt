package com.yaoyouju.app.core.store

import android.content.Context
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.first

private val Context.sessionDataStore by preferencesDataStore(name = "yaoyouju_session")

/**
 * 会话存储：登录令牌与脱敏手机号。
 * 令牌同步缓存在内存里，供 OkHttp 拦截器同步读取。
 */
class SessionStore(private val context: Context) {

    private val tokenKey = stringPreferencesKey("auth_token")
    private val phoneKey = stringPreferencesKey("masked_phone")

    @Volatile
    var token: String? = null
        private set

    @Volatile
    var maskedPhone: String? = null
        private set

    suspend fun load() {
        val prefs = context.sessionDataStore.data.first()
        token = prefs[tokenKey]
        maskedPhone = prefs[phoneKey]
    }

    suspend fun saveSession(token: String?, maskedPhone: String?) {
        this.token = token
        this.maskedPhone = maskedPhone
        context.sessionDataStore.edit { prefs ->
            if (token.isNullOrBlank()) prefs.remove(tokenKey) else prefs[tokenKey] = token
            if (maskedPhone.isNullOrBlank()) prefs.remove(phoneKey) else prefs[phoneKey] = maskedPhone
        }
    }

    suspend fun clear() = saveSession(null, null)
}
