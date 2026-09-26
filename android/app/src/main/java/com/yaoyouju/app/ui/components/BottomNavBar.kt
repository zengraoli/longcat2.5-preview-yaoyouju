package com.yaoyouju.app.ui.components

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.outlined.Edit
import androidx.compose.material.icons.outlined.Favorite
import androidx.compose.material.icons.outlined.Home
import androidx.compose.material.icons.outlined.Person
import androidx.compose.material3.Icon
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationBarItemDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.unit.dp
import com.yaoyouju.app.ui.theme.Primary
import com.yaoyouju.app.ui.theme.Surface
import com.yaoyouju.app.ui.theme.Text3

data class NavTab(
    val route: String,
    val label: String,
    val selectedIcon: ImageVector,
    val unselectedIcon: ImageVector,
)

val mainTabs = listOf(
    NavTab("A14", "当前情况", Icons.Filled.Home, Icons.Outlined.Home),
    NavTab("A09", "问与解释", Icons.Filled.Favorite, Icons.Outlined.Favorite),
    NavTab("A10", "病程", Icons.Filled.Favorite, Icons.Outlined.Favorite),
    NavTab("A12", "复诊准备", Icons.Filled.Edit, Icons.Outlined.Edit),
    NavTab("A17", "我的", Icons.Filled.Person, Icons.Outlined.Person),
)

/** 底部导航（当前情况 / 问与解释 / 病程 / 复诊准备 / 我的） */
@Composable
fun BottomNavBar(currentRoute: String, onTabSelected: (String) -> Unit) {
    NavigationBar(containerColor = Surface, tonalElevation = 0.dp) {
        mainTabs.forEach { tab ->
            val selected = currentRoute == tab.route
            NavigationBarItem(
                selected = selected,
                onClick = { onTabSelected(tab.route) },
                icon = {
                    Icon(
                        imageVector = if (selected) tab.selectedIcon else tab.unselectedIcon,
                        contentDescription = tab.label,
                    )
                },
                label = { Text(tab.label, color = if (selected) Primary else Text3) },
                colors = NavigationBarItemDefaults.colors(
                    selectedIconColor = Primary,
                    unselectedIconColor = Text3,
                    indicatorColor = Surface,
                ),
            )
        }
    }
}
