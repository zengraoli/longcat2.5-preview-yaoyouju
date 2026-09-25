<template>
  <div class="evidence-page">
    <div class="page-header">
      <h2 class="page-title">医学证据库</h2>
      <button class="btn-primary" @click="showCreate = true">新建文档</button>
    </div>

    <div class="card">
      <table class="data-table">
        <thead>
          <tr>
            <th>标题</th>
            <th>来源类型</th>
            <th>核实日期</th>
            <th>状态</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="doc in docs" :key="doc.id">
            <td>{{ doc.title }}</td>
            <td><span class="tag tag-info">{{ doc.source_type }}</span></td>
            <td>{{ doc.verified_at ? doc.verified_at.slice(0, 10) : '-' }}</td>
            <td>
              <span class="tag" :class="doc.active ? 'tag-ok' : 'tag-error'">
                {{ doc.active ? '启用' : '停用' }}
              </span>
            </td>
            <td>
              <button class="btn-small" @click="toggleDoc(doc)">{{ doc.active ? '停用' : '启用' }}</button>
              <button class="btn-small" @click="viewImpact(doc.id)">影响预览</button>
            </td>
          </tr>
        </tbody>
      </table>
      <div class="empty-state" v-if="docs.length === 0">
        <p>暂无证据文档</p>
      </div>
    </div>

    <div class="modal" v-if="showImpact" @click.self="showImpact = false">
      <div class="modal-content card">
        <h3 class="modal-title">停用影响预览</h3>
        <p>受影响的分析数: {{ impact.affectedAnalyses }}</p>
        <p>受影响的内容版本数: {{ impact.affectedContentVersions }}</p>
        <div class="modal-actions">
          <button class="btn-secondary" @click="showImpact = false">关闭</button>
        </div>
      </div>
    </div>

    <div class="modal" v-if="showCreate" @click.self="showCreate = false">
      <div class="modal-content card">
        <h3 class="modal-title">新建证据文档</h3>
        <div class="form-group">
          <label>标题</label>
          <input v-model="newDoc.title" placeholder="请输入标题" />
        </div>
        <div class="form-group">
          <label>来源类型</label>
          <select v-model="newDoc.sourceType">
            <option>指南</option>
            <option>研究</option>
            <option>审核科普</option>
          </select>
        </div>
        <div class="form-group">
          <label>来源地址</label>
          <input v-model="newDoc.sourceUrl" placeholder="https://..." />
        </div>
        <div class="form-group">
          <label>许可</label>
          <input v-model="newDoc.license" placeholder="CC-BY-4.0" />
        </div>
        <div class="form-group">
          <label>内容片段（每行一个）</label>
          <textarea v-model="newDoc.chunks" placeholder="每行输入一个证据片段"></textarea>
        </div>
        <div class="modal-actions">
          <button class="btn-secondary" @click="showCreate = false">取消</button>
          <button class="btn-primary" @click="createDoc">创建</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { api } from '../../utils/api';

const docs = ref<any[]>([]);
const showCreate = ref(false);
const showImpact = ref(false);
const impact = ref({ affectedAnalyses: 0, affectedContentVersions: 0 });
const newDoc = ref({ title: '', sourceType: '指南', sourceUrl: '', license: '', chunks: '' });

async function toggleDoc(doc: any) {
  try {
    await api.toggleEvidence({ docId: doc.id, active: !doc.active });
    await loadDocs();
  } catch (e: any) { alert(e.message); }
}

async function viewImpact(id: string) {
  try {
    impact.value = await api.getEvidenceDoc(id);
    showImpact.value = true;
  } catch (e: any) { alert(e.message); }
}

async function createDoc() {
  try {
    const chunks = newDoc.value.chunks.split('\n').filter((c: string) => c.trim());
    await api.createEvidenceDoc({ ...newDoc.value, chunks });
    showCreate.value = false;
    await loadDocs();
  } catch (e: any) { alert(e.message); }
}

async function loadDocs() {
  try {
    docs.value = await api.getEvidenceDocs();
  } catch (e) {
    console.error('Failed to load evidence docs:', e);
  }
}

onMounted(() => { loadDocs(); });
</script>

<style scoped>
.evidence-page { padding: 0; }
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
.form-group input, .form-group select, .form-group textarea { width: 100%; height: 40px; border: 1px solid var(--border); border-radius: 8px; padding: 0 12px; font-size: 13px; }
.form-group textarea { height: 120px; padding: 12px; resize: vertical; }
.modal-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px; }
.empty-state { text-align: center; padding: 40px; color: var(--text-3); }
</style>
