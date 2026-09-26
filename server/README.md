# 腰有据 · 服务端

NestJS + TypeScript + SQLite 实现的 API 服务与 AI Worker。

## 启动方式

### API 服务（端口 3400）

```bash
npm install
npm run start:dev
```

### AI Worker（独立进程，轮询消费分析任务）

```bash
npm run worker
```

### 冒烟测试

```bash
npm run smoke
```

## 默认账号

### 用户端
- 手机号：`13800001111` / `13900002222`（种子数据）
- 验证码：`123456`

### 后台
| 角色 | 账号 | 密码 | TOTP |
|------|------|------|------|
| 运营编辑 | 运营编辑员 | admin123 | 123456 |
| 临床审核 | 临床审核员 | admin123 | 123456 |
| 技术 | 技术员 | admin123 | 123456 |
| 合规 | 合规专员 | admin123 | 123456 |
| 超级管理 | 超级管理员 | admin123 | 123456 |

## 环境变量

见 `.env.example`。

## 接口文档

启动后访问 `/docs` 查看 Swagger UI。
