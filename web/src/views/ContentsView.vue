<template>
  <AppLayout>
    <div class="contents-page">
      <div class="contents-page__header">
        <div>
          <h1 class="contents-page__title">审核内容库</h1>
          <p class="contents-page__meta">所有内容经临床审定，附字幕与文字替代。示意图不是你的真实病变，不能据此判断本人病因。</p>
        </div>
        <div class="contents-page__search">
          <input class="contents-page__search-input" placeholder="🔍 搜索已发布内容" />
        </div>
      </div>

      <!-- 筛选 -->
      <div class="contents-page__filters">
        <button
          v-for="f in filters"
          :key="f"
          class="contents-page__filter"
          :class="{ 'contents-page__filter--active': activeFilter === f }"
          @click="activeFilter = f"
        >
          {{ f }}
        </button>
      </div>

      <div class="contents-page__grid">
        <!-- 左：内容卡片 -->
        <div class="contents-page__main">
          <p class="contents-page__section-title">为你推荐{{ recommendationReason }}</p>
          <div class="contents-page__cards">
            <div
              v-for="item in recommended"
              :key="item.id"
              class="content-card"
              @click="onSelect(item)"
            >
              <div class="content-card__thumb">{{ item.type === '视频' ? '▶' : '🖼' }}</div>
              <div class="content-card__body">
                <div class="content-card__title">{{ item.title }}</div>
                <div class="content-card__meta">{{ item.type === '视频' ? '视频' : '图文' }}</div>
                <div class="content-card__tags">
                  <StatusTag label="已审核" />
                  <span class="content-card__scope">适用：{{ item.applicableScope }}</span>
                </div>
              </div>
            </div>
          </div>

          <p class="contents-page__section-title">全部内容（{{ filteredAll.length }}）</p>
          <div class="contents-page__cards">
            <div
              v-for="item in filteredAll"
              :key="item.id"
              class="content-card"
              @click="onSelect(item)"
            >
              <div class="content-card__thumb">{{ item.type === '视频' ? '▶' : '🖼' }}</div>
              <div class="content-card__body">
                <div class="content-card__title">{{ item.title }}</div>
                <div class="content-card__meta">{{ item.type === '视频' ? '视频' : '图文' }}</div>
                <div class="content-card__tags">
                  <StatusTag label="已审核" />
                  <span class="content-card__scope">适用：{{ item.applicableScope || '所有用户' }}</span>
                </div>
              </div>
            </div>
          </div>

          <TipBar type="warn">
            本库不包含实时生成的个性化查体或训练处方；康复动作内容待专业设计与审定后再加入。
          </TipBar>
        </div>

        <!-- 右：详情抽屉 -->
        <div v-if="selected" class="contents-page__drawer">
          <div class="drawer">
            <div class="drawer__header">
              <div class="drawer__title">内容详情</div>
              <button class="drawer__close" @click="selected = null">✕</button>
            </div>
            <div class="drawer__player">
              <div class="drawer__play-btn">▶</div>
              <div class="drawer__player-caption">示意动画（非本人影像） · CC 字幕</div>
            </div>
            <div class="drawer__body">
              <div class="drawer__item-title">{{ selected.title }}</div>
              <div class="drawer__meta">
                <StatusTag label="已审核" />
                <span v-if="selected.publishedAt">发布于 {{ selected.publishedAt.slice(0, 10) }}</span>
              </div>
              <div class="drawer__scope">
                <div class="drawer__scope-row">
                  <span class="drawer__scope-label">适用</span>
                  <span class="drawer__scope-text">{{ selected.applicableScope || '所有用户' }}</span>
                </div>
                <div class="drawer__scope-row">
                  <span class="drawer__scope-label">不适用</span>
                  <span class="drawer__scope-text">{{ selected.notApplicable || '无' }}</span>
                </div>
              </div>
              <div class="drawer__transcript">
                <div class="drawer__transcript-title">文字替代（全文）</div>
                <p class="drawer__transcript-text">{{ selected.subtitleText || selected.script || '暂无文字替代' }}</p>
              </div>
              <div class="drawer__retell">
                <div class="drawer__retell-title">看完后，用一句话说说你理解了什么（可选）</div>
                <textarea
                  v-model="retellText"
                  class="drawer__textarea"
                  placeholder="例如：L5/S1 是腰椎最下面那个椎间盘的位置…"
                  :maxlength="500"
                />
                <button class="btn btn--primary btn--sm" @click="onSubmitRetell">提交</button>
              </div>
              <div class="drawer__feedback">
                <div class="drawer__feedback-title">这条内容对你有帮助吗？</div>
                <div class="drawer__feedback-chips">
                  <button
                    v-for="opt in ['看懂了', '没看懂', '内容有误（举报）']"
                    :key="opt"
                    class="chip"
                    @click="onContentFeedback(opt)"
                  >
                    {{ opt }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { toast } from "@/utils/toast";
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import AppLayout from '@/components/AppLayout.vue';
import StatusTag from '@/components/StatusTag.vue';
import TipBar from '@/components/TipBar.vue';
import { api } from '@/api/client';
import { getContentDetail, listEpisodes, getLatestAnalysis, createHelpFeedback, submitRetell } from '@/api';
import type { ContentItem, ContentDetail } from '@/api/types';

const filters = ['全部', '视频', '图文组件'];
const activeFilter = ref('全部');
const selected = ref<ContentDetail | null>(null);
const retellText = ref('');
const recommendationReason = ref('');

const filteredAll = computed(() => {
  if (activeFilter.value === '全部') return all.value;
  return all.value.filter((i) => i.type === activeFilter.value);
});

async function onSelect(item: ContentItem) {
  try {
    selected.value = await getContentDetail(item.id);
  } catch {
    selected.value = { ...item, script: null, subtitleText: null, modelAssetVersion: null, publishedAt: null, reviews: [], versions: [] };
  }
}
const recommended = ref<ContentItem[]>([]);
const all = ref<ContentItem[]>([]);
const route = useRoute();

onMounted(async () => {
  try {
    const items = await api.get<ContentItem[]>('/contents/published');
    // 从分析页“播放”跳转过来时，自动打开对应内容详情
    const playId = route.query.id as string | undefined;
    if (playId) {
      const target = items.find((i) => i.id === playId);
      if (target) await onSelect(target);
    }
    // 为你推荐：基于用户报告术语匹配
    let reportText = '';
    try {
      const episodes = await listEpisodes();
      if (episodes.length > 0) {
        const { timeline } = await import('@/api');
        const tl = await timeline(episodes[0].id);
        const reportEvent = [...tl.events].reverse().find((e) => e.eventType === '报告' && e.rawText);
        if (reportEvent) reportText = reportEvent.rawText ?? '';
      }
    } catch {
      // 忽略
    }
    const tokens = (reportText.match(/[\u4e00-\u9fa5]{2,}|[A-Za-z0-9\/]{2,}/g) ?? []).filter((t) => t.length >= 2);
    const scored = items.map((c) => {
      let score = 0;
      for (const t of tokens) {
        if (c.title.includes(t) || (c.applicableScope ?? '').includes(t)) score += 1;
      }
      return { c, score };
    });
    const matched = scored.filter((s) => s.score > 0).sort((a, b) => b.score - a.score);
    recommended.value = matched.slice(0, 3).map((s) => s.c);
    recommendationReason.value = matched.length > 0 ? '（原因：与你的报告或病程匹配）' : '';
    const recommendedIds = new Set(recommended.value.map((i) => i.id));
    all.value = items.filter((i) => !recommendedIds.has(i.id));
  } catch {
    // 加载失败不阻塞
  }
});

async function onSubmitRetell() {
  if (!selected.value) return;
  if (!retellText.value.trim()) {
    toast('请先填写你的理解');
    return;
  }
  try {
    // 复述用于检验理解：保存到内容复述记录（不写入病程）
    await submitRetell(selected.value.id, retellText.value);
    toast('已提交，感谢检验');
    retellText.value = '';
  } catch (e) {
    toast((e as Error).message);
  }
}

async function onContentFeedback(opt: string) {
  if (!selected.value) return;
  if (opt === '内容有误（举报）') {
    toast('请前往“反馈与举报”页提交详细描述');
    return;
  }
  try {
    const episodes = await listEpisodes();
    if (episodes.length > 0) {
      const analysis = await getLatestAnalysis(episodes[0].id);
      if (analysis) {
        await createHelpFeedback(analysis.id, opt === '看懂了' ? '看懂了' : '都不好', `内容反馈（${selected.value.title}）：${opt}`);
      }
    }
    toast('感谢反馈');
  } catch (e) {
    toast((e as Error).message);
  }
}
</script>

<style scoped>
.contents-page__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 16px;
}
.contents-page__title {
  font-size: 20px;
  font-weight: 500;
  margin: 0 0 4px;
}
.contents-page__meta {
  font-size: 13px;
  color: var(--text-2);
  margin: 0;
}
.contents-page__search-input {
  width: 280px;
  height: 40px;
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 0 14px;
  font-size: 14px;
  outline: none;
}
.contents-page__filters {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
}
.contents-page__filter {
  min-height: 36px;
  padding: 0 16px;
  border-radius: 18px;
  border: 1px solid var(--border);
  background: var(--surface);
  font-size: 13px;
  color: var(--text-2);
  cursor: pointer;
}
.contents-page__filter--active {
  background: var(--primary);
  border-color: var(--primary);
  color: #fff;
}
.contents-page__grid {
  display: grid;
  grid-template-columns: 1fr 380px;
  gap: 20px;
  align-items: start;
}
.contents-page__section-title {
  font-size: 14px;
  color: var(--text-2);
  margin: 0 0 12px;
}
.contents-page__cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}
.content-card {
  background: var(--surface);
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
}
.content-card--offline {
  opacity: 0.5;
}
.content-card__thumb {
  height: 100px;
  background: var(--primary-light);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--primary);
  font-size: 28px;
}
.content-card__body {
  padding: 12px;
}
.content-card__title {
  font-size: 14px;
  font-weight: 500;
  line-height: 1.4;
}
.content-card__meta {
  font-size: 12px;
  color: var(--text-2);
  margin-top: 4px;
}
.content-card__tags {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  flex-wrap: wrap;
}
.content-card__scope {
  font-size: 11px;
  color: var(--text-3);
}
.contents-page__drawer {
  position: sticky;
  top: 80px;
}
.drawer {
  background: var(--surface);
  border-radius: 12px;
  overflow: hidden;
}
.drawer__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid var(--border);
}
.drawer__title {
  font-size: 15px;
  font-weight: 500;
}
.drawer__close {
  background: none;
  border: none;
  font-size: 16px;
  cursor: pointer;
  color: var(--text-2);
}
.drawer__player {
  background: #1B2230;
  height: 180px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
}
.drawer__play-btn {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: var(--surface);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--primary);
  font-size: 18px;
}
.drawer__player-caption {
  font-size: 11px;
  color: var(--text-3);
}
.drawer__body {
  padding: 16px;
}
.drawer__item-title {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 8px;
}
.drawer__meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--text-2);
  margin-bottom: 6px;
}
.drawer__meta-tag {
  font-size: 11px;
  color: var(--text-2);
  background: var(--bg);
  padding: 1px 8px;
  border-radius: 4px;
}
.drawer__scope {
  margin: 12px 0;
}
.drawer__scope-row {
  display: flex;
  gap: 12px;
  margin-bottom: 8px;
}
.drawer__scope-label {
  font-size: 13px;
  color: var(--text-2);
  width: 48px;
  flex-shrink: 0;
}
.drawer__scope-text {
  font-size: 13px;
  flex: 1;
  line-height: 1.5;
}
.drawer__transcript {
  margin: 12px 0;
}
.drawer__transcript-title {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 6px;
}
.drawer__transcript-text {
  font-size: 13px;
  line-height: 1.6;
  color: var(--text-2);
  margin: 0;
}
.drawer__retell {
  background: var(--primary-light);
  border-radius: 10px;
  padding: 12px;
  margin: 12px 0;
}
.drawer__retell-title {
  font-size: 13px;
  font-weight: 500;
  margin-bottom: 8px;
}
.drawer__textarea {
  width: 100%;
  min-height: 64px;
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 10px;
  font-size: 13px;
  line-height: 1.5;
  margin-bottom: 8px;
  outline: none;
  font-family: inherit;
}
.drawer__feedback-title {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 8px;
}
.drawer__feedback-chips {
  display: flex;
  gap: 8px;
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
.btn--sm { min-height: 32px; padding: 0 12px; font-size: 13px; }
.chip {
  min-height: 32px;
  padding: 0 12px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: var(--surface);
  font-size: 12px;
  cursor: pointer;
}
</style>
