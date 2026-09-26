<template>
  <div class="models-page">
    <div class="page-header">
      <h2 class="page-title">模型发布管理</h2>
      <button class="btn-primary" @click="showCreate = true">创建发布组合</button>
    </div>

    <div class="card">
      <div class="flow-hint">
        <span class="flow-step">候选</span> → <span class="flow-step">评测门禁</span> → <span class="flow-step">灰度</span> → <span class="flow-step">生效</span>
      </div>
      <table class="data-table">
        <thead>
          <tr>
            <th>模型名称</th>
            <th>提示词版本</th>
            <th>检索策略</th>
            <th>内容库版本</th>
            <th>状态</th>
            <th>评测结果</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in models" :key="item.id">
            <td>{{ item.model_name }}</td>
            <td>{{ item.prompt_version }}</td>
            <td>{{ item.retrieval_strategy }}</td>
            <td>{{ item.content_lib_version }}</td>
            <td>
              <span class="tag" :class="statusTagClass(item.status)">{{ item.status }}</span>
            </td>
            <td>
              <span v-if="item.id === currentReleaseId" class="tag" :class="gateResult === '通过' ? 'tag-ok' : 'tag-error'">{{ gateResult }}</span>
              <span v-else>-</span>
            </td>
            <td>
              <button v-if="item.status === '候选'" class="btn-small" @click="submitEval(item)">提交评测</button>
              <button v-if="item.status === '灰度'" class="btn-small" @click="publish(item)">发布</button>
              <button class="btn-small" @click="rollback(item)">回滚</button>
            </td>
          </tr>
        </tbody>
      </table>
      <div class="empty-state" v-if="models.length === 0">
        <p>暂无模型发布记录</p>
      </div>
    </div>

    <div class="card" v-if="evalRuns.length > 0">
      <h3 class="section-title">评测门禁结果</h3>
      <table class="data-table">
        <thead>
          <tr>
            <th>模型</th>
            <th>评测集</th>
            <th>结果</th>
            <th>指标</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="run in evalRuns" :key="run.id">
            <td>{{ run.model_name }}</td>
            <td>{{ run.eval_set_name }}</td>
            <td><span class="tag" :class="run.result === '通过' ? 'tag-ok' : 'tag-error'">{{ run.result }}</span></td>
            <td>{{ run.metrics || '-' }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="modal" v-if="showCreate" @click.self="showCreate = false">
      <div class="modal-content card">
        <h3 class="modal-title">创建发布组合</h3>
        <div class="form-group">
          <label>模型名称</label>
          <input v-model="newModel.model_name" placeholder="yaoyouju-analysis-v1" />
        </div>
        <div class="form-group">
          <label>提示词版本</label>
          <input v-model="newModel.prompt_version" placeholder="p-2026.06" />
        </div>
        <div class="form-group">
          <label>检索策略</label>
          <input v-model="newModel.retrieval_strategy" placeholder="keyword+vector" />
        </div>
        <div class="form-group">
          <label>内容库版本</label>
          <input v-model="newModel.content_lib_version" placeholder="cl-v2" />
        </div>
        <div class="modal-actions">
          <button class="btn-secondary" @click="showCreate = false">取消</button>
          <button class="btn-primary" @click="createModel">创建</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { api } from '../../utils/api';

const models = ref<any[]>([]);
const evalRuns = ref<any[]>([]);
const showCreate = ref(false);
const currentReleaseId = ref('');
const gateResult = ref('通过');
const newModel = ref({ model_name: '', prompt_version: '', retrieval_strategy: '', content_lib_version: '' });

function statusTagClass(status: string) {
  const map: Record<string, string> = { '候选': 'tag-info', '灰度': 'tag-warn', '生效': 'tag-ok', '已回滚': 'tag-error' };
  return map[status] || 'tag-info';
}

async function submitEval(item: any) {
  try {
    await api.submitEvalRun({ modelReleaseId: item.id, evalSetId: 'eval-1', triggerReason: '发布前评测' });
    await loadModels();
  } catch (e: any) { alert(e.message); }
}

async function publish(item: any) {
  try {
    await api.publishModel({ releaseId: item.id });
    await loadModels();
  } catch (e: any) { alert(e.message); }
}

async function rollback(item: any) {
  try {
    await api.rollbackModel({ releaseId: item.id });
    await loadModels();
  } catch (e: any) { alert(e.message); }
}

async function createModel() {
  try {
    await api.createModelRelease(newModel.value);
    showCreate.value = false;
    await loadModels();
  } catch (e: any) { alert(e.message); }
}

async function loadModels() {
  try {
    models.value = await api.getModels();
    evalRuns.value = await api.getEvalRuns();
    const current = models.value.find((m) => m.status === '生效');
    currentReleaseId.value = current?.id || models.value[0]?.id || '';
    const run = evalRuns.value.find((r) => r.model_release_id === currentReleaseId.value);
    gateResult.value = run?.result || '通过';
  } catch (e) {
    console.error('Failed to load models:', e);
  }
}

onMounted(() => { loadModels(); });
</script>

<style scoped>
.models-page { padding: 0; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
.page-title { font-size: 20px; font-weight: 500; }
.data-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.data-table th, .data-table td { text-align: left; padding: 12px 8px; border-bottom: 1px solid var(--border); }
.data-table th { color: var(--text-2); font-weight: 500; }
.btn-small { padding: 6px 12px; background: var(--primary-light); color: var(--primary); border: none; border-radius: 8px; font-size: 12px; cursor: pointer; margin-right: 8px; }
.modal { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 100; }
.modal-content { width: 500px; max-height: 80vh; overflow-y: auto; }
.modal-title { font-size: 16px; font-weight: 500; margin-bottom: 20px; }
.form-group { margin-bottom: 16px; }
.form-group label { display: block; font-size: 12px; color: var(--text-2); margin-bottom: 6px; }
.form-group input { width: 100%; height: 40px; border: 1px solid var(--border); border-radius: 8px; padding: 0 12px; font-size: 13px; }
.modal-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px; }
.empty-state { text-align: center; padding: 40px; color: var(--text-3); }
.flow-hint { margin-bottom: 16px; font-size: 13px; color: var(--text-2); }
.flow-step { background: var(--primary-light); color: var(--primary); border-radius: 4px; padding: 3px 10px; font-size: 12px; }
.section-title { font-size: 16px; font-weight: 500; margin-bottom: 16px; }
</style>
