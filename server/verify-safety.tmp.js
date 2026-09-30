/**
 * 安全规则复查：50+ 条反馈里没有列出的红旗说法、否定说法与正常报告描述
 */
const { matchRedFlags, matchOutOfScope } = require('./dist/modules/safety/rules.js');

let passed = 0;
let failed = 0;
function ok(name) { passed++; console.log(`  ✓ ${name}`); }
function fail(name, err) { failed++; console.error(`  ✗ ${name}: ${err}`); }
function check(name, cond, detail) { if (cond) ok(name); else fail(name, detail ?? '断言失败'); }

// 反馈里没有列出的红旗说法（应触发）
const newRedFlags = [
  '大小便失禁了', '尿失禁', '大便失禁', '控制不了小便', '小便控制不住',
  '会阴部麻木', '会阴发麻', '肛门周围麻木', '肛周发麻', '屁股发麻',
  '腿越来越没力气', '腿越来越软', '脚抬不起来', '走路脚拖地', '脚背翘不起来',
  '蹲下站不起来', '上楼梯腿抬不动', '踮不起脚尖', '脚使不上劲',
  '夜里疼醒', '半夜疼醒', '疼得睡不着', '痛得打滚', '止痛药压不住',
  '从梯子上摔下来', '从高处跌落', '滑倒后臀部着地', '撞车后腰痛', '摔倒后腰痛',
  '低烧三天了', '一直低烧', '打寒战', '发抖怕冷', '身上很烫',
  '体重掉了10斤', '瘦了15斤', '三个月瘦了20斤', '明显消瘦',
  '以前得过肿瘤', '有癌症病史', '做过化疗', '得过恶性肿瘤',
  '尿潴留', '排尿无力', '尿不干净', '一咳嗽就漏尿', '漏尿',
  '两腿之间麻木', '裆部发麻', '肛门没感觉', '屁股麻了',
  '大小便失禁没有好转', '没有外伤但大小便失禁',
];
// 反馈里没有列出的否定/正常描述（不应触发）
const newNormals = [
  '大小便能自己控制', '大小便控制正常', '大小便没有异常', '大小便无异常',
  '没有大小便失禁', '大小便失禁已排除', '大小便都正常',
  '会阴区感觉正常', '会阴区感觉无异常', '鞍区感觉正常', '鞍区感觉无减退',
  '马尾神经无受压', '马尾神经未受压', '马尾神经走行自然', '马尾神经未见受压',
  '不存在马尾综合征表现', '未见马尾综合征表现', '马尾神经根未见明显受压',
  '没有外伤', '无外伤史', '否认外伤', '没有发烧', '无发热', '不发烧',
  '孩子发烧了', '家人发烧了', '为了健康瘦了2斤', '减肥瘦了3斤',
  '加班很累', '熬夜后很累', '手指被门撞到了', '脚趾踢到了',
];

console.log('=== 新红旗说法（应触发）===');
for (const text of newRedFlags) {
  const hits = matchRedFlags(text);
  check(`红旗: ${text}`, hits.length > 0, '未触发');
}

console.log('=== 新否定/正常描述（不应触发）===');
for (const text of newNormals) {
  const hits = matchRedFlags(text);
  check(`正常: ${text}`, hits.length === 0, `误触发 ${hits.map((h) => h.code).join(',')}`);
}

console.log('=== 越界提问 ===');
const oos = ['要不要手术', '需要手术吗', '该不该手术', '吃什么药', '用什么药', '是不是腰椎间盘突出', '是什么病'];
for (const text of oos) {
  check(`越界: ${text}`, matchOutOfScope(text).length > 0, '未触发');
}
check('正常提问不越界', matchOutOfScope('久坐后腰痛怎么办').length === 0);

console.log(`\n安全规则：${passed} 通过，${failed} 失败`);
process.exit(failed > 0 ? 1 : 0);
