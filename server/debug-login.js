process.env.DB_PATH = './data/app.db';
const D = require('better-sqlite3');
const db = new D('./data/app.db');
const { verifyPassword } = require('./dist/database/crypto.js');
const admin = db.prepare('SELECT * FROM ADMIN_USER WHERE name = ?').get('超级管理-赵');
console.log('admin found:', !!admin, 'mfa:', admin.mfa_enabled, 'status:', admin.status);
console.log('password valid:', verifyPassword('Admin@123456', admin.password_hash));
const expectedTotp = process.env.ADMIN_TOTP_CODE ?? '123456';
console.log('totp match:', '123456' === expectedTotp);
