package com.yaoyouju.app.data

import android.content.Context
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.first

private val Context.changeDataStore by preferencesDataStore(name = "yyj_change")

/**
 * 保存 A02“关键变化确认”的红旗项选择，供 A03 就医提示展示。
 */
object ChangeStore {
    private val KEY_RED_FLAGS = stringPreferencesKey("red_flags")

    suspend fun saveRedFlags(context: Context, flags: List<String>) {
        context.changeDataStore.edit {
            it[KEY_RED_FLAGS] = flags.joinToString("")
        }
    }

    suspend fun loadRedFlags(context: Context): List<String> {
        val raw = context.changeDataStore.data.first()[KEY_RED_FLAGS] ?: ""
        return if (raw.isEmpty()) emptyList() else raw.split("")
    }
}
