package com.yaoyouju.app.feature.redflag

import android.content.Intent
import android.net.Uri
import androidx.compose.runtime.Composable
import androidx.compose.ui.platform.LocalContext
import androidx.lifecycle.viewmodel.compose.viewModel

/** A03 路由：就医入口不被登录、付费、上传或长问卷阻断。 */
@Composable
fun RedFlagRoute(
    onBack: () -> Unit,
    onSummary: () -> Unit,
    onContents: () -> Unit,
) {
    val vm: RedFlagViewModel = viewModel()
    val context = LocalContext.current
    RedFlagScreen(
        state = vm.state,
        onBack = onBack,
        onCall120 = {
            val intent = Intent(Intent.ACTION_DIAL, Uri.parse("tel:120"))
            runCatching { context.startActivity(intent) }
        },
        onFindHospital = { vm.setShowHospitalDialog(true) },
        onContactDoctor = vm::contactDoctor,
        onSummary = onSummary,
        onContents = onContents,
        onDismissHospitalDialog = { vm.setShowHospitalDialog(false) },
    )
}
