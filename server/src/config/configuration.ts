export default () => ({
  port: parseInt(process.env.PORT || '3400', 10),
  database: {
    path: process.env.DATABASE_PATH || './data/app.db',
  },
  identityDatabase: {
    path: process.env.IDENTITY_DATABASE_PATH || './data/identity.db',
  },
  encryptionKey: process.env.ENCRYPTION_KEY || 'demo-key-32-chars-long-aes-gcm',
  smsCode: process.env.SMS_CODE || '123456',
  adminTotpCode: process.env.ADMIN_TOTP_CODE || '123456',
  env: process.env.NODE_ENV || 'development',
});
