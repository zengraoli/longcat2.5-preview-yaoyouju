<template>
  <div class="eval-page">
    <h1 class="page-title">评测集与回归结果</h1>

    <section class="card">
      <div class="card-head">
        <h2 class="card-title">评测集列表</h2>
        <button class="btn-secondary">新建评测集</button>
      </div>
      <table class="data-table">
        <thead>
          <tr>
            <th>名称</th>
            <th>用例数</th>
            <th>来源</th>
            <th>门禁</th>
            <th>去标识化</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="set in sets" :key="set.id">
            <td>{{ set.name }}</td>
            <td>{{ set.case_count }}</td>
            <td>线上反馈抽样</td>
            <td>发布门禁</td>
            <td><span class="tag tag-ok">{{ set.deidentified ? '已去标识' : '未去标识' }}</span></td>
          </tr>
          <tr v-if="sets.length === 0"><td colspan="5" class="empty-cell">暂无评测集</td></tr>
        </tbody>
      </table>
    </section>

    <section class="card">
      <div class="card-head">
        <h2 class="card-title">运行记录</h2>
        <span class="head-note">触发原因：发布前自动触发 / 手动触发</span>
      </div>
      <table class="data-table">
        <thead>
          <tr>
            <th>时间</th>
            <th>模型</th>
            <th>评测集</th>
            <th>结果</th>
            <th>指标</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="run in runs" :key="run.id">
            <td>{{ formatTime(run.created_at) }}</td>
            <td>{{ run.model_name }}</td>
            <td>{{ run.eval_set_name }}</td>
            <td><span class="tag" :class="run.result === '通过' ? 'tag-ok' : 'tag-error'">{{ run.result }}</span></td>
            <td>{{ run.metrics || '-' }}</td>
          </tr>
          <tr v-if="runs.length === 0"><td colspan="5" class="empty-cell">暂无运行记录</td></tr>
        </tbody>
      </table>
    </section>

    <section class="card">
      <div class="card-head">
        <h2 class="card-title">失败用例</h2>
        <span class="head-note">输入 / 期望 / 实际 / 判定（去标识化）</span>
      </div>
      <table class="data-table">
        <thead>
          <tr>
            <th>用例</th>
            <th>输入</th>
            <th>期望</th>
            <th>实际</th>
            <th>判定</th>
          </tr>
        </thead>
        <tbody>
          <tr><td colspan="5" class="empty-cell">当前无失败用例；出现失败用例时会在此展示，内容已去标识化。</td></tr>
        </tbody>
      </table>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { api } from '../../utils/api';

const sets = ref<any[]>([]);
const runs = ref<any[]>([]);

function formatTime(iso: string) {
  return iso ? iso.slice(0, 10) : '-';
}

onMounted(async () => {
  try {
    sets.value = await api.getEvalSets();
    runs.value = await api.getEvalRuns();
  } catch (e) {
    console.error('Failed to load eval data:', e);
  }
});
</script>

<style scoped>
.eval-page {
  padding: 0;
}

.page-title {
  font-size: 20px;
  font-weight: 500;
  margin-bottom: 24px;
}

.card {
  background: var(--surface);
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
}

.card-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.card-title {
  font-size: 16px;
  font-weight: 500;
}

.head-note {
  font-size: 12px;
  color: var(--text-3);
}

.btn-secondary {
  background: var(--surface);
  color: var(--primary);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 10px 20px;
  font-size: 13px;
  cursor: pointer;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.data-table th,
.data-table td {
  text-align: left;
  padding: 12px 14px;
  border-bottom: 1px solid var(--border);
}

.data-table th {
  color: var(--text-3);
  font-weight: 500;
  font-size: 12px;
  background: var(--bg);
}

.empty-cell {
  text-align: center;
  color: var(--text-3);
  padding: 32px;
}

.tag {
  font-size: 12px;
  border-radius: 4px;
  padding: 3px 8px;
}

.tag-ok { background: #E5F6EE; color: var(--ok); }
.tag-error { background: rgba(217, 59, 59, 0.08); color: var(--error); }
</style>
