# 腰有据 · 用户端 Web

Vue 3 + Vite + TypeScript + Pinia + Vue Router。

## 启动

```bash
npm install
npm run dev        # 开发，http://localhost:5402（代理 /api 到 server 3400）
npm run build      # 构建（含类型检查）
npm run typecheck  # 类型检查
```

- 需要先启动 server（`server/` 目录，端口 3400）与 Worker（`npm run worker`）。
- 登录：任意 11 位手机号 + 验证码 `123456`；种子演示用户 `13800000001`。

## 页面

W01 登录与授权 / W02 当前情况工作台 / W03 一页分析与原文对照 / W04 问与解释 / W05 病程与记录 / W06 复诊准备（含打印预览与打印导出 PDF）/ W07 审核内容库 / W08 账户与数据。

## 已知问题（演示实现）
- 视频为本地占位，不引用外部资源。
- 导出 PDF 由浏览器打印生成。
- 案例投稿为二期功能，尚未开放。
