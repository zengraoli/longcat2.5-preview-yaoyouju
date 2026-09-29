# 腰有据 · 服务端（API + AI 任务 Worker）

NestJS + TypeScript + SQLite。业务库 `data/app.db` 与身份隔离库 `data/identity.db` 分开，手机号、姓名用 AES-256-GCM 加密存储（密钥从环境变量 `IDENTITY_ENCRYPTION_KEY` 读取，见 `.env.example`）。

## 启动

```bash
npm install
cp .env.example .env   # 可按需修改；不复制也能用默认值启动
npm run build
npm run dev            # API 服务，http://localhost:3400
npm run worker         # AI 任务 Worker（独立进程，轮询消费分析任务）
```

- API 与 Worker 是两个进程，都需要启动；不启动 Worker 时分析任务保持排队。
- 启动时自动建表并写入种子数据，重复启动不会重复写入。
- 接口文档页：`http://localhost:3400/docs`
- 冒烟脚本：`npm run smoke`（自动启动 API 与 Worker，跑通完整流程后关闭）

## 默认账号

### 用户端
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

## 测试

```bash
npm run typecheck   # 类型检查
npm test            # 单元与集成测试
```

## 已知问题（演示实现）
- 大模型适配层为本地模拟实现（`src/ai/llm-adapter.ts`），按模板和证据片段生成，不调用任何外部服务。
- OCR 为模拟实现，返回示例文本；主路径是粘贴文字。
- 短信验证码固定 `123456`，只写日志（手机号脱敏）。
- 复诊摘要导出 PDF 由前端打印生成，接口返回文本。
