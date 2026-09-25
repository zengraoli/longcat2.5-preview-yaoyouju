import { Injectable } from '@nestjs/common';
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto';

@Injectable()
export class EncryptionService {
  private readonly key: Buffer;

  constructor() {
    const keyStr = process.env.ENCRYPTION_KEY || 'demo-key-32-chars-long-aes-gcm';
    this.key = createHash('sha256').update(keyStr).digest();
  }

  encrypt(plaintext: string): string {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.key, iv);
    const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted.toString('hex');
  }

  decrypt(ciphertext: string): string {
    const parts = ciphertext.split(':');
    if (parts.length !== 3) throw new Error('Invalid ciphertext format');
    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = Buffer.from(parts[2], 'hex');
    const decipher = createDecipheriv('aes-256-gcm', this.key, iv);
    decipher.setAuthTag(authTag);
    return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
  }
}
