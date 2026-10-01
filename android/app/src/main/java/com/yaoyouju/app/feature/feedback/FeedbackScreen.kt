package com.yaoyouju.app.feature.feedback

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.yaoyouju.app.core.components.AppButton
import com.yaoyouju.app.core.components.AppButtonType
import com.yaoyouju.app.core.components.AppCard
import com.yaoyouju.app.core.components.AppCheckbox
import com.yaoyouju.app.core.components.AppChip
import com.yaoyouju.app.core.components.AppChipState
import com.yaoyouju.app.core.components.AppIcons
import com.yaoyouju.app.core.components.AppTextArea
import com.yaoyouju.app.core.components.ChipRow
import com.yaoyouju.app.core.components.TipBar
import com.yaoyouju.app.core.components.TipBarType
import com.yaoyouju.app.core.components.TopBar
import com.yaoyouju.app.core.design.AppColors
import com.yaoyouju.app.core.design.AppDimens

/** A16 反馈与错误举报（R07） */
@Composable
fun FeedbackScreen(
    state: FeedbackUiState,
    onBack: () -> Unit,
    onSelectTab: (FeedbackTab) -> Unit,
    onToggleProblemType: (String) -> Unit,
    onDescriptionChange: (String) -> Unit,
    onToggleAuthorized: () -> Unit,
    onSelectHelpType: (String) -> Unit,
    onSubmit: () -> Unit,
    onCancel: () -> Unit,
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(AppColors.Bg)
            .verticalScroll(rememberScrollState())
            .padding(horizontal = AppDimens.PageMargin)
            .padding(bottom = 32.dp),
    ) {
        TopBar(title = "反馈与举报", onBack = onBack)

        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 16.dp)
                .background(AppColors.Bg, RoundedCornerShape(AppDimens.RadiusButton)),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            FeedbackTab.entries.forEach { tab ->
                val active = state.tab == tab
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .height(AppDimens.MinTouch)
                        .background(
                            if (active) AppColors.Surface else AppColors.Bg,
                            RoundedCornerShape(AppDimens.RadiusButton),
                        )
                        .border(
                            1.dp,
                            AppColors.Border,
                            RoundedCornerShape(AppDimens.RadiusButton),
                        )
                        .clickable { onSelectTab(tab) },
                    contentAlignment = Alignment.Center,
                ) {
                    Text(
                        text = tab.label,
                        color = if (active) AppColors.Text1 else AppColors.Text2,
                        style = MaterialTheme.typography.labelLarge,
                    )
                }
            }
        }

        // 自动附带信息
        Row(
            modifier = Modifier.padding(bottom = 12.dp),
            horizontalArrangement = Arrangement.spacedBy(6.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Icon(
                imageVector = AppIcons.Document,
                contentDescription = null,
                tint = AppColors.Text2,
                modifier = Modifier.size(18.dp),
            )
            Text(text = "关于哪条内容（自动附带）", color = AppColors.Text1, style = MaterialTheme.typography.titleSmall)
        }
        AutoAttachRow("内容", state.contentLabel)
        AutoAttachRow("版本", state.versionLabel)
        AutoAttachRow("时间", state.timeLabel)

        if (state.tab == FeedbackTab.Error) {
            AppCard(modifier = Modifier.padding(top = 12.dp, bottom = AppDimens.CardGap)) {
                Text(
                    text = "问题类型（可多选）",
                    color = AppColors.Text1,
                    style = MaterialTheme.typography.titleSmall,
                    modifier = Modifier.padding(bottom = 12.dp),
                )
                ChipRow {
                    PROBLEM_TYPES.forEach { type ->
                        AppChip(
                            text = type,
                            state = if (state.problemTypes.contains(type)) AppChipState.Selected else AppChipState.Unselected,
                            onClick = { onToggleProblemType(type) },
                        )
                    }
                }
            }

            AppCard(modifier = Modifier.padding(bottom = AppDimens.CardGap)) {
                Text(
                    text = "具体描述",
                    color = AppColors.Text1,
                    style = MaterialTheme.typography.titleSmall,
                    modifier = Modifier.padding(bottom = 12.dp),
                )
                AppTextArea(
                    value = state.description,
                    onValueChange = onDescriptionChange,
                    placeholder = "例如：报告写的是右侧，但解释里说成了左侧……",
                    minHeight = 120,
                )
                Row(
                    modifier = Modifier.padding(top = 12.dp).clickable { },
                    horizontalArrangement = Arrangement.spacedBy(6.dp),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Icon(
                        imageVector = AppIcons.Upload,
                        contentDescription = null,
                        tint = AppColors.Primary,
                        modifier = Modifier.size(18.dp),
                    )
                    Text(text = "添加截图（可选）", color = AppColors.Primary, style = MaterialTheme.typography.labelLarge)
                }
            }

            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = AppDimens.CardGap)
                    .background(AppColors.PrimaryLight, RoundedCornerShape(AppDimens.RadiusCard))
                    .border(1.dp, AppColors.Primary, RoundedCornerShape(AppDimens.RadiusCard))
                    .clickable { onToggleAuthorized() }
                    .padding(12.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                AppCheckbox(checked = state.authorized, onToggle = onToggleAuthorized, modifier = Modifier.padding(top = 2.dp))
                Text(
                    text = "允许审核人员为处理这条举报查看相关资料（仅限本条分析涉及的报告与记录，可随时撤回）",
                    color = AppColors.Text1,
                    style = MaterialTheme.typography.labelMedium,
                    modifier = Modifier.weight(1f),
                )
            }
        } else {
            AppCard(modifier = Modifier.padding(top = 12.dp, bottom = AppDimens.CardGap)) {
                Text(
                    text = "这次分析对你有帮助吗？",
                    color = AppColors.Text1,
                    style = MaterialTheme.typography.titleSmall,
                    modifier = Modifier.padding(bottom = 12.dp),
                )
                ChipRow {
                    HELP_TYPES.forEach { type ->
                        AppChip(
                            text = type,
                            state = if (state.helpType == type) AppChipState.Selected else AppChipState.Unselected,
                            onClick = { onSelectHelpType(type) },
                        )
                    }
                }
            }
            AppCard(modifier = Modifier.padding(bottom = AppDimens.CardGap)) {
                Text(
                    text = "还有什么没解决？（可选）",
                    color = AppColors.Text1,
                    style = MaterialTheme.typography.titleSmall,
                    modifier = Modifier.padding(bottom = 12.dp),
                )
                AppTextArea(
                    value = state.description,
                    onValueChange = onDescriptionChange,
                    placeholder = "写下你最想弄清的问题",
                    minHeight = 100,
                )
            }
        }

        TipBar(
            text = "你的反馈不会自动进入医学知识库。它会由运营编辑和临床审核人员处理，能定位受影响的版本与用户；处理结果会通知你。",
            type = TipBarType.Info,
        )

        AppButton(
            text = if (state.tab == FeedbackTab.Error) "提交举报" else "提交反馈",
            onClick = onSubmit,
            block = true,
            enabled = !state.submitting,
            modifier = Modifier.padding(top = 16.dp),
        )
        Text(
            text = "取消",
            color = AppColors.Primary,
            style = MaterialTheme.typography.bodyMedium,
            modifier = Modifier.fillMaxWidth().clickable { onCancel() }.padding(vertical = 16.dp),
        )
    }
}

@Composable
private fun AutoAttachRow(label: String, value: String) {
    Row(
        modifier = Modifier.fillMaxWidth().padding(bottom = 6.dp),
        horizontalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        Text(text = label, color = AppColors.Text2, style = MaterialTheme.typography.labelMedium, modifier = Modifier.padding(end = 12.dp))
        Text(text = value, color = AppColors.Text1, style = MaterialTheme.typography.bodyMedium, modifier = Modifier.weight(1f))
    }
}
