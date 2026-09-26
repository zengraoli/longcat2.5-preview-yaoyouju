package com.yaoyouju.app.data

import android.content.Context
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.runBlocking

private val Context.dataStore by preferencesDataStore(name = "yyj_prefs")

/**
 * 登录态存储（DataStore）。
 */
object TokenStore {
    private val KEY_TOKEN = stringPreferencesKey("auth_token")

    fun init(context: Context) {
        appContext = context.applicationContext
    }

    private var appContext: Context? = null
        get() = field ?: throw IllegalStateException("TokenStore.init() 未调用")

    fun saveToken(token: String) {
        runBlocking {
            appContext!!.dataStore.edit { it[KEY_TOKEN] = token }
        }
    }

    fun getToken(): String? = runBlocking {
        appContext!!.dataStore.data.first()[KEY_TOKEN]
    }

    fun clear() {
        runBlocking {
            appContext!!.dataStore.edit { it.remove(KEY_TOKEN) }
        }
    }
}
