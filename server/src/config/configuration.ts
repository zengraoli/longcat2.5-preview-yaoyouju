/** 配置从环境变量读取，仓库只提供 .env.example */
export default () => ({
  port: parseInt(process.env.PORT ?? '3400', 10),
  dbPath: process.env.DB_PATH ?? './data/app.db',
  identityDbPath: process.env.IDENTITY_DB_PATH ?? './data/identity.db',
  identityEncryptionKey:
    process.env.IDENTITY_ENCRYPTION_KEY ??
    '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
  sessionSecret: process.env.SESSION_SECRET ?? 'dev-only-session-secret-change-me',
  sessionTtlHours: parseInt(process.env.SESSION_TTL_HOURS ?? '72', 10),
  smsCode: process.env.SMS_CODE ?? '123456',
  adminTotpCode: process.env.ADMIN_TOTP_CODE ?? '123456',
  adminLockThreshold: parseInt(process.env.ADMIN_LOCK_THRESHOLD ?? '5', 10),
  adminLockMinutes: parseInt(process.env.ADMIN_LOCK_MINUTES ?? '15', 10),
  workerPollMs: parseInt(process.env.WORKER_POLL_MS ?? '1000', 10),
});
