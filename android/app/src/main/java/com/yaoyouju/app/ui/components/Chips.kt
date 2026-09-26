package com.yaoyouju.app.ui.components

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.yaoyouju.app.ui.theme.Dimens
import com.yaoyouju.app.ui.theme.Primary
import com.yaoyouju.app.ui.theme.Surface
import com.yaoyouju.app.ui.theme.Text2
import com.yaoyouju.app.ui.theme.Text3

/** 可选芯片：已选（实心主色）/ 未选（描边）/ 跳过（弱色） */
@Composable
fun SelectableChip(
    text: String,
    selected: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    skip: Boolean = false,
) {
    val contentColor = when {
        selected -> Color.White
        skip -> Text3
        else -> Text2
    }
    OutlinedButton(
        onClick = onClick,
        modifier = modifier.heightIn(min = Dimens.minTouch),
        shape = RoundedCornerShape(10.dp),
        colors = ButtonDefaults.outlinedButtonColors(
            containerColor = if (selected) Primary else Color.Transparent,
            contentColor = contentColor,
        ),
        border = BorderStroke(
            1.dp,
            if (selected) Primary else if (skip) com.yaoyouju.app.ui.theme.Border else Text3,
        ),
        contentPadding = androidx.compose.foundation.layout.PaddingValues(horizontal = 14.dp, vertical = 0.dp),
    ) {
        Text(
            text,
            fontSize = 13.sp,
            fontWeight = if (selected) FontWeight.Medium else FontWeight.Normal,
        )
    }
}

/** 单选芯片（选项列表用） */
@Composable
fun RadioChip(text: String, selected: Boolean, onClick: () -> Unit, modifier: Modifier = Modifier) {
    SelectableChip(text = text, selected = selected, onClick = onClick, modifier = modifier)
}
