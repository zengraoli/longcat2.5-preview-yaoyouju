package com.yaoyouju.app.feature.login

import androidx.compose.runtime.Composable
import androidx.lifecycle.viewmodel.compose.viewModel

/** A01 路由：连接 ViewModel 与导航。 */
@Composable
fun LoginRoute(onLoggedIn: () -> Unit) {
    val vm: LoginViewModel = viewModel()
    LoginScreen(
        state = vm.state,
        onPhoneChange = vm::onPhoneChange,
        onCodeChange = vm::onCodeChange,
        onToggleAgreed = vm::toggleAgreed,
        onToggleConsented = vm::toggleConsented,
        onSendCode = vm::sendCode,
        onLogin = { vm.login(onLoggedIn) },
        onShowEmergency = vm::setShowEmergency,
    )
}
