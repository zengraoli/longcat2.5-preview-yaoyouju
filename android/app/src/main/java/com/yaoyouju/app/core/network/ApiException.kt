package com.yaoyouju.app.core.network

/** 统一响应格式里的业务错误：code 非 0，message 为中文（见 server/docs/errors.md）。 */
class ApiException(val code: Int, override val message: String) : Exception(message) {
    /** 登录过期 */
    val isUnauthorized: Boolean get() = code == 1002
    /** 未同意健康信息处理 */
    val isConsentMissing: Boolean get() = code == 2002
    /** 命中红旗信号 */
    val isRedFlag: Boolean get() = code == 3001
    /** 停止个性化分析 */
    val isOutOfScope: Boolean get() = code == 3002
    /** 功能开关关闭 */
    val isSwitchOff: Boolean get() = code == 3003
    /** 服务不可用 */
    val isServiceUnavailable: Boolean get() = code == 5002
}
