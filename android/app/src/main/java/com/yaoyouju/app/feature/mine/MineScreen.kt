package com.yaoyouju.app.feature.mine

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.unit.dp
import com.yaoyouju.app.core.components.AppButton
import com.yaoyouju.app.core.components.AppButtonType
import com.yaoyouju.app.core.components.AppCard
import com.yaoyouju.app.core.components.AppIcons
import com.yaoyouju.app.core.components.BottomTabBar
import com.yaoyouju.app.core.components.EmergencyDialog
import com.yaoyouju.app.core.components.StatusTag
import com.yaoyouju.app.core.components.TabDestination
import com.yaoyouju.app.core.components.TagTone
import com.yaoyouju.app.core.components.TipBar
import com.yaoyouju.app.core.components.TipBarType
import com.yaoyouju.app.core.design.AppColors
import com.yaoyouju.app.core.design.AppDimens

/** A17 我的 · 数据与授权 */
@Composable
fun MineScreen(
    state: MineUiState,
    onSelectTab: (TabDestination) -> Unit,
    onShowEmergency: (Boolean) -> Unit,
    onShowConsents: (Boolean) -> Unit,
    onRevokeConsent: () -> Unit,
    onExport: () -> Unit,
    onDeleteAccount: () -> Unit,
    onConfirmDelete: () -> Unit,
    onDismissDeleteConfirm: () -> Unit,
    onLogout: () -> Unit,
    onFeedback: () -> Unit,
    onInfo: (String) -> Unit,
) {
    Box(modifier = Modifier.fillMaxSize().background(AppColors.Bg)) {
        Column(modifier = Modifier.fillMaxSize()) {
            Column(
                modifier = Modifier
                    .weight(1f)
                    .verticalScroll(rememberScrollState())
                    .padding(horizontal = AppDimens.PageMargin)
                    .padding(top = 16.dp, bottom = 24.dp),
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth().padding(bottom = 16.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Text(text = "我的", color = AppColors.Text1, style = MaterialTheme.typography.titleLarge)
                    Icon(
                        imageVector = AppIcons.Settings,
                        contentDescription = "设置",
                        tint = AppColors.Text1,
                        modifier = Modifier.size(22.dp).clickable { onInfo("设置：演示版暂未提供更多设置项") },
                    )
                }

                // 资料卡
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(bottom = AppDimens.CardGap)
                        .background(AppColors.Surface, RoundedCornerShape(AppDimens.RadiusCard))
                        .padding(16.dp),
                    horizontalArrangement = Arrangement.spacedBy(12.dp),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Box(
                        modifier = Modifier.size(48.dp).background(AppColors.PrimaryLight, CircleShape),
                        contentAlignment = Alignment.Center,
                    ) {
                        Text(text = "U", color = AppColors.Primary, style = MaterialTheme.typography.titleMedium)
                    }
                    Column(modifier = Modifier.weight(1f)) {
                        Text(text = state.maskedPhone, color = AppColors.Text1, style = MaterialTheme.typography.titleMedium)
                        Text(
                            text = "匿名内部标识 ${state.anonymousId}（分析内容与身份信息分离存储）",
                            color = AppColors.Text2,
                            style = MaterialTheme.typography.bodySmall,
                        )
                    }
                }

                AppCard(modifier = Modifier.padding(bottom = AppDimens.CardGap), padding = 0) {
                    SectionLabel("数据与授权")
                    SettingRow(
                        icon = AppIcons.Shield,
                        title = "我的同意记录",
                        desc = state.consentSummary,
                        trailing = { StatusTag(label = "可撤回", tone = TagTone.Ok) },
                        onClick = { onShowConsents(true) },
                    )
                    SettingRow(
                        icon = AppIcons.Close,
                        title = "撤回“处理健康信息”的同意",
                        desc = "撤回后停止个性化分析，已审核科普与已导出摘要仍可用",
                        onClick = onRevokeConsent,
                    )
                    SettingRow(
                        icon = AppIcons.Download,
                        title = "导出我的全部数据",
                        desc = "可读格式（PDF / JSON），包含病程、报告原文与分析版本",
                        onClick = onExport,
                    )
                    SettingRow(
                        icon = AppIcons.Delete,
                        title = "删除账户与数据",
                        desc = "覆盖公开卡片、索引、向量、缓存与派生摘要",
                        danger = true,
                        onClick = onDeleteAccount,
                    )
                }

                AppCard(modifier = Modifier.padding(bottom = AppDimens.CardGap), padding = 0) {
                    SectionLabel("分享与社区")
                    SettingRow(
                        icon = AppIcons.People,
                        title = "案例投稿（二期）",
                        desc = "单独授权 · 预览 · 去除第三方信息 · 人工审核 · 可撤回",
                        trailing = { StatusTag(label = "尚未开放", tone = TagTone.Neutral) },
                        onClick = {},
                    )
                }

                AppCard(modifier = Modifier.padding(bottom = AppDimens.CardGap), padding = 0) {
                    SectionLabel("服务信息")
                    SettingRow(
                        icon = AppIcons.Info,
                        title = "服务范围与不做的事",
                        desc = "不作诊断、不给手术判断、不调整药物、不生成严重程度总分",
                        onClick = { onInfo("服务范围：不作诊断、不给手术判断、不调整药物、不生成严重程度总分。") },
                    )
                    SettingRow(
                        icon = AppIcons.Warning,
                        title = "紧急就医提示",
                        desc = "无需登录，网络异常时也可查看",
                        danger = true,
                        onClick = { onShowEmergency(true) },
                    )
                    SettingRow(
                        icon = AppIcons.Document,
                        title = "临床审定与来源说明",
                        desc = "谁审核了内容、依据是什么、如何举报错误",
                        onClick = { onInfo("内容均由临床审核人员审定，并标注依据与版本；发现错误可在“反馈与举报”提交。") },
                    )
                    SettingRow(
                        icon = AppIcons.Flag,
                        title = "反馈与举报",
                        desc = "报告分析或内容错误；反馈不会自动进入知识库",
                        onClick = onFeedback,
                    )
                    SettingRow(
                        icon = AppIcons.Settings,
                        title = "版本信息",
                        desc = "App v0.1.0 · 分析模型 ${state.modelName} · 内容库 ${state.contentLibVersion}",
                        onClick = { onInfo("版本信息：App v0.1.0 · 分析模型 ${state.modelName} · 内容库 ${state.contentLibVersion}") },
                    )
                }

                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { onLogout() }
                        .padding(vertical = 16.dp),
                    horizontalArrangement = Arrangement.Center,
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Icon(
                        imageVector = AppIcons.Logout,
                        contentDescription = null,
                        tint = AppColors.Text1,
                        modifier = Modifier.size(18.dp),
                    )
                    Text(
                        text = "退出登录",
                        color = AppColors.Text1,
                        style = MaterialTheme.typography.bodyMedium,
                        modifier = Modifier.padding(start = 6.dp),
                    )
                }

                TipBar(
                    text = "删除会覆盖公开卡片、搜索索引、向量、缓存和派生摘要；备份与依法需要保留的信息按政策管理，不承诺瞬时全网删除。",
                    type = TipBarType.Warn,
                )
            }

            BottomTabBar(selected = TabDestination.Mine, onSelect = onSelectTab)
        }

        if (state.showEmergency) {
            EmergencyDialog(tips = state.emergency, onDismiss = { onShowEmergency(false) })
        }

        if (state.showConsents) {
            DialogMask(onDismiss = { onShowConsents(false) }) {
                Text(text = "我的同意记录", color = AppColors.Text1, style = MaterialTheme.typography.titleSmall)
                if (state.consents.isEmpty()) {
                    Text(
                        text = "暂无同意记录",
                        color = AppColors.Text3,
                        style = MaterialTheme.typography.bodyMedium,
                        modifier = Modifier.padding(top = 12.dp),
                    )
                } else {
                    state.consents.forEach { consent ->
                        Row(
                            modifier = Modifier.fillMaxWidth().padding(top = 12.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            Text(
                                text = consent.scope,
                                color = AppColors.Text1,
                                style = MaterialTheme.typography.bodyMedium,
                                modifier = Modifier.weight(1f),
                            )
                            StatusTag(
                                label = if (consent.granted) "已同意" else "已撤回",
                                tone = if (consent.granted) TagTone.Ok else TagTone.Warn,
                            )
                        }
                    }
                }
                AppButton(
                    text = "关闭",
                    onClick = { onShowConsents(false) },
                    block = true,
                    modifier = Modifier.padding(top = 16.dp),
                )
            }
        }

        if (state.showDeleteConfirm) {
            DialogMask(onDismiss = { onDismissDeleteConfirm() }) {
                Text(text = "删除账户与数据", color = AppColors.Text1, style = MaterialTheme.typography.titleSmall)
                Text(
                    text = "此操作不可恢复。删除会覆盖公开卡片、索引、向量、缓存与派生摘要。",
                    color = AppColors.Text2,
                    style = MaterialTheme.typography.bodyMedium,
                    modifier = Modifier.padding(top = 8.dp, bottom = 16.dp),
                )
                AppButton(text = "确认删除", onClick = onConfirmDelete, type = AppButtonType.Danger, block = true)
                Text(
                    text = "取消",
                    color = AppColors.Text2,
                    style = MaterialTheme.typography.bodyMedium,
                    modifier = Modifier.fillMaxWidth().clickable { onDismissDeleteConfirm() }.padding(vertical = 12.dp),
                )
            }
        }
    }
}

@Composable
private fun SectionLabel(text: String) {
    Text(
        text = text,
        color = AppColors.Text2,
        style = MaterialTheme.typography.bodySmall,
        modifier = Modifier.padding(start = 16.dp, end = 16.dp, top = 14.dp, bottom = 2.dp),
    )
}

@Composable
private fun SettingRow(
    icon: ImageVector,
    title: String,
    desc: String,
    onClick: () -> Unit,
    danger: Boolean = false,
    trailing: @Composable (() -> Unit)? = null,
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onClick() }
            .padding(horizontal = 16.dp, vertical = 14.dp),
        horizontalArrangement = Arrangement.spacedBy(12.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Icon(
            imageVector = icon,
            contentDescription = null,
            tint = if (danger) AppColors.Error else AppColors.Text2,
            modifier = Modifier.size(20.dp),
        )
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = title,
                color = if (danger) AppColors.Error else AppColors.Text1,
                style = MaterialTheme.typography.titleSmall,
            )
            Text(text = desc, color = AppColors.Text2, style = MaterialTheme.typography.bodySmall)
        }
        trailing?.invoke()
        Icon(
            imageVector = AppIcons.ChevronRight,
            contentDescription = null,
            tint = AppColors.Text3,
            modifier = Modifier.size(18.dp),
        )
    }
}

@Composable
private fun DialogMask(onDismiss: () -> Unit, content: @Composable () -> Unit) {
    Box(
        modifier = Modifier.fillMaxSize().background(Color(0x66000000)).clickable { onDismiss() },
        contentAlignment = Alignment.Center,
    ) {
        Column(
            modifier = Modifier
                .padding(32.dp)
                .widthIn(max = 420.dp)
                .background(AppColors.Surface, RoundedCornerShape(AppDimens.RadiusCard))
                .clickable(enabled = false) {}
                .padding(20.dp),
        ) {
            content()
        }
    }
}
