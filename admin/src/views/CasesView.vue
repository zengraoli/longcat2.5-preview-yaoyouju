<template>
  <AppLayout>
    <div class="cases">
      <div class="cases__header">
        <h1 class="cases__title">案例投稿审核</h1>
      </div>

      <TipBar type="warn">
        ⚠ 二期功能 · 首版隐藏（功能开关 case_cards = off）<br />
        进入条件：单独授权、预览、第三方信息去除、人工审核、撤回链路可用。禁止把“导出群聊后直接公开”或“删除昵称”当作充分匿名化。
      </TipBar>

      <div class="cases__grid">
        <!-- 左：投稿队列与风险检查 -->
        <div class="cases__main">
          <div class="card">
            <div class="card__header">
              <div class="card__title">投稿队列</div>
              <div class="card__header-tags">
                <span class="card__tag card__tag--warn">待审 {{ stats.pending }}</span>
                <span class="card__tag">已发布 {{ stats.published }}</span>
                <span class="card__tag card__tag--error">已撤回 {{ stats.withdrawn }}</span>
              </div>
            </div>
            <table class="table">
              <thead>
                <tr><th>投稿</th><th>摘要（经用户编辑的片段）</th><th>授权范围</th><th>状态</th></tr>
              </thead>
              <tbody>
                <tr
                  v-for="c in cases"
                  :key="c.id"
                  :class="{ 'table__row--active': selected?.id === c.id }"
                  @click="selected = c"
                >
                  <td class="table__id">{{ c.id }}</td>
                  <td class="table__title">{{ c.summary }}</td>
                  <td><StatusTag :label="c.scope" /></td>
                  <td><StatusTag :label="c.status" /></td>
                </tr>
                <tr v-if="cases.length === 0">
                  <td colspan="4" class="table__empty">暂无投稿</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="card">
            <div class="card__title">可识别风险检查（发布前必过）</div>
            <div class="risk-list">
              <div class="risk-item">
                <span class="risk-item__icon risk-item__icon--warn">⚠</span>
                <span class="risk-item__text">罕见经历 + 时间 + 医院 + 职业的组合是否可能指向具体个人</span>
                <StatusTag label="待人工判断" />
              </div>
              <div class="risk-item">
                <span class="risk-item__icon" :class="riskIcon('thirdParty')">⚠</span>
                <span class="risk-item__text">是否包含第三方（医生、家人、病友）可识别信息</span>
                <StatusTag :label="riskStatus('thirdParty')" :tone="riskTone('thirdParty')" />
              </div>
              <div class="risk-item">
                <span class="risk-item__icon" :class="riskIcon('orgInfo')">✓</span>
                <span class="risk-item__text">是否包含具体机构名称、地址、联系方式</span>
                <StatusTag :label="riskStatus('orgInfo')" :tone="riskTone('orgInfo')" />
              </div>
              <div class="risk-item">
                <span class="risk-item__icon" :class="riskIcon('image')">✓</span>
                <span class="risk-item__text">是否包含影像 / 报告截图</span>
                <StatusTag :label="riskStatus('image')" :tone="riskTone('image')" />
              </div>
              <div class="risk-item">
                <span class="risk-item__icon" :class="riskIcon('outcome')">✓</span>
                <span class="risk-item__text">结局是否为“未知 / 失访”并如实标注</span>
                <StatusTag :label="riskStatus('outcome')" :tone="riskTone('outcome')" />
              </div>
              <div class="risk-item">
                <span class="risk-item__icon" :class="caseSwitchOn ? 'risk-item__icon--ok' : ''">{{ caseSwitchOn ? '✓' : '—' }}</span>
                <span class="risk-item__text">撤回链路：公开卡片 / 索引 / 向量 / 缓存 / 派生摘要</span>
                <StatusTag :label="caseSwitchOn ? '已配置' : '案例卡片已关闭'" :tone="caseSwitchOn ? 'ok' : 'warn'" />
              </div>
            </div>
          </div>
        </div>

        <!-- 右：第三方信息去除 -->
        <div class="cases__side">
          <div v-if="selected" class="card">
            <div class="card__header">
              <div class="card__title">{{ selected.shortId }} · 第三方信息去除</div>
              <StatusTag :label="selected.status" />
            </div>
            <div class="detail-section">
              <div class="detail-section__label">用户提交（已由用户自行编辑）</div>
              <div class="quote">{{ selected.editedContent }}</div>
            </div>
            <div class="detail-section">
              <div class="detail-section__label">编辑建议（运营编辑，需用户确认）</div>
              <div class="quote quote--ok">{{ selected.suggestion }}</div>
            </div>
            <div class="detail-section">
              <div class="detail-section__label">授权范围（用户单独勾选）</div>
              <div v-for="(label, key) in consentItems" :key="key" class="consent-item">
                <span class="consent-item__check" :class="hasConsent(key) ? 'consent-item__check--ok' : 'consent-item__check--none'">{{ hasConsent(key) ? '✓' : '✕' }}</span>
                <span :class="{ 'consent-item__muted': !hasConsent(key) }">{{ label }}</span>
              </div>
            </div>
            <div class="detail-actions">
              <button class="btn btn--secondary btn--sm" @click="onReview('退回')">退回</button>
              <button class="btn btn--primary btn--sm" :disabled="selected?.status !== '待审'" @click="onReview('发布')">发布</button>
            </div>
          </div>

          <TipBar type="info">
            去标识化不等于永久匿名。发布许可、产品改进与模型训练用途分别说明；案例只扩展“其他人经历过什么”，不进入回答“医学证据支持什么”的知识库。
          </TipBar>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import AppLayout from '@/components/AppLayout.vue';
import StatusTag from '@/components/StatusTag.vue';
import TipBar from '@/components/TipBar.vue';
import { api } from '@/api/client';
import { reviewCase, listSwitches } from '@/api';

interface CaseRow {
  id: string;
  shortId: string;
  summary: string;
  scope: string;
  status: string;
  editedContent: string;
  suggestion: string;
}

const cases = ref<CaseRow[]>([]);
const selected = ref<CaseRow | null>(null);
const caseSwitchOn = ref(false);

const stats = computed(() => ({
  pending: cases.value.filter((c) => c.status === '待审').length,
  published: cases.value.filter((c) => c.status === '已发布').length,
  withdrawn: cases.value.filter((c) => c.status === '已撤回').length,
}));

const consentItems: Record<string, string> = {
  publish: '发表为匿名案例卡片',
  improve: '用于产品改进（解释缺口分析）',
  train: '用于模型训练',
};

/** 投稿实际勾选的授权范围（consentScope 为顿号/逗号分隔的中文键） */
function hasConsent(key: string): boolean {
  const scope = selected.value?.scope ?? '';
  const map: Record<string, string[]> = {
    publish: ['发表', 'publish'],
    improve: ['产品改进', 'improve'],
    train: ['训练', 'train'],
  };
  return (map[key] ?? []).some((k) => scope.includes(k));
}

/** 风险检查：根据投稿实际内容动态判断 */
function riskIcon(kind: string): string {
  const r = riskStatus(kind);
  return r === '已清除' || r === '无' || r === '已标注' ? 'risk-item__icon--ok' : 'risk-item__icon--error';
}
function riskTone(kind: string): 'ok' | 'error' {
  const r = riskStatus(kind);
  return r === '已清除' || r === '无' || r === '已标注' ? 'ok' : 'error';
}
function riskStatus(kind: string): string {
  const text = selected.value?.editedContent ?? '';
  if (kind === 'thirdParty') {
    return /(李某某|张某某|王某某|医生|家属|病友|家人)/.test(text) ? '待清除' : '已清除';
  }
  if (kind === 'orgInfo') {
    return /(市第.*医院|省人民医院|县医院|地址|电话|路\d+号)/.test(text) ? '待清除' : '已清除';
  }
  if (kind === 'image') {
    return /(截图|影像|报告图片|CT片|MRI片)/.test(text) ? '待清除' : '无';
  }
  if (kind === 'outcome') {
    return /(失访|未知|结局不明)/.test(text) ? '已标注' : '未涉及';
  }
  return '—';
}

/** 生成去标识化的编辑建议（去除可能的第三方称谓与机构名） */
function makeSuggestion(content: string): string {
  return content
    .replace(/李某某主任|张某某医生|王某某医生/g, '接诊医生')
    .replace(/市第一医院|省人民医院|县医院/g, '当地医院');
}

async function onReview(decision: string) {
  if (!selected.value) return;
  try {
    await reviewCase(selected.value.id, decision);
    toast(decision === '发布' ? '已发布' : '已退回');
    await load();
  } catch (e) {
    toast((e as Error).message);
  }
}

async function load() {
  try {
    const items = await api.get<Array<{ id: string; editedContent: string; consentScope: string; status: string }>>('/admin/cases');
    cases.value = items.map((item) => ({
      id: item.id,
      shortId: item.id.slice(0, 8),
      summary: item.editedContent.slice(0, 40) + (item.editedContent.length > 40 ? '…' : ''),
      scope: item.consentScope || '—',
      status: item.status,
      editedContent: item.editedContent,
      suggestion: makeSuggestion(item.editedContent),
    }));
    if (cases.value.length > 0 && !selected.value) selected.value = cases.value[0];
  } catch {
    // 加载失败不阻塞
  }
  try {
    const switches = await listSwitches();
    caseSwitchOn.value = !!switches.find((s) => s.key === '案例卡片')?.enabled;
  } catch {
    caseSwitchOn.value = false;
  }
}

function toast(msg: string) {
  const el = document.createElement('div');
  el.textContent = msg;
  el.style.cssText = 'position:fixed;top:20%;left:50%;transform:translateX(-50%);background:#1B2230;color:#fff;padding:12px 24px;border-radius:8px;z-index:9999;font-size:14px;max-width:80%;text-align:center;';
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2000);
}

onMounted(load);
</script>

<style scoped>
.cases__header {
  margin-bottom: 16px;
}
.cases__title {
  font-size: 20px;
  font-weight: 500;
  margin: 0;
}
.cases__grid {
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  gap: 16px;
  align-items: start;
}
.cases__main,
.cases__side {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.card {
  background: var(--surface);
  border-radius: 12px;
  padding: 20px;
}
.card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 8px;
}
.card__title {
  font-size: 16px;
  font-weight: 500;
}
.card__header-tags {
  display: flex;
  align-items: center;
  gap: 8px;
}
.card__tag {
  font-size: 12px;
  color: var(--text-2);
  background: var(--bg);
  padding: 2px 10px;
  border-radius: 4px;
}
.card__tag--warn {
  color: var(--warn);
  background: rgba(199, 119, 0, 0.1);
}
.card__tag--error {
  color: var(--error);
  background: rgba(217, 59, 59, 0.1);
}
.table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}
.table th {
  text-align: left;
  font-size: 12px;
  color: var(--text-2);
  font-weight: 500;
  padding: 8px 12px;
  border-bottom: 1px solid var(--border);
}
.table td {
  padding: 12px;
  border-bottom: 1px solid var(--border);
  vertical-align: middle;
}
.table__empty {
  text-align: center;
  color: var(--text-3);
  padding: 24px 0;
}
.table__row--active {
  background: var(--primary-light);
}
.table__id {
  font-family: monospace;
  font-size: 12px;
  color: var(--text-2);
}
.risk-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.risk-item {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
}
.risk-item__icon {
  flex-shrink: 0;
  width: 20px;
  text-align: center;
}
.risk-item__icon--ok { color: var(--ok); }
.risk-item__icon--warn { color: var(--warn); }
.risk-item__icon--error { color: var(--error); }
.risk-item__text {
  flex: 1;
  color: var(--text-2);
  line-height: 1.5;
}
.detail-section {
  margin-bottom: 16px;
}
.detail-section__label {
  font-size: 12px;
  color: var(--text-2);
  margin-bottom: 6px;
}
.quote {
  background: var(--bg);
  border-radius: 10px;
  padding: 12px;
  font-size: 13px;
  line-height: 1.6;
}
.quote--ok {
  background: rgba(30, 158, 90, 0.06);
}
.consent-item {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  font-size: 13px;
}
.consent-item__check {
  width: 18px;
  height: 18px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  flex-shrink: 0;
}
.consent-item__check--ok {
  background: var(--ok);
  color: #fff;
}
.consent-item__check--none {
  background: var(--border);
  color: var(--text-2);
}
.consent-item__muted {
  color: var(--text-3);
}
.detail-actions {
  display: flex;
  gap: 10px;
  margin-top: 8px;
}
.btn {
  min-height: 36px;
  padding: 0 14px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 500;
  border: none;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.btn--primary { background: var(--primary); color: #fff; }
.btn--secondary { background: var(--surface); color: var(--primary); border: 1px solid var(--primary); }
.btn--sm { min-height: 32px; padding: 0 12px; font-size: 13px; }
</style>
