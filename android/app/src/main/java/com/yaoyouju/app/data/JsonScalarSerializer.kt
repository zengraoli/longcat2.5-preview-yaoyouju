package com.yaoyouju.app.data

import kotlinx.serialization.KSerializer
import kotlinx.serialization.descriptors.PrimitiveKind
import kotlinx.serialization.descriptors.PrimitiveSerialDescriptor
import kotlinx.serialization.descriptors.SerialDescriptor
import kotlinx.serialization.encoding.Decoder
import kotlinx.serialization.encoding.Encoder
import kotlinx.serialization.json.JsonDecoder
import kotlinx.serialization.json.JsonNull
import kotlinx.serialization.json.JsonPrimitive

/**
 * 症状记录字段可能是数字、字符串或“尚未确认”，统一按字符串读取。
 */
object JsonScalarSerializer : KSerializer<JsonScalar> {
    override val descriptor: SerialDescriptor =
        PrimitiveSerialDescriptor("JsonScalar", PrimitiveKind.STRING)

    override fun deserialize(decoder: Decoder): JsonScalar {
        val jsonDecoder = decoder as? JsonDecoder
        if (jsonDecoder != null) {
            val element = jsonDecoder.decodeJsonElement()
            return when (element) {
                is JsonNull -> JsonScalar("尚未确认")
                is JsonPrimitive -> JsonScalar(element.content)
                else -> JsonScalar(element.toString())
            }
        }
        return JsonScalar(decoder.decodeString())
    }

    override fun serialize(encoder: Encoder, value: JsonScalar) {
        encoder.encodeString(value.raw)
    }
}
