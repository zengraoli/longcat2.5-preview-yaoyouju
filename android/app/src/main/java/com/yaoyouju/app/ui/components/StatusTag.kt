package com.yaoyouju.app.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.yaoyouju.app.ui.theme.Dimens
import com.yaoyouju.app.ui.theme.Error
import com.yaoyouju.app.ui.theme.ErrorTagTint
import com.yaoyouju.app.ui.theme.Info
import com.yaoyouju.app.ui.theme.InfoTagTint
import com.yaoyouju.app.ui.theme.Text3
import com.yaoyouju.app.ui.theme.Bg
import com.yaoyouju.app.ui.theme.Ok
import com.yaoyouju.app.ui.theme.OkTint
import com.yaoyouju.app.ui.theme.Warn
import com.yaoyouju.app.ui.theme.WarnTagTint

enum class TagType { OK, WARN, ERROR, INFO, MUTED }

/** 状态标签（三端语义一致） */
@Composable
fun StatusTag(label: String, type: TagType, modifier: Modifier = Modifier) {
    val color = when (type) {
        TagType.OK -> Ok
        TagType.WARN -> Warn
        TagType.ERROR -> Error
        TagType.INFO -> Info
        TagType.MUTED -> Text3
    }
    val bg = when (type) {
        TagType.OK -> OkTint
        TagType.WARN -> WarnTagTint
        TagType.ERROR -> ErrorTagTint
        TagType.INFO -> InfoTagTint
        TagType.MUTED -> Bg
    }
    Text(
        text = label,
        color = color,
        fontSize = 12.sp,
        fontWeight = FontWeight.Medium,
        modifier = modifier
            .background(bg, RoundedCornerShape(Dimens.tagRadius))
            .padding(horizontal = 8.dp, vertical = 3.dp),
    )
}
