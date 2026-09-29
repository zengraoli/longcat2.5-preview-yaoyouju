import crypto from 'node:crypto';

/** AES-256-GCM 字段加密（身份隔离库中的手机号、姓名） */
const ALGO = 'aes-256-gcm';

export const DEFAULT_ENCRYPTION_KEY =
  '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

function getKey(): Buffer {
  const hex = process.env.IDENTITY_ENCRYPTION_KEY ?? DEFAULT_ENCRYPTION_KEY;
  if (!/^[0-9a-fA-F]{64}$/.test(hex)) {
    throw new Error('IDENTITY_ENCRYPTION_KEY 必须是 64 位十六进制字符串（32 字节）');
  }
  return Buffer.from(hex, 'hex');
}

export function encryptField(plain: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, getKey(), iv);
  const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv.toString('base64'), tag.toString('base64'), enc.toString('base64')].join(':');
}

export function decryptField(payload: string): string {
  const [ivB64, tagB64, dataB64] = payload.split(':');
  const decipher = crypto.createDecipheriv(ALGO, getKey(), Buffer.from(ivB64, 'base64'));
  decipher.setAuthTag(Buffer.from(tagB64, 'base64'));
  return Buffer.concat([
    decipher.update(Buffer.from(dataB64, 'base64')),
    decipher.final(),
  ]).toString('utf8');
}

/** 手机号脱敏：138****1234 */
export function maskPhone(phone: string): string {
  if (phone.length === 11) return `${phone.slice(0, 3)}****${phone.slice(7)}`;
    return phone.replace(/^(\d{3})\d{4}(\d{4})$/, '$1****$2');
}

/** 后台账号密码哈希（scrypt，演示用） */
export function hashPassword(password: string, salt?: string): string {
  const s = salt ?? crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, s, 32).toString('hex');
  return `${s}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':');
  const candidate = crypto.scryptSync(password, salt, 32).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(candidate, 'hex'));
}
