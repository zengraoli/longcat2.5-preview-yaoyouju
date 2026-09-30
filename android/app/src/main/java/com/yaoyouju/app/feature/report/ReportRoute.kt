package com.yaoyouju.app.feature.report

import androidx.compose.runtime.Composable
import androidx.lifecycle.viewmodel.compose.viewModel

/** A05 路由 */
@Composable
fun ReportRoute(
    onBack: () -> Unit,
    onDone: () -> Unit,
) {
    val vm: ReportViewModel = viewModel()
    ReportScreen(
        state = vm.state,
        onBack = onBack,
        onSelectTab = vm::selectTab,
        onReportTextChange = vm::onReportTextChange,
        onReportDateChange = vm::onReportDateChange,
        onSelectExamType = vm::selectExamType,
        onHospitalChange = vm::onHospitalChange,
        onAdviceTextChange = vm::onAdviceTextChange,
        onToggleAdvice = vm::toggleAdvice,
        onShowDatePicker = vm::setShowDatePicker,
        onShowExamTypePicker = vm::setShowExamTypePicker,
        onOcr = vm::runOcr,
        onNext = { vm.submit(onDone) },
        onSkip = onDone,
    )
}
