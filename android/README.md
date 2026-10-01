# 腰有据 · 原生 Android 客户端

腰痛理解与复诊助手用户端（原生 Android）。功能与设计同 uni-app App 端（`docs/design/app/A01`–`A18`），**不作诊断**。

## 技术栈

Kotlin 2.0 + Jetpack Compose（Material 3）+ Navigation Compose + Retrofit/OkHttp + kotlinx.serialization + DataStore。
Gradle Kotlin DSL + 版本目录（`gradle/libs.versions.toml`）。minSdk 26，targetSdk 35，单 Activity。

## 目录结构

```
android/
  app/src/main/java/com/yaoyouju/app/
    core/design/      设计令牌（颜色 / 字号 / 圆角）与 Material 3 主题
    core/components/  通用组件（四种按钮、芯片、状态标签、三种提示条、卡片、底部导航、图标）
    core/network/     统一响应格式解析、Bearer 令牌注入、中文错误提示
    core/navigation/  路由（A01–A18）与 deep link
    core/store/       DataStore 会话存储与跨页面状态
    feature/<页面>/   每个页面一个包：Screen（纯 UI）+ ViewModel + Route
  app/src/test/       Roborazzi 截图测试（Robolectric + Compose）
  screenshots/        A01–A18 页面截图（recordRoborazziDebug 输出，随仓库提交）
```

## 构建

```bash
# 在 android/ 目录下
./gradlew assembleDebug            # Windows: gradlew.bat assembleDebug
```

产物：`app/build/outputs/apk/debug/app-debug.apk`

## 接口基地址

默认 `http://127.0.0.1:3400`（写在 BuildConfig 的 `API_BASE_URL`），可在构建时覆盖：

```bash
./gradlew assembleDebug -PapiBaseUrl=http://10.0.2.2:3400
```

- 真机调试：用 `adb reverse tcp:3400 tcp:3400` 把手机的 3400 端口转发到本机 server。
- 模拟器访问宿主机：用 `http://10.0.2.2:3400`。
- 已为 `127.0.0.1`、`10.0.2.2`、`localhost` 配置明文 HTTP 白名单（`res/xml/network_security_config.xml`）。

## 安装与运行

```bash
# 启动 server（在仓库根目录 server/ 下）
npm run dev

# 安装并启动 App
adb install -r app/build/outputs/apk/debug/app-debug.apk
adb shell am start -n com.yaoyouju.app/.MainActivity
```

默认账号：任意 11 位手机号 + 验证码 `123456`。

## deep link

支持 `yaoyouju-app://<页面编号>` 直接打开对应页面，方便测试（使用独立 scheme，避免与设备上其他应用冲突）：

```bash
adb shell am start -a android.intent.action.VIEW -d "yaoyouju-app://A07"
```

如果仍弹出选择器，可用显式组件方式：

```bash
adb shell am start -n com.yaoyouju.app/.MainActivity -a android.intent.action.VIEW -d "yaoyouju-app://A07"
```

页面编号：A01 登录、A02 关键变化确认、A03 就医提示、A04 选择困惑、A05 录入报告、A06 核对、
A07 一页分析、A08 原文对照、A09 问与解释、A10 病程时间线、A11 记录今天、A12 复诊摘要、
A13 内容库、A14 首页、A15 视频详情、A16 反馈举报、A17 我的、A18 服务不可用回退。

## 测试与截图

```bash
# 单元测试（路由 / deep link、设计令牌、时间显示、组件渲染）
./gradlew testDebugUnitTest

# 生成 A01–A18 页面截图到 android/screenshots/
./gradlew recordRoborazziDebug
```

截图测试用虚构演示数据（`app/src/test/.../DemoData.kt`）渲染各页面，不访问网络。

## 已知问题

- 演示实现：大模型、OCR、短信均为服务端本地模拟；视频为本地占位图，不引用外部资源。
- A12 复诊摘要的分段标题沿用 uni-app App 端结构（当前情况 / 相关检查原文 / 已经接受的专业建议 / 尚未确认 / 下一步），
  与设计稿 A12 的分段命名（本次发作起点 / 主要症状与变化 等）不完全一致，内容与标签一致。
- 导出 PDF 在 Android 上通过系统分享（`ACTION_SEND`）交给其他应用处理；生成图片在演示版未实现，提示使用复制文本。
- 详细已知问题见仓库根目录 README。
