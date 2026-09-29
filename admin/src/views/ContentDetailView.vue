<template>
  <AppLayout>
    <div class="content-detail">
      <div class="content-detail__header">
        <div>
          <button class="btn btn--text" @click="goBack">‹ 返回</button>
          <h1 class="content-detail__title">{{ item?.title ?? '内容详情' }}</h1>
          <p class="content-detail__meta">
            内容 ID {{ itemId }} · 创建 {{ creator }} 2026-08-20 · 上次发布 v1 2026-09-01 · 当前引用 19 条分析
          </p>
        </div>
        <div class="content-detail__header-tags">
          <span class="content-detail__type">{{ item?.type }}</span>
          <StatusTag :label="item?.currentStatus ?? ''" />
          <span class="content-detail__version">v2 · 更正自 v1</span>
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
                <input class="form-input" :value="item?.title" />
              </div>
              <div class="form-field">
                <label class="form-label">类型</label>
                <input class="form-input" :value="item?.type === '视频' ? '视频（示意动画 · 2:55）' : '图文'" />
              </div>
            </div>
            <div class="form-row">
              <div class="form-field">
                <label class="form-label">适用范围</label>
                <textarea class="form-textarea" :value="item?.applicableScope" />
              </div>
              <div class="form-field">
                <label class="form-label">不适用范围</label>
                <textarea class="form-textarea" :value="item?.notApplicable" />
              </div>
            </div>
            <div class="form-field">
              <label class="form-label">匹配术语（用于推荐理由）</label>
              <div class="form-chips">
                <span v-for="t in ['保守治疗', '久坐', '日常活动', '随访']" :key="t" class="form-chip">{{ t }}</span>
              </div>
            </div>
          </div>

          <div class="card">
            <div class="card__header">
              <div class="card__title">脚本（v2 修订处高亮）</div>
              <button class="btn btn--text">与 v1 对比</button>
            </div>
            <div class="script">
              <p>【00:00】很多人拿到“保守治疗”的建议后，最常问的是：平时能做什么、要注意什么。这个视频只讲一般原则，具体到你自己的情况，请以医生的建议为准。</p>
              <p class="script__highlight">【00:25】v2 修订：删除“每天步行 30 分钟”等具体剂量表述，改为“活动量以第二天不明显加重为参考，具体由医生或治疗师确定”。</p>
              <p>【01:10】久坐与弯腰负重是常见的加重因素……（示例脚本，省略有）</p>
            </div>
            <div class="form-row">
              <div class="form-field">
                <label class="form-label">字幕文件</label>
                <div class="form-file">subtitles_v2.srt · 已上传 · 与脚本一致性检查通过</div>
              </div>
              <div class="form-field">
                <label class="form-label">文字替代（全文）</label>
                <div class="form-file">已填写 · 612 字</div>
              </div>
            </div>
          </div>

          <div class="card">
            <div class="card__title">依据与制作</div>
            <div class="form-field">
              <label class="form-label">关联证据条目（≥1）</label>
              <div v-for="(e, i) in evidence" :key="i" class="evidence-item">
                <span class="evidence-item__checkbox" />
                <span class="evidence-item__text">{{ e.text }}</span>
                <StatusTag :label="e.status" />
              </div>
            </div>
            <div class="form-row">
              <div class="form-field">
                <label class="form-label">资源版本 / 制作方式</label>
                <input class="form-input" value="v2 · 受控 3D 白模渲染 · 未使用生成模型重绘 · 素材版本 M3D-0.4" />
              </div>
              <div class="form-field">
                <label class="form-label">资源文件</label>
                <div class="form-file">activity_v2.mp4 · 480p/720p · 上传 2026-09-19</div>
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
              <span class="state-flow__node state-flow__node--active">待医学审核</span>
              <span class="state-flow__arrow">›</span>
              <span class="state-flow__node">已审定</span>
              <span class="state-flow__arrow">›</span>
              <span class="state-flow__node">已发布</span>
            </div>
            <p class="card__note">
              当前：待医学审核（王编辑 提交于 2026-09-19 16:20）。发布需运营编辑发起 + 临床审核确认（双人）。
            </p>
            <textarea class="form-textarea" placeholder="审核意见（退回时必填；记录审核范围）" />
            <div class="card__actions">
              <button class="btn btn--primary">✓ 审核通过</button>
              <button class="btn btn--secondary">✕ 退回修改</button>
            </div>
            <button class="btn btn--block btn--disabled">发布（需双人确认 · 当前不可用）</button>
          </div>

          <div class="card">
            <div class="card__title">审核记录</div>
            <div v-for="(r, i) in reviewRecords" :key="i" class="review-record">
              <div class="review-record__dot" />
              <div>
                <div class="review-record__title">{{ r.title }}</div>
                <div class="review-record__meta">{{ r.meta }}</div>
              </div>
            </div>
          </div>

          <div class="card">
            <div class="card__title">版本链</div>
            <div v-for="(v, i) in versions" :key="i" class="version-item">
              <span class="version-item__num">v{{ v.num }}</span>
              <StatusTag :label="v.status" />
              <span class="version-item__desc">{{ v.desc }}</span>
            </div>
          </div>

          <div class="card">
            <div class="card__header">
              <div class="card__title">引用定位</div>
              <span class="card__tag">19 条分析 · 2 个页面</span>
            </div>
            <p class="card__note">
              撤回 v1 时将统一下线，并可向受影响用户发送更正通知（脱敏统计：19 位用户）。
            </p>
            <button class="btn btn--secondary btn--sm">查看引用列表（脱敏）</button>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AppLayout from '@/components/AppLayout.vue';
import StatusTag from '@/components/StatusTag.vue';
import { api } from '@/api/client';
import type { ContentItem } from '@/api/types';

const route = useRoute();
const router = useRouter();
const itemId = route.params.id as string;

const item = ref<ContentItem | null>(null);
const creator = ref('王编辑');

const evidence = ref([
  { text: 'G-03 指南摘录 · 腰痛保守治疗一般原则 · 许可：可引用 · 核实 2026-08', status: '可用' },
  { text: 'E-11 审核科普 · 久坐与腰痛 · 许可：可引用 · 核实 2026-08', status: '可用' },
  { text: 'G-07 指南 · 许可待确认（不参与检索）', status: '待确认' },
]);

const reviewRecords = ref([
  { title: '王编辑 提交 v2 审核', meta: '2026-09-19 16:20 · 附脚本、依据 G-03/E-11、字幕、文字替代' },
  { title: '李医生 标记“需要更正”', meta: '2026-09-18 10:02 · 用户举报 #ER-0197：v1 含具体步行剂量，超出适用范围' },
  { title: '王编辑 + 李医生 发布 v1', meta: '2026-09-01 09:30 · 双人确认；写入审计 A-3312' },
  { title: '李医生 审核通过 v1', meta: '2026-08-29 15:11 · 范围：一般原则说明' },
]);

const versions = ref([
  { num: 2, status: '待医学审核', desc: '更正：删除剂量表述' },
  { num: 1, status: '已发布 → 更正中', desc: '2026-09-01 · 引用 19 条' },
]);

function goBack() {
  router.back();
}

onMounted(async () => {
  try {
    const all = await api.get<ContentItem[]>('/contents');
    item.value = all.find((c) => c.id === itemId) ?? null;
  } catch {
    // 加载失败不阻塞
  }
});
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
.content-detail__version {
  font-size: 12px;
  color: var(--text-3);
}
.content-detail__grid {
  display: grid;
  grid-template-columns: 1fr 360px;
  gap: 20px;
  align-items: start;
}
.content-detail__main {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
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
.card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.card__title {
  font-size: 16px;
  font-weight: 500;
  margin: 0 0 16px;
}
.card__header .card__title {
  margin: 0;
}
.card__tag {
  font-size: 12px;
  color: var(--text-3);
}
.card__note {
  font-size: 12px;
  color: var(--text-2);
  line-height: 1.5;
  margin: 12px 0;
}
.card__actions {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
}
.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 12px;
}
.form-field {
  margin-bottom: 12px;
}
.form-row .form-field {
  margin-bottom: 0;
}
.form-label {
  display: block;
  font-size: 13px;
  color: var(--text-2);
  margin-bottom: 6px;
}
.form-input {
  width: 100%;
  height: 40px;
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 0 12px;
  font-size: 14px;
  outline: none;
  font-family: inherit;
}
.form-input:focus {
  border-color: var(--primary);
}
.form-textarea {
  width: 100%;
  min-height: 72px;
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 10px 12px;
  font-size: 14px;
  line-height: 1.5;
  outline: none;
  font-family: inherit;
  resize: vertical;
}
.form-textarea:focus {
  border-color: var(--primary);
}
.form-chips {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.form-chip {
  font-size: 12px;
  color: var(--primary);
  background: var(--primary-light);
  padding: 2px 10px;
  border-radius: 4px;
}
.form-file {
  font-size: 13px;
  color: var(--text-2);
  background: var(--bg);
  border-radius: 8px;
  padding: 10px 12px;
}
.script {
  background: var(--bg);
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
}
.script p {
  font-size: 13px;
  line-height: 1.6;
  margin: 0 0 8px;
}
.script__highlight {
  background: rgba(199, 119, 0, 0.12);
  border-radius: 4px;
  padding: 4px 8px;
  color: var(--warn);
}
.evidence-item {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}
.evidence-item__checkbox {
  width: 16px;
  height: 16px;
  border: 1px solid var(--border);
  border-radius: 4px;
  flex-shrink: 0;
}
.evidence-item__text {
  font-size: 13px;
  flex: 1;
}
.state-flow {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 12px;
}
.state-flow__node {
  font-size: 12px;
  color: var(--text-3);
  padding: 2px 8px;
  border-radius: 4px;
  background: var(--bg);
}
.state-flow__node--active {
  color: var(--warn);
  background: rgba(199, 119, 0, 0.1);
  font-weight: 500;
}
.state-flow__arrow {
  color: var(--text-3);
}
.review-record {
  display: flex;
  gap: 8px;
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
  line-height: 1.5;
}
.version-item {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}
.version-item__num {
  font-size: 13px;
  font-weight: 500;
}
.version-item__desc {
  font-size: 12px;
  color: var(--text-2);
  flex: 1;
}
.btn {
  min-height: 40px;
  padding: 0 16px;
  border-radius: 10px;
  font-size: 14px;
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
.btn--sm { min-height: 32px; padding: 0 12px; font-size: 13px; }
.btn--block { width: 100%; }
.btn--disabled {
  background: var(--bg);
  color: var(--text-3);
  cursor: not-allowed;
}
</style>
