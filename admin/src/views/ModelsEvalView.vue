<template>
  <AppLayout>
    <div class="eval">
      <div class="eval__header">
        <h1 class="eval__title">模型与评测 › 评测集与回归</h1>
        <div class="eval__search">
          <input v-model="search" class="eval__search-input" placeholder="搜索评测集 / 用例" @input="onSearch" />
        </div>
      </div>

      <div class="eval__grid">
        <!-- 左：评测集列表 -->
        <div class="eval__main">
          <div class="card">
            <div class="card__header">
              <div class="card__title">评测集</div>
              <button v-if="canRunEval" class="btn btn--secondary btn--sm" @click="showCreate = true">＋ 新建</button>
            </div>
            <div
              v-for="set in filteredSets"
              :key="set.id"
              class="eval-set"
              :class="{ 'eval-set--active': selectedSet?.id === set.id }"
              @click="selectedSet = set"
            >
              <div class="eval-set__body">
                <div class="eval-set__name">{{ set.name }}</div>
                <div class="eval-set__meta">{{ set.caseCount }} 例 · 去标识化 · 门禁：{{ set.threshold }}</div>
              </div>
              <span class="eval-set__dot" :class="set.ok ? 'eval-set__dot--ok' : 'eval-set__dot--error'" />
            </div>
            <p v-if="filteredSets.length === 0" class="card__note">暂无评测集</p>
          </div>

          <TipBar type="info">
            评测集与提示示例分离管理；真实失败案例去标识化后加入；不用同一批公开示例反复优化后宣称泛化能力提高。
          </TipBar>
        </div>

        <!-- 右：评测集详情 -->
        <div class="eval__side">
          <div v-if="selectedSet" class="card">
            <div class="card__header">
              <div class="card__title">{{ selectedSet.name }}</div>
              <div class="card__header-tags">
                <span class="card__meta">{{ selectedSet.caseCount }} 例 · 去标识化 · 门禁：{{ selectedSet.threshold }}</span>
                <button v-if="canRunEval" class="btn btn--secondary btn--sm" @click="showImport = true">导入用例</button>
                <button v-if="canRunEval" class="btn btn--primary btn--sm" @click="onRunCurrent">⟳ 对当前候选运行</button>
              </div>
            </div>
            <p class="card__note">{{ selectedSet.desc }}</p>
            <div class="eval-stats">
              <div class="eval-stat">
                <div class="eval-stat__label">最近运行</div>
                <div class="eval-stat__value">{{ selectedSet.lastRun }}</div>
              </div>
              <div class="eval-stat">
                <div class="eval-stat__label">结果</div>
                <div class="eval-stat__value" :class="selectedSet.passed ? 'eval-stat__value--ok' : 'eval-stat__value--error'">
                  {{ selectedSet.result }}
                </div>
              </div>
              <div class="eval-stat">
                <div class="eval-stat__label">历史运行</div>
                <div class="eval-stat__value">{{ selectedSet.history }} 次</div>
              </div>
            </div>
          </div>

          <!-- 运行记录 -->
          <div class="card">
            <div class="card__title">运行记录</div>
            <table class="table">
              <thead>
                <tr><th>运行</th><th>发布组合</th><th>结果</th><th>通过 / 用例</th><th>触发原因</th><th>时间</th></tr>
              </thead>
              <tbody>
                <tr v-for="(r, i) in runRecords" :key="i">
                  <td class="table__id">{{ r.id }}</td>
                  <td>{{ r.release }}</td>
                  <td><StatusTag :label="r.result" /></td>
                  <td>{{ r.passed }}</td>
                  <td class="table__reason">{{ r.reason }}</td>
                  <td>{{ r.time }}</td>
                </tr>
                <tr v-if="runRecords.length === 0">
                  <td colspan="6" class="table__empty">暂无运行记录</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- 失败用例 -->
          <div v-if="failedCases.length > 0" class="card">
            <div class="card__header">
              <div class="card__title">失败用例（去标识化）</div>
              <span class="card__tag card__tag--danger">{{ failedCases.length }} 例</span>
            </div>
            <div v-for="(c, i) in failedCases" :key="i" class="failed-case">
              <div class="failed-case__header">
                <span class="failed-case__id">{{ c.caseKey }}</span>
                <span class="failed-case__tag">自动比对 + 人工复核</span>
              </div>
              <div class="failed-case__rows">
                <div class="failed-case__row">
                  <span class="failed-case__label">输入</span>
                  <span class="failed-case__value">{{ c.input }}</span>
                </div>
                <div class="failed-case__row">
                  <span class="failed-case__label">期望</span>
                  <span class="failed-case__value">{{ c.expected }}</span>
                </div>
                <div class="failed-case__row">
                  <span class="failed-case__label">实际</span>
                  <span class="failed-case__value failed-case__value--error">{{ c.actual }}</span>
                </div>
                <div class="failed-case__row">
                  <span class="failed-case__label">判定</span>
                  <span class="failed-case__value">不通过</span>
                </div>
              </div>
              <div class="failed-case__actions">
                <button v-if="canRunEval" class="btn btn--primary btn--sm" @click="onMarkFixed(c)">标记已修复并重跑</button>
                <button class="btn btn--secondary btn--sm" @click="c.showOutput = !c.showOutput">查看完整输出（去标识化）</button>
              </div>
              <p v-if="c.showOutput" class="card__note">完整输出（去标识化）：{{ c.actual }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 新建评测集弹层 -->
      <Modal :open="showCreate" title="新建评测集" confirm-text="创建" @close="showCreate = false" @confirm="confirmCreateSet">
        <div class="form-field">
          <label class="form-label">评测集名称</label>
          <input v-model="newSetName" class="form-input" placeholder="如：危险遗漏（红旗场景）" :maxlength="100" />
        </div>
        <div class="form-field">
          <label class="form-label">用例数</label>
          <input v-model.number="newSetCount" type="number" class="form-input" min="1" />
        </div>
      </Modal>

      <!-- 导入用例弹层 -->
      <Modal :open="showImport" title="导入用例（去标识化）" confirm-text="导入" @close="showImport = false" @confirm="confirmImport">
        <p class="modal__hint">粘贴去标识化后的用例内容（每行一条，格式：输入 | 期望）</p>
        <textarea v-model="importText" class="modal__textarea" placeholder="报告：“右侧神经根受压可能”；自述：“左侧疼痛” | 指出侧别不一致" :maxlength="2000" />
      </Modal>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import AppLayout from '@/components/AppLayout.vue';
import StatusTag from '@/components/StatusTag.vue';
import TipBar from '@/components/TipBar.vue';
import Modal from '@/components/Modal.vue';
import { formatBeijing } from '@/utils/time';
import { useAuthStore } from '@/stores/auth';
import { api } from '@/api/client';
import { listEvalSets, listReleases, runEval } from '@/api';
import type { EvalSet, Release } from '@/api/types';

const auth = useAuthStore();
const canRunEval = computed(() => (auth.session?.permissions ?? []).includes('eval:run'));

interface EvalSetRow extends EvalSet {
  threshold: string;
  desc: string;
  lastRun: string;
  result: string;
  passed: boolean;
  history: number;
  ok: boolean;
}

interface RunRecord {
  id: string;
  release: string;
  result: string;
  passed: string;
  reason: string;
  time: string;
}

interface FailedCase {
  caseId: string;
  caseKey: string;
  input: string;
  expected: string;
  actual: string;
  showOutput: boolean;
}

const evalSets = ref<EvalSetRow[]>([]);
const selectedSet = ref<EvalSetRow | null>(null);
const runRecords = ref<RunRecord[]>([]);
const failedCases = ref<FailedCase[]>([]);

// 切换评测集时刷新失败用例列表
watch(selectedSet, () => { void loadFailedCases(); });
const releases = ref<Release[]>([]);
const search = ref('');
const showCreate = ref(false);
const newSetName = ref('');
const newSetCount = ref(10);
const showImport = ref(false);
const importText = ref('');

const filteredSets = computed(() => {
  if (!search.value.trim()) return evalSets.value;
  const q = search.value.trim().toLowerCase();
  return evalSets.value.filter((s) => s.name.toLowerCase().includes(q));
});

async function onRunCurrent() {
  const candidate = releases.value.find((r) => r.status === '候选') ?? releases.value[0];
  if (!candidate) {
    toast('没有可运行的发布组合');
    return;
  }
  try {
    await runEval(candidate.id);
    toast('评测已运行');
    await load();
  } catch (e) {
    toast((e as Error).message);
  }
}

async function onMarkFixed(c: FailedCase) {
  try {
    await api.post(`/models/eval-cases/${c.caseId}/fix`, {});
    toast('已标记修复，重跑评测集');
    c.actual = c.expected;
    await load();
  } catch (e) {
    toast((e as Error).message);
  }
}

async function confirmCreateSet() {
  if (!newSetName.value.trim()) {
    toast('请填写评测集名称');
    return;
  }
  try {
    await api.post('/models/eval-sets', { name: newSetName.value.trim(), caseCount: newSetCount.value });
    toast('已创建评测集');
    showCreate.value = false;
    newSetName.value = '';
    await load();
  } catch (e) {
    toast((e as Error).message);
  }
}

async function confirmImport() {
  if (!selectedSet.value) return;
  if (!importText.value.trim()) {
    toast('请粘贴用例内容');
    return;
  }
  try {
    await api.post(`/models/eval-sets/${selectedSet.value.id}/cases`, { content: importText.value });
    toast('已导入用例');
    showImport.value = false;
    importText.value = '';
    await load();
  } catch (e) {
    toast((e as Error).message);
  }
}

function onSearch() {
  // 搜索在 filteredSets 计算属性中实时生效
}

async function load() {
  try {
    const [sets, rels] = await Promise.all([listEvalSets(), listReleases()]);
    releases.value = rels;
    // 为每个评测集计算真实运行数据
    const rows = await Promise.all(
      sets.map(async (s) => {
        const runs = await api.get<Array<{ id: string; result: string; createdAt: string; metrics: { 通过率?: number } }>>(
          `/models/eval-sets/${s.id}/runs`,
        );
        const latest = runs[0];
        const passed = latest ? latest.result === '通过' : true;
        const metrics = latest?.metrics ?? {};
        return {
          ...s,
          threshold: '≥ 80%',
          desc: s.name,
          lastRun: latest ? latest.id.slice(0, 12) : '—',
          result: latest ? (metrics.通过率 !== undefined ? `${Math.round(metrics.通过率 * 100)}%` : latest.result) : '—',
          passed,
          history: runs.length,
          ok: passed,
        } as EvalSetRow;
      }),
    );
    evalSets.value = rows;
    if (!selectedSet.value && rows.length > 0) selectedSet.value = rows[0];
    await loadRunRecords();
    await loadFailedCases();
  } catch {
    // 加载失败不阻塞
  }
}

async function loadRunRecords() {
  try {
    const records = await api.get<Array<{ id: string; modelReleaseId: string; evalSetName: string; result: string; createdAt: string; trigger: string | null; metrics: { 通过率?: number; 用例数?: number; 通过数?: number } }>>(
      '/models/eval-runs',
    );
    runRecords.value = records.slice(0, 10).map((r) => {
      const metrics = r.metrics ?? {};
      const total = metrics.用例数 ?? 0;
      const passedCount = metrics.通过数 ?? 0;
      return {
        id: r.id,
        release: r.modelReleaseId,
        result: r.result,
        passed: `${passedCount} / ${total}`,
        reason: r.trigger ?? '手动运行',
        time: formatBeijing(r.createdAt),
      };
    });
  } catch {
    runRecords.value = [];
  }
}

async function loadFailedCases() {
  if (!selectedSet.value) {
    failedCases.value = [];
    return;
  }
  try {
    const cases = await api.get<Array<{ id: string; caseKey: string; input: string; expected: string; actual: string }>>(
      `/models/eval-sets/${selectedSet.value.id}/cases?result=不通过`,
    );
    failedCases.value = cases.map((c) => ({ caseId: c.id, caseKey: c.caseKey, input: c.input, expected: c.expected, actual: c.actual, showOutput: false }));
  } catch {
    failedCases.value = [];
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
.eval__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  gap: 16px;
  flex-wrap: wrap;
}
.eval__title {
  font-size: 20px;
  font-weight: 500;
  margin: 0;
}
.eval__search-input {
  width: 320px;
  height: 40px;
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 0 14px;
  font-size: 14px;
  outline: none;
  box-sizing: border-box;
}
.eval__grid {
  display: grid;
  grid-template-columns: 1fr 1.4fr;
  gap: 16px;
  align-items: start;
}
.eval__main {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.eval__side {
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
  flex-wrap: wrap;
}
.card__meta {
  font-size: 12px;
  color: var(--text-2);
}
.card__note {
  font-size: 12px;
  color: var(--text-2);
  line-height: 1.5;
  margin: 12px 0 0;
}
.eval-set {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px;
  border-radius: 10px;
  cursor: pointer;
  border: 1px solid transparent;
}
.eval-set--active {
  background: var(--primary-light);
  border-color: var(--primary);
}
.eval-set__name {
  font-size: 14px;
  font-weight: 500;
}
.eval-set__meta {
  font-size: 12px;
  color: var(--text-2);
  margin-top: 2px;
}
.eval-set__dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--border);
  flex-shrink: 0;
}
.eval-set__dot--ok { background: var(--ok); }
.eval-set__dot--error { background: var(--error); }
.eval-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-top: 12px;
}
.eval-stat__label {
  font-size: 12px;
  color: var(--text-2);
}
.eval-stat__value {
  font-size: 18px;
  font-weight: 500;
  margin-top: 2px;
}
.eval-stat__value--ok { color: var(--ok); }
.eval-stat__value--error { color: var(--error); }
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
.table__id {
  font-family: monospace;
  font-size: 12px;
  color: var(--text-2);
}
.table__reason {
  color: var(--text-2);
}
.failed-case {
  background: var(--bg);
  border-radius: 10px;
  padding: 12px;
  margin-bottom: 12px;
}
.failed-case__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}
.failed-case__id {
  font-size: 13px;
  font-weight: 500;
  font-family: monospace;
}
.failed-case__tag {
  font-size: 11px;
  color: var(--warn);
  background: rgba(199, 119, 0, 0.1);
  padding: 2px 8px;
  border-radius: 4px;
}
.failed-case__row {
  display: flex;
  gap: 12px;
  margin-bottom: 6px;
  font-size: 13px;
}
.failed-case__label {
  color: var(--text-2);
  width: 40px;
  flex-shrink: 0;
}
.failed-case__value {
  flex: 1;
  line-height: 1.5;
}
.failed-case__value--error {
  color: var(--error);
}
.failed-case__actions {
  display: flex;
  gap: 8px;
  margin-top: 10px;
}
.form-field {
  margin-bottom: 12px;
}
.form-label {
  font-size: 13px;
  color: var(--text-2);
  display: block;
  margin-bottom: 6px;
}
.form-input {
  width: 100%;
  height: 40px;
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 0 12px;
  font-size: 14px;
  box-sizing: border-box;
}
.modal__hint {
  font-size: 13px;
  color: var(--text-2);
  margin: 0 0 8px;
}
.modal__textarea {
  width: 100%;
  min-height: 80px;
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 12px;
  font-size: 14px;
  box-sizing: border-box;
  resize: vertical;
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
