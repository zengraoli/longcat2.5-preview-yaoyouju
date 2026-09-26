package com.yaoyouju.app

import com.yaoyouju.app.nav.DeepLinks
import com.yaoyouju.app.data.api.ApiException
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import org.junit.Assert.assertEquals
import org.junit.Assert.assertThrows
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class ResponseParsingTest {

    private val json = Json { ignoreUnknownKeys = true }

    @Test
    fun `login response unwraps data`() {
        val body = """{"code":0,"data":{"token":"t1","userId":"u1"},"message":"ok"}"""
        val parsed = json.parseToJsonElement(body).jsonObject
        assertEquals(0, parsed["code"]?.jsonPrimitive?.content?.toInt())
        assertEquals("t1", parsed["data"]?.jsonObject?.get("token")?.jsonPrimitive?.content)
    }

    @Test
    fun `deep link parses page route`() {
        assertEquals("A07", DeepLinks.routeFrom("yaoyouju://A07"))
        assertEquals("A01", DeepLinks.routeFrom("yaoyouju://A01"))
        assertEquals("A18", DeepLinks.routeFrom("yaoyouju://A18?tab=x"))
        assertEquals("A14", DeepLinks.routeFrom("yaoyouju://A14/"))
    }

    @Test
    fun `deep link rejects invalid routes`() {
        assertNull(DeepLinks.routeFrom(null))
        assertNull(DeepLinks.routeFrom(""))
        assertNull(DeepLinks.routeFrom("https://example.com/A07"))
        assertNull(DeepLinks.routeFrom("yaoyouju://A00"))
        assertNull(DeepLinks.routeFrom("yaoyouju://A99"))
        assertNull(DeepLinks.routeFrom("yaoyouju://login"))
    }

    @Test
    fun `non-zero code throws ApiException`() {
        val e = assertThrows(ApiException::class.java) {
            throw ApiException(401, "未登录")
        }
        assertEquals(401, e.code)
        assertEquals("未登录", e.message)
    }

    @Test
    fun `episode dto parses with null onset date`() {
        val text = """{"id":"e1","userId":"u1","title":"腰痛","onsetDate":null,"onsetCertainty":"已确认","status":"active"}"""
        val episode = json.decodeFromString<com.yaoyouju.app.data.api.Episode>(text)
        assertEquals("e1", episode.id)
        assertEquals(null, episode.onsetDate)
    }
}
