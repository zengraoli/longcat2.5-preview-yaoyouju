package com.yaoyouju.app.core.components

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.yaoyouju.app.core.design.AppColors
import com.yaoyouju.app.core.design.AppDimens

/** 白底圆角卡片，页面里的内容块统一用它。 */
@Composable
fun AppCard(
    modifier: Modifier = Modifier,
    padding: Int = 16,
    content: @Composable ColumnScope.() -> Unit,
) {
    Column(
        modifier = modifier
            .fillMaxWidth()
            .background(AppColors.Surface, RoundedCornerShape(AppDimens.RadiusCard))
            .padding(padding.dp),
        content = content,
    )
}

/** 卡片标题（可带右侧内容） */
@Composable
fun CardTitle(text: String, trailing: @Composable (() -> Unit)? = null) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(bottom = 8.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Text(text = text, style = MaterialTheme.typography.titleSmall, color = AppColors.Text1)
        trailing?.invoke()
    }
}

/** 页面标题区：大标题 + 可选副标题 + 可选右侧操作 */
@Composable
fun PageHeader(
    title: String,
    subtitle: String? = null,
    trailing: @Composable (() -> Unit)? = null,
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(bottom = 12.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Column(modifier = Modifier.weight(1f)) {
            Text(text = title, style = MaterialTheme.typography.titleLarge, color = AppColors.Text1)
            if (subtitle != null) {
                Text(text = subtitle, style = MaterialTheme.typography.bodySmall, color = AppColors.Text2)
            }
        }
        trailing?.invoke()
    }
}

/** 二级页面顶部栏：返回箭头 + 标题 */
@Composable
fun TopBar(
    title: String,
    onBack: (() -> Unit)? = null,
    trailing: @Composable (RowScope.() -> Unit)? = null,
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 8.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        if (onBack != null) {
            Box(
                modifier = Modifier
                    .defaultMinSize(minWidth = AppDimens.MinTouch, minHeight = AppDimens.MinTouch)
                    .clickable { onBack() },
                contentAlignment = Alignment.Center,
            ) {
                Icon(
                    imageVector = AppIcons.ChevronRight,
                    contentDescription = "返回",
                    tint = AppColors.Text1,
                    modifier = Modifier.size(24.dp).rotate(180f),
                )
            }
        }
        Text(
            text = title,
            style = MaterialTheme.typography.titleMedium,
            color = AppColors.Text1,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis,
            modifier = Modifier.weight(1f),
        )
        trailing?.invoke(this)
    }
}

/** 带图标的操作入口卡片（2×2 快捷入口用） */
@Composable
fun ActionTile(
    icon: ImageVector,
    title: String,
    desc: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Column(
        modifier = modifier
            .background(AppColors.Surface, RoundedCornerShape(AppDimens.RadiusCard))
            .clickable { onClick() }
            .padding(16.dp),
    ) {
        Icon(imageVector = icon, contentDescription = null, tint = AppColors.Primary, modifier = Modifier.size(22.dp))
        Text(
            text = title,
            style = MaterialTheme.typography.titleSmall,
            color = AppColors.Text1,
            modifier = Modifier.padding(top = 8.dp),
        )
        Text(text = desc, style = MaterialTheme.typography.bodySmall, color = AppColors.Text2)
    }
}

/** 分隔线 */
@Composable
fun HDivider(modifier: Modifier = Modifier) {
    Box(
        modifier = modifier
            .fillMaxWidth()
            .padding(vertical = 8.dp)
            .background(AppColors.Border)
            .height(1.dp),
    )
}
