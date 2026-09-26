# 腰有据 · Android 客户端

原生 Android 实现（Kotlin + Jetpack Compose + Material 3），功能与设计同 App 端（`docs/design/app/A01–A18`）。

## 环境要求

- JDK 17+（本机为 JDK 21）
- Android SDK：compileSdk/targetSdk 35，build-tools 35.0.0（本机 SDK 位于 `C:\soft\Android\Sdk`）
- 本机下载依赖需走代理（已在 `gradle.properties` 中配置 127.0.0.1:7890；如需修改可覆盖 `systemProp.*` 属性）

## 构建

```bash
cd android
./gradlew assembleDebug        # 产物 app/build/outputs/apk/debug/app-debug.apk
./gradlew test                 # 单元测试
```

Windows 下使用 `gradlew.bat`。

## 安装与联调

```bash
adb install app/build/outputs/apk/debug/app-debug.apk

# 真机调试：手机通过 adb reverse 访问本机 server
adb reverse tcp:3400 tcp:3400

# deep link 直接打开对应页面（A01–A18）
adb shell am start -a android.intent.action.VIEW -d "yaoyouju://A07" com.yaoyouju.app
```

接口基地址在 `BuildConfig.BASE_URL`，默认 `http://127.0.0.1:3400`；已在 network security config 中为 `127.0.0.1`、`localhost`、`10.0.2.2` 放行明文 HTTP。

## 账号

- 用户端：任意 11 位手机号 + 验证码 `123456`（种子用户 `13800001111` / `13900002222`）
- 后台五角色账号见 `server/README.md`（本客户端不涉及）

## 页面路由

| 路由 | 页面 | 设计稿 |
|-|-|-|
| A01 | 登录与授权 | docs/design/app/A01.png |
| A02 | 当前关键变化确认 | docs/design/app/A02.png |
| A03 | 就医提示 | docs/design/app/A03.png |
| A04 | 选择主要困惑 | docs/design/app/A04.png |
| A05 | 录入报告与医嘱 | docs/design/app/A05.png |
| A06 | 核对整理后的信息 | docs/design/app/A06.png |
| A07 | 一页分析 | docs/design/app/A07.png |
| A08 | 原文对照 | docs/design/app/A08.png |
| A09 | 问与解释 | docs/design/app/A09.png |
| A10 | 病程 | docs/design/app/A10.png |
| A11 | 记录今天 | docs/design/app/A11.png |
| A12 | 复诊准备 | docs/design/app/A12.png |
| A13 | 审核内容库 | docs/design/app/A13.png |
| A14 | 当前情况（首页） | docs/design/app/A14.png |
| A15 | 视频详情 | docs/design/app/A15.png |
| A16 | 反馈与举报 | docs/design/app/A16.png |
| A17 | 我的 | docs/design/app/A17.png |
| A18 | 服务不可用回退 | docs/design/app/A18.png |

## 已知问题

- 本机模拟器无硬件加速（HAXM/WHPX 未安装），无法启动模拟器做真机点击验证；deep link 路由逻辑以单元测试覆盖
- 端口占用：本项目仅使用 3400（server）；Android 客户端为 App，不占端口
