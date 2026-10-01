package com.yaoyouju.app

import com.yaoyouju.app.core.network.ApiClient
import com.yaoyouju.app.core.store.AppState
import com.yaoyouju.app.data.AnalysisCreateResult
import com.yaoyouju.app.data.ApiResponse
import com.yaoyouju.app.data.AskResult
import com.yaoyouju.app.data.SymptomLog
import kotlinx.coroutines.runBlocking
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * 接口响应解析回归：验收中出现的闪退都源于响应字段与模型不一致。
 * 这些用例用真实响应片段断言解析结果。
 */
class ApiParsingTest {

    @Test
    fun symptomLogWithoutOccurredAtStillParses() {
        // 服务端 listSymptomLogs / addSymptomLog 曾不返回 occurredAt，导致 MissingFieldException
        val json = """
            {"id":"sl-1","careEventId":"ev-1","sitMinutes":30,"plannedActivityDone":"部分",
             "sleepImpact":1,"topWorry":"会不会加重","legChange":"尚未确认"}
        """.trimIndent()
        val log = ApiClient.json.decodeFromString(SymptomLog.serializer(), json)
        assertEquals("sl-1", log.id)
        assertNull(log.occurredAt)
        assertEquals("30", log.sitMinutes?.raw)
        assertEquals("尚未确认", log.legChange?.raw)
    }

    @Test
    fun blockedAnalysisWithNullTaskIdParses() {
        // 命中红旗时服务端返回 {"taskId":null,"status":"blocked",...}
        val json = """
            {"code":0,"message":"ok","data":{"taskId":null,"status":"blocked",
             "safety":{"passed":false,"redFlags":[{"code":"RF-01","name":"大小便功能障碍或鞍区麻木",
             "severity":"高","action":"提示就医","message":"请及时就医"}],"outOfScope":[],"safetyTips":[]}}}
        """.trimIndent()
        val response = ApiClient.json.decodeFromString(ApiResponse.serializer(AnalysisCreateResult.serializer()), json)
        val data = response.data
        assertNotNull(data)
        assertNull(data!!.taskId)
        assertEquals("blocked", data.status)
        assertEquals("RF-01", data.safety.redFlags.first().code)
    }

    @Test
    fun askResultCarriesRedFlags() {
        val json = """
            {"message":{"id":"m-1","role":"assistant","content":"请及时就医","citations":[],"createdAt":"2026-10-01T00:00:00Z"},
             "outOfScope":[],"redFlags":[{"code":"RF-01","name":"大小便功能障碍或鞍区麻木","severity":"高",
             "action":"提示就医","message":"请及时就医"}],"roundEnded":true,"followupQuestionAdded":false}
        """.trimIndent()
        val result = ApiClient.json.decodeFromString(AskResult.serializer(), json)
        assertEquals(1, result.redFlags.size)
        assertTrue(result.roundEnded)
    }

    @Test
    fun unknownFieldsAreIgnored() {
        val json = """{"id":"sl-2","careEventId":"ev-2","newServerField":123}"""
        val log = ApiClient.json.decodeFromString(SymptomLog.serializer(), json)
        assertEquals("sl-2", log.id)
    }

    @Test
    fun toastIsDeliveredThroughChannel() = runBlocking {
        val state = AppState()
        state.toast("已保存记录")
        val message = state.messages.tryReceive().getOrNull()
        assertEquals("已保存记录", message)
    }
}
