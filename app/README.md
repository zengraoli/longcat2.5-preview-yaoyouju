# 腰有据 · 用户端 App（uni-app，H5 / Android）

腰痛理解与复诊助手用户端。帮助腰痛用户看懂检查报告、整理病程、准备复诊；不作诊断。

## 技术栈

uni-app（Vue 3 + Vite + TypeScript），以 H5 构建验收，Android 打包可选。

## 启动

```bash
# 安装依赖
npm install

# H5 开发（默认端口 5401，代理 /api 到 server 3400）
npm run dev:h5

# H5 构建
npm run build:h5

# 类型检查
npm run typecheck

# Android 打包（可选）
npm run build:android
```

## 默认账号

任意 11 位手机号 + 验证码 `123456`（演示固定码）。首次登录自动创建匿名用户。

## 已知问题

- 演示实现：大模型、OCR、短信均为本地模拟，不调用外部服务。
- 手机号在身份隔离库中加密存储，列表与日志中脱敏。
- 详细已知问题见仓库根目录 README。
