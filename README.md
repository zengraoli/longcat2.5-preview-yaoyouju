# 腰有据 · 腰痛理解与复诊助手（演示实现）

> 演示项目，所有用户、报告、病程和医学内容均为虚构示例数据；产品不作诊断。

本仓库由 LongCat 2.5 Preview（美团）通过 opencode 编程助手，按 38 页 UI 设计稿和系统设计完成。需求见 `docs/brief.md`，任务见 `todo/`。

- 提交作者 `longcat-2.5-preview`：模型自己的提交
- 提交作者 `host`：主持者的初始化或人工介入

| 目录 | 内容 | 技术栈 |
|-|-|-|
| `server/` | API 服务与 AI 任务 Worker | Node.js + TypeScript + NestJS + SQLite |
| `app/` | 用户端 App | uni-app（H5 / Android） |
| `web/` | 用户端 Web | Vue 3 + Vite |
| `admin/` | 后台管理系统 | Vue 3 + Vite |

## 启动顺序

### 1. 服务端（端口 3400）

```bash
cd server
npm install
npm run start:dev
```

### 2. AI Worker（独立进程，可选）

```bash
cd server
npm run worker
```

### 3. 用户端 App（端口 5401）

```bash
cd app
npm install
npm run dev:h5
```

### 4. 用户端 Web（端口 5402）

```bash
cd web
npm install
npm run start:dev
```

### 5. 后台管理系统（端口 5403）

```bash
cd admin
npm install
npm run start:dev
```

## 默认账号

### 用户端（App / Web）
- 手机号：`13800001111` / `13900002222`
- 验证码：`123456`

### 后台（Admin）
| 角色 | 账号 | 密码 | TOTP |
|------|------|------|------|
| 运营编辑 | 运营编辑员 | admin123 | 123456 |
| 临床审核 | 临床审核员 | admin123 | 123456 |
| 技术 | 技术员 | admin123 | 123456 |
| 合规 | 合规专员 | admin123 | 123456 |
| 超级管理 | 超级管理员 | admin123 | 123456 |

## 演示实现与原设计的差异

| 原设计 | 本项目 |
|-|-|
| PostgreSQL 业务库 | SQLite 文件 `server/data/app.db` |
| 身份隔离库（字段加密） | 独立 SQLite 文件 `server/data/identity.db`，AES-256-GCM 加密 |
| Redis Streams 任务队列 | SQLite 任务表 + Worker 轮询 |
| pgvector 医学证据向量库 | 证据片段表 + 关键词检索 |
| 大模型服务商 | 本地模拟实现，按模板生成 |
| OCR | 模拟实现，返回示例文本 |
| 短信 | 验证码固定 123456，只写日志 |
| 后台 TOTP | 演示固定码 123456 |
| 对象存储 / 视频 CDN | 本地文件与本地占位图 |
| 复诊摘要导出 PDF | 文本复制必做；PDF 通过浏览器打印生成 |

## 已知问题

1. 分析任务当前在 API 服务内同步处理（非独立 Worker 进程），`npm run worker` 保留供后续扩展。
2. 大模型适配层为本地模拟实现，生成内容基于模板和证据片段，非真实模型推理。
3. 案例投稿审核功能为二期预留，发布按钮默认关闭。
4. 部分后台页面（评测集详情、版本链详情）为简化实现，仅展示核心信息。
5. 推送曾遇到网络问题，部分提交可能需要重新推送。
