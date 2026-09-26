package com.yaoyouju.app.ui.components

import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.yaoyouju.app.ui.theme.Dimens
import com.yaoyouju.app.ui.theme.Error
import com.yaoyouju.app.ui.theme.Primary
import com.yaoyouju.app.ui.theme.PrimaryLight
import com.yaoyouju.app.ui.theme.Surface
import com.yaoyouju.app.ui.theme.Text1

/** 主按钮（实心主色） */
@Composable
fun PrimaryButton(text: String, onClick: () -> Unit, modifier: Modifier = Modifier, enabled: Boolean = true) {
    Button(
        onClick = onClick,
        enabled = enabled,
        modifier = modifier
            .fillMaxWidth()
            .heightIn(min = Dimens.minTouch),
        shape = RoundedCornerShape(Dimens.buttonRadius),
        colors = ButtonDefaults.buttonColors(containerColor = Primary, contentColor = Color.White),
    ) {
        Text(text, fontSize = 15.sp, fontWeight = FontWeight.Medium)
    }
}

/** 次按钮（白底描边） */
@Composable
fun SecondaryButton(text: String, onClick: () -> Unit, modifier: Modifier = Modifier, enabled: Boolean = true) {
    OutlinedButton(
        onClick = onClick,
        enabled = enabled,
        modifier = modifier
            .fillMaxWidth()
            .heightIn(min = Dimens.minTouch),
        shape = RoundedCornerShape(Dimens.buttonRadius),
        colors = ButtonDefaults.outlinedButtonColors(contentColor = Primary),
        border = ButtonDefaults.outlinedButtonBorder(enabled).copy(brush = androidx.compose.ui.graphics.SolidColor(Primary)),
    ) {
        Text(text, fontSize = 15.sp, fontWeight = FontWeight.Medium)
    }
}

/** 柔和按钮（浅主色底） */
@Composable
fun SoftButton(text: String, onClick: () -> Unit, modifier: Modifier = Modifier) {
    Button(
        onClick = onClick,
        modifier = modifier
            .fillMaxWidth()
            .heightIn(min = Dimens.minTouch),
        shape = RoundedCornerShape(Dimens.buttonRadius),
        colors = ButtonDefaults.buttonColors(containerColor = PrimaryLight, contentColor = Primary),
    ) {
        Text(text, fontSize = 15.sp, fontWeight = FontWeight.Medium)
    }
}

/** 危险/就医按钮（实心红） */
@Composable
fun DangerButton(text: String, onClick: () -> Unit, modifier: Modifier = Modifier) {
    Button(
        onClick = onClick,
        modifier = modifier
            .fillMaxWidth()
            .heightIn(min = Dimens.minTouch),
        shape = RoundedCornerShape(Dimens.buttonRadius),
        colors = ButtonDefaults.buttonColors(containerColor = Error, contentColor = Color.White),
    ) {
        Text(text, fontSize = 15.sp, fontWeight = FontWeight.Medium)
    }
}

/** 文字按钮 */
@Composable
fun TextLink(text: String, onClick: () -> Unit, modifier: Modifier = Modifier, color: Color = Primary) {
    TextButton(onClick = onClick, modifier = modifier.heightIn(min = Dimens.minTouch)) {
        Text(text, color = color, fontSize = 14.sp, fontWeight = FontWeight.Medium)
    }
}
