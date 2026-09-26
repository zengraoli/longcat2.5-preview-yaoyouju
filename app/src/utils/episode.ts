import { api } from '../api/request';

/**
 * 确保用户有可用病程；没有时自动创建一个"本次发作"（起点尚未确认）。
 * 返回病程 ID；失败返回空字符串。
 */
export async function ensureEpisodeId(): Promise<string> {
  try {
    const episodes = await api.getEpisodes();
    if (episodes && episodes.length > 0) return episodes[0].id;
    const created = await api.createEpisode({ title: '本次发作' });
    return created?.id || '';
  } catch (e) {
    console.error('Failed to ensure episode:', e);
    return '';
  }
}
