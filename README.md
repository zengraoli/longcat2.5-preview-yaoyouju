# 腰有据 · 腰痛理解与复诊助手（演示实现）

> 演示项目，所有用户、报告、病程和医学内容均为虚构示例数据；产品不作诊断。

帮助腰痛用户看懂检查报告、整理病程、准备复诊：用户录入当前变化和报告，系统生成“一页理性分析”（已知 / 解释 / 未知 / 下一步 / 视频），并整理成复诊摘要带给医生。

本仓库由 LongCat 2.5 Preview（美团）通过 pi 编程助手，按 38 页 UI 设计稿和系统设计完成。需求见 `docs/brief.md`，系统设计见 `docs/system-design.md`，设计稿见 `docs/design/`，任务见 `todo/`。

- 提交作者 `longcat-2.5-preview`：模型自己的提交
- 提交作者 `host`：主持者的初始化或人工介入

## 目录结构

| 目录 | 内容 | 技术栈 |
|-|-|-|
| `server/` | API 服务与 AI 任务 Worker | Node.js 24 + TypeScript + NestJS + SQLite |
| `app/` | 用户端 App | uni-app（Vue 3 + Vite + TypeScript），H5 / Android |
| `web/` | 用户端 Web | Vue 3 + Vite + TypeScript + Pinia + Vue Router |
| `admin/` | 后台管理系统 | Vue 3 + Vite + TypeScript + Pinia + Vue Router |
| `docs/` | 需求、系统设计、设计稿 | - |

## 启动顺序

```bash
# 1. 服务端（API，端口 3400）
cd server
npm install
npm run build
npm run dev          # 或 npm start

# 2. AI 任务 Worker（独立进程，轮询消费分析任务）
cd server
npm run worker

# 3. 用户端 App（H5，端口 5401）
cd app
npm install
npm run dev:h5

# 4. 用户端 Web（端口 5402）
cd web
npm install
npm run dev

# 5. 后台管理系统（端口 5403）
cd admin
npm install
npm run dev
```

- API 与 Worker 是两个进程，都需要启动；不启动 Worker 时分析任务保持排队。
- App / Web 的 `/api` 请求通过 Vite 代理转发到 server（3400）。
- 服务端启动时自动建表并写入种子数据，重复启动不会重复写入。
- 接口文档页：`http://localhost:3400/docs/`
- 冒烟脚本：`cd server && npm run smoke`

## 默认账号

### 用户端（App / Web）
- 任意 11 位手机号 + 验证码 `123456`
- 种子演示用户：`13800000001`（带完整病程、报告与分析）、`13800000002`

### 后台（账号密码 + TOTP 固定码 `123456`）
| 账号 | 密码 | 角色 |
|-|-|-|
| 运营编辑-林 | Admin@123456 | 运营编辑 |
| 临床审核-沈 | Admin@123456 | 临床审核 |
| 技术-程 | Admin@123456 | 技术 |
| 合规-顾 | Admin@123456 | 合规 |
| 超级管理-赵 | Admin@123456 | 超级管理 |

## 演示实现与原设计的差异

| 原设计 | 本项目 |
|-|-|
| PostgreSQL 业务库 | SQLite 文件 `server/data/app.db` |
| 身份隔离库（字段加密） | 独立 SQLite 文件 `server/data/identity.db`；手机号、姓名用 AES-256-GCM 加密 |
| Redis Streams 任务队列 | SQLite 任务表；Worker 为独立进程 `npm run worker`，轮询消费 |
| pgvector 医学证据向量库 | 证据片段表 + 本地检索（关键词匹配），只在证据库内检索 |
| 大模型服务商 | 可替换的适配层接口；默认本地模拟实现，按模板和证据片段生成 |
| OCR | 模拟实现，返回示例文本；主路径是粘贴文字 |
| 短信 | 验证码固定 `123456`，只写日志（手机号脱敏） |
| 后台 TOTP | 演示固定码 `123456` |
| 对象存储 / 视频 CDN | 本地文件与本地占位图，不引用外部资源 |
| 复诊摘要导出 PDF | 文本复制必做；PDF 通过浏览器打印生成 |

## 已知问题

1. **大模型为本地模拟实现**：分析内容按模板和证据片段生成，不调用任何外部服务；输出质量不代表真实模型水平。
2. **视频为本地占位**：App / Web 的视频详情页使用占位图，不引用外部视频资源。
3. **案例投稿为二期功能**：后台 B12 页面已预留，功能开关 `case_cards` 默认关闭。
4. **审计日志导出需超管审批**：演示为提示，未实现审批流。
5. **App 端 Android 打包未验证**：以 H5 构建验收，Android 打包为可选项。
6. **评测门禁的通过率为模拟值**：本地模拟实现，不反映真实模型评测结果。
7. **身份库与业务库的数据一致性**：演示环境的种子数据在异常中断后可能需要重建（删除 `server/data/` 重启即可）。
