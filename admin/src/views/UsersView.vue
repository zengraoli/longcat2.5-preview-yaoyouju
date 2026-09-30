<template>
  <AppLayout>
    <div class="users">
      <div class="users__header">
        <h1 class="users__title">用户与权限</h1>
      </div>

      <!-- 成员 -->
      <div class="card">
        <div class="card__header">
          <div class="card__title">成员（{{ members.length }}）</div>
          <div class="card__header-tags">
            <span class="card__tag">与用户体系隔离 · 仅受邀加入</span>
            <button class="btn btn--primary btn--sm" @click="onInvite">＋ 邀请成员</button>
          </div>
        </div>
        <table class="table">
          <thead>
            <tr><th>姓名</th><th>工作邮箱</th><th>角色</th><th>MFA</th><th>最近登录</th><th>状态</th><th>操作</th></tr>
          </thead>
          <tbody>
            <tr v-for="m in members" :key="m.id">
              <td class="table__title">{{ m.name }}</td>
              <td>{{ m.email }}</td>
              <td><StatusTag :label="m.roleName" :tone="m.roleTone" /></td>
              <td><StatusTag :label="m.mfaEnabled ? '已绑定' : '未绑定'" :tone="m.mfaEnabled ? 'ok' : 'warn'" /></td>
              <td>{{ m.lastLoginAt ?? '—' }}</td>
              <td><StatusTag :label="m.status" /></td>
              <td class="table__actions">
                <button class="btn btn--text" @click="onChangeRole(m)">改角色</button>
                <button class="btn btn--text" @click="onToggleStatus(m)">
                  {{ m.status === '正常' ? '停用' : '启用' }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="users__grid">
        <!-- 权限矩阵 -->
        <div class="card">
          <div class="card__header">
            <div class="card__title">权限矩阵（最小必要）</div>
            <div class="card__header-tags">
              <span class="card__legend">✓ 允许</span>
              <span class="card__legend">◐ 发起/申请</span>
              <span class="card__legend">— 无</span>
            </div>
          </div>
          <table class="table">
            <thead>
              <tr><th>权限点</th><th>运营编辑</th><th>临床审核</th><th>技术负责人</th><th>合规支持</th><th>超级管理员</th></tr>
            </thead>
            <tbody>
              <tr v-for="(row, i) in permissionMatrix" :key="i">
                <td class="table__title">{{ row.point }}</td>
                <td v-for="(v, vi) in row.values" :key="vi" class="table__perm">
                  <span v-if="v === '✓'" class="perm--ok">✓</span>
                  <span v-else-if="v === '◐'" class="perm--partial">◐</span>
                  <span v-else class="perm--none">—</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 单条授权 -->
        <div class="users__side">
          <div class="card">
            <div class="card__header">
              <div class="card__title">👁 单条授权（明文查看）</div>
              <span class="card__tag card__tag--ok">{{ authorizations.length }} 条</span>
            </div>
            <div v-for="(a, i) in authorizations" :key="i" class="auth-item">
              <div class="auth-item__header">
                <span class="auth-item__title">{{ a.adminName || '—' }} → {{ a.targetType }}:{{ a.targetId }}</span>
              </div>
              <div class="auth-item__meta">{{ a.reason }}</div>
              <div class="auth-item__meta">{{ a.createdAt.slice(0, 16).replace('T', ' ') }}</div>
            </div>
            <p v-if="authorizations.length === 0" class="card__note">暂无授权记录</p>
            <p class="card__note">
              授权由用户在举报单内勾选或临床审核申请、超管审批；每次读取写审计；用户可随时撤回。
            </p>
          </div>

          <!-- 双人确认设置 -->
          <div class="card">
            <div class="card__title">双人确认设置</div>
            <div v-for="(d, i) in dualConfirm" :key="i" class="dual-item">
              <span class="dual-item__name">{{ d.name }}</span>
              <span class="dual-item__value">{{ d.value }}</span>
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
import { listAdminUsers, listAuthorizations, setUserStatus, setUserRole } from '@/api';
import type { AdminUser } from '@/api/types';

const members = ref<Array<AdminUser & { email: string; roleName: string; roleTone: 'ok' | 'warn' | 'error' | 'info' | 'neutral'; mfaEnabled: boolean; lastLoginAt: string | null; status: string }>>([]);
const authorizations = ref<Array<{ id: string; adminName: string | null; targetType: string; targetId: string; reason: string; createdAt: string }>>([]);

const permissionMatrix = ref([
  { point: '内容：编辑草稿 / 提交', values: ['✓', '—', '—', '—', '✓'] },
  { point: '内容：审定 / 退回', values: ['—', '✓', '—', '—', '✓'] },
  { point: '内容：发布（双人）', values: ['◐', '✓', '—', '—', '✓'] },
  { point: '内容：撤回 / 应急下线', values: ['—', '✓', '—', '—', '✓'] },
  { point: '证据库：录入 / 核实 / 停用', values: ['✓/—/—', '✓/✓/✓', '—', '—', '✓'] },
  { point: '举报：初筛 / 临床复核', values: ['✓/—', '✓/✓', '—', '—', '✓'] },
  { point: '用户资料：脱敏查看 / 明文（单条授权）', values: ['✓/—', '✓/✓', '✓/—', '✓/—', '✓/✓'] },
  { point: '功能开关 / 模型发布', values: ['—', '◐', '✓', '—', '✓'] },
  { point: '评测集 / 评测运行', values: ['—', '◐', '✓', '—', '✓'] },
  { point: '成员与角色 / 审计导出审批', values: ['—', '—', '—', '◐', '✓'] },
]);



const dualConfirm = ref([
  { name: '内容发布', value: '运营编辑发起 + 临床审核确认' },
  { name: '撤回 / 应急下线', value: '临床审核 + 超管' },
  { name: '功能开关（高危）', value: '技术负责人 + 临床审核 / 超管' },
  { name: '模型激活 / 回滚', value: '技术负责人 + 超管' },
]);

async function onToggleStatus(member: typeof members.value[number]) {
  const next = member.status === '正常' ? 'disabled' : 'active';
  try {
    await setUserStatus(member.id, next);
    toast(next === 'disabled' ? '已停用' : '已启用');
    await load();
  } catch (e) {
    toast((e as Error).message);
  }
}

async function onChangeRole(member: typeof members.value[number]) {
  const roleId = prompt('角色 ID（role-ops/role-clinical/role-tech/role-compliance/role-super）', member.roleId);
  if (!roleId) return;
  try {
    await setUserRole(member.id, roleId);
    toast('已修改角色');
    await load();
  } catch (e) {
    toast((e as Error).message);
  }
}

function onInvite() {
  const name = prompt('成员姓名');
  if (!name) return;
  toast('演示环境不支持自助注册，请联系超级管理员添加');
}

async function load() {
  try {
    const users = await listAdminUsers();
    members.value = users.map((u) => ({
      ...u,
      email: '—',
      roleName: u.roleName,
      roleTone: u.roleId === 'role-super' ? 'error' as const : u.roleId === 'role-clinical' ? 'info' as const : u.roleId === 'role-ops' ? 'ok' as const : u.roleId === 'role-tech' ? 'warn' as const : 'neutral' as const,
      mfaEnabled: !!u.mfaEnabled,
      lastLoginAt: u.lastLoginAt,
      status: u.status === 'active' ? '正常' : '已停用',
    }));
  } catch {
    // 加载失败不阻塞
  }
  try {
    authorizations.value = await listAuthorizations();
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
.users__header {
  margin-bottom: 20px;
}
.users__title {
  font-size: 20px;
  font-weight: 500;
  margin: 0;
}
.users__grid {
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  gap: 16px;
  align-items: start;
}
.users__side {
  display: flex;
  flex-direction: column;
  gap: 16px;
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
.card__legend {
  font-size: 12px;
  color: var(--text-2);
}
.card__note {
  font-size: 12px;
  color: var(--text-2);
  line-height: 1.5;
  margin: 12px 0 0;
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
.table__actions {
  display: flex;
  gap: 8px;
  white-space: nowrap;
}
.table__perm {
  text-align: center;
}
.perm--ok { color: var(--ok); }
.perm--partial { color: var(--warn); }
.perm--none { color: var(--text-3); }
.auth-item {
  background: var(--bg);
  border-radius: 10px;
  padding: 12px;
  margin-bottom: 10px;
}
.auth-item__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}
.auth-item__title {
  font-size: 13px;
  font-weight: 500;
}
.auth-item__meta {
  font-size: 12px;
  color: var(--text-2);
  line-height: 1.5;
}
.dual-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
  font-size: 13px;
}
.dual-item__name {
  font-weight: 500;
}
.dual-item__value {
  color: var(--text-2);
  text-align: right;
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
.btn--text.btn--danger { color: var(--error); }
</style>
