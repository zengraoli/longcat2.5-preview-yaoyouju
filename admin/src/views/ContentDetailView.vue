<template>
  <AppLayout>
    <div class="content-detail" v-if="item">
      <div class="content-detail__header">
        <div>
          <button class="btn btn--text" @click="goBack">‹ 返回</button>
          <h1 class="content-detail__title">{{ form.title || item.title }}</h1>
          <p class="content-detail__meta">
            内容 ID {{ itemId }} · 当前版本 v{{ item.version ?? '—' }} · 引用 {{ refCount }} 条分析
          </p>
        </div>
        <div class="content-detail__header-tags">
          <span class="content-detail__type">{{ form.type || item.type }}</span>
          <StatusTag :label="item.currentStatus" />
        </div>
      </div>

      <div class="content-detail__grid">
        <!-- 左：编辑 -->
        <div class="content-detail__main">
          <div class="card">
            <div class="card__title">基本信息</div>
            <div class="form-row">
              <div class="form-field">
                <label class="form-label">标题</label>
                <input v-model="form.title" class="form-input" :maxlength="100" />
              </div>
              <div class="form-field">
                <label class="form-label">类型</label>
                <select v-model="form.type" class="form-input">
                  <option>视频</option>
                  <option>图文组件</option>
                </select>
              </div>
            </div>
            <div class="form-row">
              <div class="form-field">
                <label class="form-label">适用范围</label>
                <textarea v-model="form.applicableScope" class="form-textarea" />
              </div>
              <div class="form-field">
                <label class="form-label">不适用范围</label>
                <textarea v-model="form.notApplicable" class="form-textarea" />
              </div>
            </div>
            <button class="btn btn--primary" @click="onSave">保存</button>
          </div>

          <div class="card">
            <div class="card__header">
              <div class="card__title">脚本（当前版本）</div>
            </div>
            <div class="script">
              <p>{{ currentScript || '暂无脚本' }}</p>
            </div>
            <div class="form-row">
              <div class="form-field">
                <label class="form-label">字幕与文字替代</label>
                <div class="form-file">{{ currentSubtitle || '暂无' }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 右：状态流转与审核记录 -->
        <div class="content-detail__side">
          <div class="card">
            <div class="card__title">状态流转</div>
            <div class="state-flow">
              <span class="state-flow__node">草稿</span>
              <span class="state-flow__arrow">›</span>
              <span class="state-flow__node" :class="{ 'state-flow__node--active': item.currentStatus === '待审' }">待医学审核</span>
              <span class="state-flow__arrow">›</span>
              <span class="state-flow__node" :class="{ 'state-flow__node--active': item.currentStatus === '已审定' }">已审定</span>
              <span class="state-flow__arrow">›</span>
              <span class="state-flow__node" :class="{ 'state-flow__node--active': item.currentStatus === '已发布' }">已发布</span>
            </div>
            <p class="card__note">当前状态：{{ item.currentStatus }}</p>
            <textarea v-model="reviewComment" class="form-textarea" placeholder="审核意见（退回时必填）" />
            <div class="card__actions" v-if="canReview">
              <button class="btn btn--primary" @click="onTransition('通过')">审核通过</button>
              <button class="btn btn--secondary" @click="onTransition('退回')">退回修改</button>
            </div>
            <div class="card__actions" v-if="canEdit">
              <button class="btn btn--secondary" @click="onTransition('提交审核')">提交审核</button>
              <button class="btn btn--secondary" @click="onTransition('更正')">更正</button>
            </div>
            <button v-if="canPublish" class="btn btn--primary btn--block" @click="onPublish">发布（需双人确认）</button>
            <button v-if="canOffline && item.currentStatus === '已发布'" class="btn btn--secondary btn--block" @click="onTransition('撤回')">撤回</button>
            <button v-if="canOffline && item.currentStatus === '已发布'" class="btn btn--secondary btn--block" @click="onOffline">应急下线</button>
          </div>

          <div class="card">
            <div class="card__title">审核记录</div>
            <div v-for="(r, i) in reviewRecords" :key="i" class="review-record">
              <div class="review-record__dot" />
              <div>
                <div class="review-record__title">{{ r.reviewerName || '审核人' }} · {{ r.decision }}</div>
                <div class="review-record__meta">{{ formatBeijing(r.reviewedAt) }}<span v-if="r.comment"> · {{ r.comment }}</span></div>
              </div>
            </div>
            <p v-if="reviewRecords.length === 0" class="card__note">暂无审核记录</p>
          </div>

          <div class="card">
            <div class="card__title">版本链</div>
            <div v-for="(v, i) in versions" :key="i" class="version-item">
              <span class="version-item__num">v{{ v.version }}</span>
              <StatusTag :label="v.publishedAt ? '已发布' : '未发布'" />
              <span class="version-item__desc">{{ v.publishedAt ? formatBeijing(v.publishedAt).slice(0, 10) : '—' }}</span>
            </div>
            <p v-if="versions.length === 0" class="card__note">暂无版本</p>
          </div>

          <div class="card">
            <div class="card__header">
              <div class="card__title">引用定位</div>
              <span class="card__tag">{{ refCount }} 条分析</span>
            </div>
            <p class="card__note">撤回或下线时将统一定位引用页面。</p>
          </div>
        </div>
      </div>
    </div>
    <div v-else class="content-detail">
      <p>内容不存在</p>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { formatBeijing } from '@/utils/time';
import { useRoute, useRouter } from 'vue-router';
import AppLayout from '@/components/AppLayout.vue';
import StatusTag from '@/components/StatusTag.vue';
import { api } from '@/api/client';
import { transitionContent, publishContent, offlineContent, getContentReviews, getContentVersions } from '@/api';
import { useAuthStore } from '@/stores/auth';
import type { ContentItem } from '@/api/types';

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const itemId = route.params.id as string;

const item = ref<ContentItem | null>(null);
const form = ref({ title: '', type: '视频', applicableScope: '', notApplicable: '' });
const reviewRecords = ref<Array<{ reviewerName: string | null; decision: string; comment: string | null; reviewedAt: string }>>([]);
const versions = ref<Array<{ version: number; publishedAt: string | null }>>([]);
const refCount = ref(0);
const currentScript = ref('');
const currentSubtitle = ref('');
const reviewComment = ref('');

const permissions = computed(() => auth.session?.permissions ?? []);
const canReview = computed(() => permissions.value.includes('content:review'));
const canEdit = computed(() => permissions.value.includes('content:edit') || permissions.value.includes('content:correct:initiate'));
const canPublish = computed(() => permissions.value.includes('content:publish:initiate') || permissions.value.includes('content:publish:confirm'));
const canOffline = computed(() => permissions.value.includes('content:offline'));

function goBack() {
  router.back();
}

async function onSave() {
  try {
    await api.put(`/contents/${itemId}`, {
      title: form.value.title,
      type: form.value.type,
      applicableScope: form.value.applicableScope,
      notApplicable: form.value.notApplicable,
    });
    toast('已保存');
    await load();
  } catch (e) {
    toast((e as Error).message);
  }
}

async function onTransition(action: string) {
  if (action === '退回' && !reviewComment.value.trim()) {
    toast('退回时必须填写审核意见');
    return;
  }
  try {
    const result = await transitionContent(itemId, action, reviewComment.value || undefined);
    reviewComment.value = '';
    const status = result.currentStatus ?? result;
    toast(`已执行：${status}`);
    await load();
  } catch (e) {
    toast((e as Error).message);
  }
}

async function onPublish() {
  try {
    const result = await publishContent(itemId);
    toast(result.status === '已发布' ? '已发布（双人确认完成）' : '已发起，待第二人确认');
    await load();
  } catch (e) {
    toast((e as Error).message);
  }
}

async function onOffline() {
  try {
    const result = await offlineContent(itemId);
    toast(result.status === '已下线' ? '已下线（双人确认完成）' : '已发起，待第二人确认');
    await load();
  } catch (e) {
    toast((e as Error).message);
  }
}

async function load() {
  try {
    const all = await api.get<ContentItem[]>('/contents');
    item.value = all.find((c) => c.id === itemId) ?? null;
    if (item.value) {
      refCount.value = item.value.refCount ?? 0;
      form.value = {
        title: item.value.title,
        type: item.value.type,
        applicableScope: item.value.applicableScope ?? '',
        notApplicable: item.value.notApplicable ?? '',
      };
    }
    reviewRecords.value = await getContentReviews(itemId);
    const versionData = await getContentVersions(itemId);
    versions.value = versionData;
    const latest = versionData[versionData.length - 1];
    currentScript.value = latest?.script ?? '';
    currentSubtitle.value = latest?.subtitleText ?? '';
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
.content-detail__header {
  margin-bottom: 20px;
}
.content-detail__title {
  font-size: 20px;
  font-weight: 500;
  margin: 8px 0 4px;
}
.content-detail__meta {
  font-size: 13px;
  color: var(--text-2);
  margin: 0;
}
.content-detail__header-tags {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
}
.content-detail__type {
  font-size: 12px;
  color: var(--text-2);
  background: var(--bg);
  padding: 2px 10px;
  border-radius: 4px;
}
.content-detail__grid {
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  gap: 16px;
  align-items: start;
}
.content-detail__main,
.content-detail__side {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.card {
  background: var(--surface);
  border-radius: 12px;
  padding: 20px;
}
.card__title {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 12px;
}
.card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.card__note {
  font-size: 12px;
  color: var(--text-2);
  margin: 8px 0 0;
}
.card__actions {
  display: flex;
  gap: 10px;
  margin-top: 12px;
}
.form-row {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
}
.form-field {
  flex: 1;
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
  background: var(--surface);
  color: var(--text-1);
}
.form-textarea {
  width: 100%;
  min-height: 80px;
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 12px;
  font-size: 14px;
  box-sizing: border-box;
  resize: vertical;
}
.form-file {
  font-size: 13px;
  color: var(--text-2);
  padding: 12px;
  background: var(--bg);
  border-radius: 10px;
}
.script {
  background: var(--bg);
  border-radius: 10px;
  padding: 12px;
  font-size: 13px;
  line-height: 1.6;
  color: text-2;
}
.state-flow {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}
.state-flow__node {
  font-size: 13px;
  color: var(--text-2);
  padding: 4px 10px;
  border-radius: 6px;
  background: var(--bg);
}
.state-flow__node--active {
  background: var(--primary-light);
  color: var(--primary);
  font-weight: 500;
}
.state-flow__arrow {
  color: var(--text-3);
}
.review-record {
  display: flex;
  gap: 10px;
  margin-bottom: 12px;
}
.review-record__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--primary);
  flex-shrink: 0;
  margin-top: 5px;
}
.review-record__title {
  font-size: 13px;
  font-weight: 500;
}
.review-record__meta {
  font-size: 12px;
  color: var(--text-2);
  margin-top: 2px;
}
.version-item {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
  font-size: 13px;
}
.version-item__num {
  font-weight: 500;
}
.version-item__desc {
  color: var(--text-2);
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
.btn--text {
  background: none;
  color: var(--primary);
  min-height: 32px;
  padding: 0;
  font-size: 13px;
}
.btn--block { width: 100%; }
</style>
