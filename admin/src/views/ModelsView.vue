<template>
  <AppLayout>
    <div class="models">
      <div class="models__header">
        <div>
          <h1 class="models__title">模型与评测 › 发布管理</h1>
          <p class="models__meta">发布组合（模型 + 提示词 + 检索策略 + 内容库 + embedding）</p>
        </div>
        <button class="btn btn--primary" @click="showCreate = true">＋ 新建候选发布</button>
      </div>
      <p class="models__desc">任一要素变更都必须生成新的候选发布并通过全部评测门禁；激活需关联通过的评测运行。发布与回滚需双人确认（技术负责人 + 超管）。</p>

      <!-- 发布组合表 -->
      <div class="card">
        <table class="table">
          <thead>
            <tr>
              <th>发布</th><th>模型</th><th>提示词</th><th>检索策略</th><th>内容库</th><th>状态</th><th>评测结果</th><th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in releases" :key="r.id">
              <td class="table__title">{{ r.modelName }}</td>
              <td>{{ r.modelName }}</td>
              <td>{{ r.promptVersion }}</td>
              <td>{{ r.retrievalStrategy }}</td>
              <td>{{ r.contentLibVersion }}</td>
              <td><StatusTag :label="r.status" /></td>
              <td class="table__eval">{{ r.evalResult }}</td>
              <td class="table__actions">
                <button class="btn btn--text" @click="onView(r)">查看</button>
                <button v-if="r.status === '候选'" class="btn btn--text" @click="onRunEval(r)">重跑评测</button>
                <button v-if="r.status === '候选'" class="btn btn--text" @click="onPublish(r)">发布</button>
                <button v-if="r.status === '生效'" class="btn btn--text" @click="onRollback(r)">回滚到上一版</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="models__grid">
        <!-- 候选评测门禁结果 -->
        <div class="card">
          <div class="card__header">
            <div class="card__title">候选发布 · 评测门禁结果</div>
            <div class="card__header-tags">
              <span class="card__tag" :class="candidateEvals.length > 0 && candidateEvals.every((e) => e.passed) ? 'card__tag--ok' : 'card__tag--danger'">
                {{ candidateEvals.length > 0 && candidateEvals.every((e) => e.passed) ? '门禁通过' : '阻断发布' }}
              </span>
              <button class="btn btn--secondary btn--sm" @click="candidate && onRunEval(candidate)">⟳ 重跑全部评测</button>
            </div>
          </div>
          <table class="table">
            <thead>
              <tr><th>评测集</th><th>阈值</th><th>结果</th><th>用例</th><th>状态</th></tr>
            </thead>
            <tbody>
              <tr v-for="(e, i) in candidateEvals" :key="i">
                <td>{{ e.name }}</td>
                <td>≥ 80%</td>
                <td :class="e.passed ? 'table__pass' : 'table__fail'">{{ e.result }}</td>
                <td>{{ e.cases }}</td>
                <td><StatusTag :label="e.passed ? '通过' : '未通过'" /></td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 候选发布详情 -->
        <div class="card" v-if="candidate">
          <div class="card__title">候选发布详情</div>
          <div class="detail-rows">
            <div class="detail-row"><span>模型名称</span><span>{{ candidate.modelName }}</span></div>
            <div class="detail-row"><span>提示词版本</span><span>{{ candidate.promptVersion }}</span></div>
            <div class="detail-row"><span>检索策略</span><span>{{ candidate.retrievalStrategy }}</span></div>
            <div class="detail-row"><span>内容库版本</span><span>{{ candidate.contentLibVersion }}</span></div>
            <div class="detail-row"><span>状态</span><span>{{ candidate.status }}</span></div>
          </div>
        </div>
      </div>

      <!-- 发布流程 -->
      <div class="card">
        <div class="card__title">发布流程</div>
        <div class="flow">
          <div class="flow__node">
            <span class="flow__dot flow__dot--ok" />
            <div>
              <div class="flow__name">候选</div>
              <div class="flow__desc">{{ candidate ? candidate.modelName : '—' }}</div>
            </div>
          </div>
          <div class="flow__arrow">→</div>
          <div class="flow__node">
            <span class="flow__dot" :class="candidateEvals.length > 0 && candidateEvals.every((e) => e.passed) ? 'flow__dot--ok' : 'flow__dot--error'" />
            <div>
              <div class="flow__name">评测门禁</div>
              <div class="flow__desc">{{ candidateEvals.length > 0 ? (candidateEvals.every((e) => e.passed) ? '全部通过' : '存在未通过项') : '未运行' }}</div>
            </div>
          </div>
          <div class="flow__arrow">→</div>
          <div class="flow__node">
            <span class="flow__dot" :class="releases.some((r) => r.status === '灰度') ? 'flow__dot--ok' : ''" />
            <div>
              <div class="flow__name">灰度</div>
              <div class="flow__desc">{{ releases.some((r) => r.status === '灰度') ? '灰度中' : '未到达' }}</div>
            </div>
          </div>
          <div class="flow__arrow">→</div>
          <div class="flow__node">
            <span class="flow__dot" :class="releases.some((r) => r.status === '生效') ? 'flow__dot--ok' : ''" />
            <div>
              <div class="flow__name">生效</div>
              <div class="flow__desc">{{ releases.find((r) => r.status === '生效')?.modelName ?? '未到达' }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 新建候选弹层 -->
      <Modal :open="showCreate" title="新建候选发布" confirm-text="创建" @close="showCreate = false" @confirm="confirmCreate">
        <div class="form-field">
          <label class="form-label">发布组合名称</label>
          <input v-model="newName" class="form-input" placeholder="如：local-mock-v2" :maxlength="100" />
        </div>
        <div class="form-field">
          <label class="form-label">提示词版本</label>
          <input v-model="newPrompt" class="form-input" placeholder="prompt-p2" :maxlength="100" />
        </div>
        <div class="form-field">
          <label class="form-label">检索策略</label>
          <input v-model="newRetrieval" class="form-input" placeholder="keyword-v2" :maxlength="100" />
        </div>
        <div class="form-field">
          <label class="form-label">内容库版本</label>
          <input v-model="newContentLib" class="form-input" placeholder="content-c2" :maxlength="100" />
        </div>
      </Modal>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import AppLayout from '@/components/AppLayout.vue';
import StatusTag from '@/components/StatusTag.vue';
import Modal from '@/components/Modal.vue';
import { listReleases, runEval, publishRelease, rollbackRelease, createRelease, listEvalRuns, listEvalSets } from '@/api';
import type { Release, EvalRun } from '@/api/types';

const router = useRouter();
const releases = ref<Array<Release & { evalResult: string }>>([]);
const candidateEvals = ref<Array<{ name: string; result: string; cases: number; passed: boolean }>>([]);
const candidate = ref<Release | null>(null);
const showCreate = ref(false);
const newName = ref('');
const newPrompt = ref('prompt-p2');
const newRetrieval = ref('keyword-v2');
const newContentLib = ref('content-c2');

async function confirmCreate() {
  if (!newName.value.trim()) {
    toast('请填写发布组合名称');
    return;
  }
  try {
    await createRelease({
      modelName: newName.value.trim(),
      promptVersion: newPrompt.value.trim() || 'prompt-p1',
      retrievalStrategy: newRetrieval.value.trim() || 'keyword-v1',
      contentLibVersion: newContentLib.value.trim() || 'content-c1',
    });
    toast('已创建候选发布');
    showCreate.value = false;
    newName.value = '';
    await load();
  } catch (e) {
    toast((e as Error).message);
  }
}

async function onRunEval(r: Release) {
  try {
    await runEval(r.id);
    toast('评测已运行');
    await load();
  } catch (e) {
    toast((e as Error).message);
  }
}

async function onPublish(r: Release) {
  try {
    const result = await publishRelease(r.id);
    // 服务端确认后返回“生效”，按实际状态提示
    toast(result.status === '生效' ? '已生效（双人确认完成）' : '已发起，待超管确认');
    await load();
  } catch (e) {
    toast((e as Error).message);
  }
}

async function onRollback(r: Release) {
  try {
    const result = await rollbackRelease(r.id);
    toast(result.status === '已回滚' ? '已回滚（双人确认完成）' : '已发起，待超管确认');
    await load();
  } catch (e) {
    toast((e as Error).message);
  }
}

function onView(r: Release) {
  candidate.value = r;
  loadCandidateEvals();
}

async function loadCandidateEvals() {
  if (!candidate.value) return;
  try {
    const runs = await listEvalRuns(candidate.value.id);
    const sets = await listEvalSets();
    candidateEvals.value = runs.map((run) => {
      const set = sets.find((s) => s.id === run.evalSetId);
      const metrics = (run.metrics ?? {}) as { 通过率?: number };
      return {
        name: run.evalSetName,
        result: metrics.通过率 !== undefined ? `${Math.round(metrics.通过率 * 100)}%` : '—',
        cases: set?.caseCount ?? 0,
        passed: run.result === '通过',
      };
    });
  } catch {
    candidateEvals.value = [];
  }
}

async function load() {
  try {
    const items = await listReleases();
    // 计算每个发布的评测结果（真实数据，不写死“全部通过”）
    const withEval = await Promise.all(
      items.map(async (r) => {
        const runs = await listEvalRuns(r.id);
        const failed = runs.filter((run) => run.result !== '通过').length;
        const evalResult = runs.length === 0 ? '未评测' : failed === 0 ? '全部通过' : `${failed} 项未通过`;
        return { ...r, evalResult };
      }),
    );
    releases.value = withEval;
    candidate.value = items.find((r) => r.status === '候选') ?? items[0] ?? null;
    await loadCandidateEvals();
  } catch {
    // 加载失败不阻塞
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
.models__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 4px;
  gap: 16px;
  flex-wrap: wrap;
}
.models__title {
  font-size: 20px;
  font-weight: 500;
  margin: 0;
}
.models__meta {
  font-size: 13px;
  color: var(--text-2);
  margin: 4px 0 0;
}
.models__desc {
  font-size: 13px;
  color: var(--text-2);
  margin: 0 0 20px;
}
.card {
  background: var(--surface);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
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
.card__tag {
  font-size: 12px;
  color: var(--text-2);
  background: var(--bg);
  padding: 2px 10px;
  border-radius: 4px;
}
.card__tag--ok {
  color: var(--ok);
  background: rgba(30, 158, 90, 0.1);
}
.card__tag--danger {
  color: var(--error);
  background: rgba(217, 59, 59, 0.1);
}
.models__grid {
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  gap: 16px;
  margin-bottom: 16px;
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
.table__title {
  font-weight: 500;
}
.table__eval {
  color: var(--text-2);
  line-height: 1.5;
}
.table__pass { color: var(--ok); }
.table__fail { color: var(--error); font-weight: 500; }
.table__actions {
  display: flex;
  gap: 8px;
  white-space: nowrap;
}
.detail-rows {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.detail-row {
  display: flex;
  gap: 12px;
  font-size: 13px;
}
.detail-row span:first-child {
  color: var(--text-2);
  width: 88px;
  flex-shrink: 0;
}
.detail-row span:last-child {
  flex: 1;
}
.flow {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
.flow__node {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  flex: 1;
  min-width: 120px;
}
.flow__dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--border);
  flex-shrink: 0;
  margin-top: 3px;
}
.flow__dot--ok { background: var(--ok); }
.flow__dot--error { background: var(--error); }
.flow__name {
  font-size: 14px;
  font-weight: 500;
}
.flow__desc {
  font-size: 12px;
  color: var(--text-2);
  margin-top: 2px;
}
.flow__arrow {
  color: var(--text-3);
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
.btn--text {
  background: none;
  color: var(--primary);
  min-height: 32px;
  padding: 0;
  font-size: 13px;
}
</style>
