package com.yaoyouju.app.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.yaoyouju.app.ui.theme.Bg
import com.yaoyouju.app.ui.theme.Surface
import com.yaoyouju.app.ui.theme.Text1
import com.yaoyouju.app.ui.theme.Text2

/** 分段选项卡（白底滑块 + 灰色轨道） */
@Composable
fun SegmentTabs(
    tabs: List<String>,
    selectedIndex: Int,
    onSelect: (Int) -> Unit,
    modifier: Modifier = Modifier,
) {
    Row(
        modifier = modifier
            .fillMaxWidth()
            .background(Bg, RoundedCornerShape(10.dp))
            .padding(4.dp),
    ) {
        tabs.forEachIndexed { i, t ->
            Box(
                modifier = Modifier
                    .weight(1f)
                    .height(40.dp)
                    .background(
                        color = if (i == selectedIndex) Surface else androidx.compose.ui.graphics.Color.Transparent,
                        shape = RoundedCornerShape(8.dp),
                    )
                    .clickable { onSelect(i) },
                contentAlignment = Alignment.Center,
            ) {
                Text(
                    t,
                    color = if (i == selectedIndex) Text1 else Text2,
                    fontSize = 14.sp,
                )
            }
        }
    }
}
