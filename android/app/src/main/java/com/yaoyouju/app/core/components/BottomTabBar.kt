package com.yaoyouju.app.core.components

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.unit.dp
import com.yaoyouju.app.core.design.AppColors

/** 底部五个固定入口：当前情况 / 问与解释 / 病程 / 复诊准备 / 我的 */
enum class TabDestination(val label: String, val icon: ImageVector) {
    Home("当前情况", AppIcons.Home),
    Qa("问与解释", AppIcons.Qa),
    Timeline("病程", AppIcons.Timeline),
    Followup("复诊准备", AppIcons.Followup),
    Mine("我的", AppIcons.Mine),
}

@Composable
fun BottomTabBar(
    selected: TabDestination,
    onSelect: (TabDestination) -> Unit,
    modifier: Modifier = Modifier,
) {
    Column(modifier = modifier.fillMaxWidth().background(AppColors.Surface)) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .height(1.dp)
                .background(AppColors.Border),
        ) {}
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .navigationBarsPadding()
                .padding(vertical = 6.dp),
            horizontalArrangement = Arrangement.SpaceEvenly,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            TabDestination.entries.forEach { tab ->
                val active = tab == selected
                val color = if (active) AppColors.Primary else AppColors.Text3
                Column(
                    modifier = Modifier
                        .weight(1f)
                        .clickable { onSelect(tab) }
                        .padding(vertical = 4.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(2.dp),
                ) {
                    Icon(
                        imageVector = tab.icon,
                        contentDescription = tab.label,
                        tint = color,
                        modifier = Modifier.size(24.dp),
                    )
                    Text(text = tab.label, color = color, style = MaterialTheme.typography.labelSmall)
                }
            }
        }
    }
}
