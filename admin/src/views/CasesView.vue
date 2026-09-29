<template>
  <AppLayout>
    <div class="cases">
      <div class="cases__header">
        <h1 class="cases__title">案例投稿审核</h1>
      </div>

      <TipBar type="warn">
        ⚠ 二期功能 · 首版隐藏（功能开关 case_cards = off）<br />
        进入条件：单独授权、预览、第三方信息去除、人工审核、撤回链路可用。禁止把“导出群聊后直接公开”或“删除昵称”当作充分匿名化。以下为界面预留，数据为演示。
      </TipBar>

      <div class="cases__grid">
        <!-- 左：投稿队列与风险检查 -->
        <div class="cases__main">
          <div class="card">
            <div class="card__header">
              <div class="card__title">投稿队列</div>
              <div class="card__header-tags">
                <span class="card__tag card__tag--warn">待审 2</span>
                <span class="card__tag">已发布 0</span>
                <span class="card__tag card__tag--error">已撤回 0</span>
              </div>
            </div>
            <table class="table">
              <thead>
                <tr><th>投稿</th><th>摘要（经用户编辑的片段）</th><th>授权范围</th><th>第三方信息</th><th>状态</th></tr>
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
                  <td><StatusTag :label="c.thirdParty" :tone="c.thirdPartyTone" /></td>
                  <td><StatusTag :label="c.status" /></td>
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
                <span class="risk-item__icon risk-item__icon--error">⚠</span>
                <span class="risk-item__text">是否包含第三方（医生、家人、病友）可识别信息</span>
                <StatusTag label="检测到 2 处（见右侧）" tone="error" />
              </div>
              <div class="risk-item">
                <span class="risk-item__icon risk-item__icon--ok">✓</span>
                <span class="risk-item__text">是否包含具体机构名称、地址、联系方式</span>
                <StatusTag label="已清除" />
              </div>
              <div class="risk-item">
                <span class="risk-item__icon risk-item__icon--ok">✓</span>
                <span class="risk-item__text">是否包含影像 / 报告截图</span>
                <StatusTag label="无" />
              </div>
              <div class="risk-item">
                <span class="risk-item__icon risk-item__icon--ok">✓</span>
                <span class="risk-item__text">结局是否为“未知 / 失访”并如实标注</span>
                <StatusTag label="已标注：随访中" />
              </div>
              <div class="risk-item">
                <span class="risk-item__icon risk-item__icon--ok">✓</span>
                <span class="risk-item__text">撤回链路：公开卡片 / 索引 / 向量 / 缓存 / 派生摘要</span>
                <StatusTag label="已配置" />
              </div>
            </div>
          </div>
        </div>

        <!-- 右：第三方信息去除 -->
        <div class="cases__side">
          <div v-if="selected" class="card">
            <div class="card__header">
              <div class="card__title">{{ selected.id }} · 第三方信息去除</div>
              <StatusTag label="待审" />
            </div>
            <div class="detail-section">
              <div class="detail-section__label">用户提交（已由用户自行编辑）</div>
              <div class="quote">
                复查那天是<span class="highlight">李某某主任</span>看的，他说和上次比没有明显变化，让我继续按之前的方案，在<span class="highlight">市第一医院</span>做康复。
              </div>
            </div>
            <div class="detail-section">
              <div class="detail-section__label">编辑建议（运营编辑，需用户确认）</div>
              <div class="quote quote--ok">
                复查那天是接诊医生看的，医生说和上次比没有明显变化，让我继续按之前的方案，在当地医院做康复。
              </div>
            </div>
            <div class="detail-section">
              <div class="detail-section__label">授权范围（用户单独勾选）</div>
              <div class="consent-item">
                <span class="consent-item__check consent-item__check--ok">✓</span>
                <span>发表为匿名案例卡片</span>
              </div>
              <div class="consent-item">
                <span class="consent-item__check consent-item__check--ok">✓</span>
                <span>用于产品改进（解释缺口分析）</span>
              </div>
              <div class="consent-item">
                <span class="consent-item__check consent-item__check--none">✕</span>
                <span class="consent-item__muted">用于模型训练</span>
              </div>
            </div>
            <div class="detail-actions">
              <button class="btn btn--secondary btn--sm">发送编辑建议给用户</button>
              <button class="btn btn--secondary btn--sm">退回</button>
              <button class="btn btn--primary btn--sm" disabled>发布（功能未开启）</button>
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
import { ref } from 'vue';
import AppLayout from '@/components/AppLayout.vue';
import StatusTag from '@/components/StatusTag.vue';
import TipBar from '@/components/TipBar.vue';

interface CaseRow {
  id: string;
  summary: string;
  scope: string;
  thirdParty: string;
  thirdPartyTone: 'ok' | 'warn' | 'error' | 'info' | 'neutral';
  status: string;
}

const cases = ref<CaseRow[]>([
  { id: '#CS-0003', summary: '保守治疗 6 周后的复诊记录与结果（片段 2/5）', scope: '发表 + 产品改进', thirdParty: '检测到 2 处', thirdPartyTone: 'error', status: '待审' },
  { id: '#CS-0002', summary: '第一次拿到 MRI 报告时的困惑与后来的理解', scope: '仅发表', thirdParty: '已清除', thirdPartyTone: 'ok', status: '待审' },
  { id: '#CS-0001', summary: '（用户已撤回投稿）', scope: '—', thirdParty: '—', thirdPartyTone: 'neutral', status: '已撤回' },
]);

const selected = ref<CaseRow>(cases.value[0]);
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
  grid-template-columns: 1.2fr 1fr;
  gap: 16px;
  align-items: start;
}
.cases__main {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
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
  gap: 8px;
}
.card__tag {
  font-size: 12px;
  color: var(--text-2);
  background: var(--bg);
  padding: 2px 10px;
  border-radius: 4px;
}
.card__tag--warn { color: var(--warn); background: rgba(199, 119, 0, 0.1); }
.card__tag--error { color: var(--error); background: rgba(217, 59, 59, 0.1); }
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
.table__row--active {
  background: var(--primary-light);
}
.table__id {
  font-weight: 500;
  white-space: nowrap;
}
.table__title {
  font-weight: 500;
}
.risk-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.risk-item {
  display: flex;
  align-items: center;
  gap: 10px;
}
.risk-item__icon {
  font-size: 14px;
  flex-shrink: 0;
}
.risk-item__icon--ok { color: var(--ok); }
.risk-item__icon--warn { color: var(--warn); }
.risk-item__icon--error { color: var(--error); }
.risk-item__text {
  font-size: 13px;
  flex: 1;
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
  border-radius: 8px;
  padding: 12px;
  font-size: 13px;
  line-height: 1.6;
}
.quote--ok {
  background: rgba(30, 158, 90, 0.06);
}
.highlight {
  color: var(--error);
  background: rgba(217, 59, 59, 0.1);
  padding: 0 2px;
  border-radius: 2px;
}
.consent-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  margin-bottom: 8px;
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
  background: var(--bg);
  color: var(--text-3);
}
.consent-item__muted {
  color: var(--text-3);
}
.detail-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
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
.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
