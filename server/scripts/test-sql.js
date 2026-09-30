const Database = require('better-sqlite3');
const db = new Database(':memory:');
db.exec('CREATE TABLE MODEL_RELEASE (id TEXT, model_name TEXT, prompt_version TEXT)');
db.prepare('INSERT INTO MODEL_RELEASE VALUES (?, ?, ?)').run('r1', 'm1', 'p1');
const sql = 'SELECT model_name || "/" || prompt_version AS v FROM MODEL_RELEASE WHERE id = ?';
console.log('SQL:', JSON.stringify(sql));
try {
  const rows = db.prepare(sql).all('r1');
  console.log('ok:', rows);
} catch (e) {
  console.error('ERR:', e.message);
}
