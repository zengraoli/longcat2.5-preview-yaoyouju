<template>
  <AppLayout>
    <div class="models">
      <div class="models__header">
        <div>
          <h1 class="models__title">模型与评测 › 发布管理</h1>
          <p class="models__meta">发布组合（模型 + 提示词 + 检索策略 + 内容库 + embedding）</p>
        </div>
        <button class="btn btn--primary" @click="onCreate">＋ 新建候选发布</button>
      </div>
      <p class="models__desc">任一要素变更都必须生成新的候选发布并通过全部评测门禁；激活需关联通过的评测运行。</p>

      <!-- 发布组合表 -->
      <div class="card">
        <table class="table">
          <thead>
            <tr>
              <th>发布</th><th>模型</th><th>提示词</th><th>检索策略</th><th>内容库</th><th>embedding</th><th>状态</th><th>评测结果</th><th>灰度</th><th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in releases" :key="r.id">
              <td class="table__title">{{ r.name }}</td>
              <td>{{ r.modelName }}</td>
              <td>{{ r.promptVersion }}</td>
              <td>{{ r.retrievalStrategy }}</td>
              <td>{{ r.contentLibVersion }}</td>
              <td>{{ r.embedding }}</td>
              <td><StatusTag :label="r.status" /></td>
              <td class="table__eval">{{ r.evalResult }}</td>
              <td>{{ r.gray }}</td>
              <td class="table__actions">
                <button v-if="r.status === '候选'" class="btn btn--text" @click="onRunEval(r)">重跑评测</button>
                <button v-if="r.status === '候选'" class="btn btn--text" @click="onPublish(r)">发布</button>
                <button v-if="r.status === '生效'" class="btn btn--text" @click="onRollback(r)">回滚到上一版</button>
                <button v-else class="btn btn--text">查看</button>
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
              <span class="card__tag card__tag--danger">阻断发布</span>
              <button class="btn btn--secondary btn--sm">⟳ 重跑全部评测</button>
            </div>
          </div>
          <table class="table">
            <thead>
              <tr><th>评测集</th><th>阈值</th><th>结果</th><th>用例</th><th>状态</th></tr>
            </thead>
            <tbody>
              <tr v-for="(e, i) in candidateEvals" :key="i">
                <td>{{ e.name }}</td>
                <td>{{ e.threshold }}</td>
                <td :class="e.passed ? 'table__pass' : 'table__fail'">{{ e.result }}</td>
                <td>{{ e.cases }}</td>
                <td><StatusTag :label="e.passed ? '通过' : '未通过'" /></td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 候选发布详情 -->
        <div class="card">
          <div class="card__title">候选发布详情</div>
          <div class="detail-rows">
            <div class="detail-row"><span>模型策略</span><span>Q-x 2.5（供应商 A · 合同约定不留存训练 · 处理地点：华东）</span></div>
            <div class="detail-row"><span>提示词版本</span><span>p15：新增“侧别一致性”约束与输出校验</span></div>
            <div class="detail-row"><span>检索策略</span><span>R-4：k=8，BM25 0.4 + 向量 0.6，仅 active 且可引用</span></div>
            <div class="detail-row"><span>内容库版本</span><span>2026-09（8 个已发布内容）</span></div>
            <div class="detail-row"><span>embedding</span><span>v3（1024 维）</span></div>
            <div class="detail-row"><span>变更说明</span><span>修复 #ER-0213 侧别混淆；预算：输入 ≤ 6k / 输出 ≤ 1.5k tokens</span></div>
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
              <div class="flow__desc">已创建 · 2026-09-21 11:02</div>
            </div>
          </div>
          <div class="flow__arrow">→</div>
          <div class="flow__node">
            <span class="flow__dot flow__dot--error" />
            <div>
              <div class="flow__name">评测门禁</div>
              <div class="flow__desc">未通过（左右侧混淆 1 例）</div>
            </div>
          </div>
          <div class="flow__arrow">→</div>
          <div class="flow__node">
            <span class="flow__dot" />
            <div>
              <div class="flow__name">灰度</div>
              <div class="flow__desc">未到达</div>
            </div>
          </div>
          <div class="flow__arrow">→</div>
          <div class="flow__node">
            <span class="flow__dot" />
            <div>
              <div class="flow__name">生效</div>
              <div class="flow__desc">未到达</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import AppLayout from '@/components/AppLayout.vue';
import StatusTag from '@/components/StatusTag.vue';
import { listReleases, runEval, publishRelease, rollbackRelease, createRelease, listEvalRuns, listEvalSets } from '@/api';
import type { Release, EvalRun } from '@/api/types';

const releases = ref<Array<Release & { embedding: string; evalResult: string; gray: string }>>([]);
const candidateEvals = ref<Array<{ name: string; threshold: string; result: string; cases: number; passed: boolean }>>([]);

async function onCreate() {
  const name = prompt('发布组合名称');
  if (!name) return;
  try {
    await createRelease({
      modelName: name,
      promptVersion: 'prompt-p1',
      retrievalStrategy: 'keyword-v1',
      contentLibVersion: 'content-c1',
    });
    toast('已创建候选发布');
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
    toast(result.status === '已发布' ? '已发布' : '已发起，待第二人确认');
    await load();
  } catch (e) {
    toast((e as Error).message);
  }
}

async function onRollback(r: Release) {
  try {
    await rollbackRelease(r.id);
    toast('已回滚');
    await load();
  } catch (e) {
    toast((e as Error).message);
  }
}

async function load() {
  try {
    const items = await listReleases();
    releases.value = items.map((r) => ({
      ...r,
      embedding: 'v3',
      evalResult: r.status === '生效' ? '全部通过' : '—',
      gray: r.status === '生效' ? '100%' : '0%',
    }));
    // 候选发布的评测门禁结果
    const candidate = items.find((r) => r.status === '候选') ?? items[0];
    if (candidate) {
      const runs = await listEvalRuns(candidate.id);
      const sets = await listEvalSets();
      candidateEvals.value = runs.map((run) => {
        const set = sets.find((s) => s.id === run.evalSetId);
        const metrics = (run.metrics ?? {}) as { 通过率?: number };
        return {
          name: run.evalSetName,
          threshold: '≥ 80%',
          result: metrics.通过率 !== undefined ? `${Math.round(metrics.通过率 * 100)}%` : '—',
          cases: set?.caseCount ?? 0,
          passed: run.result === '通过',
        };
      });
    }
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
}
.flow__node {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  flex: 1;
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
