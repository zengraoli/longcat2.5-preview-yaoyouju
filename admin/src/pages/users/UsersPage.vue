<template>
  <div class="users-page">
    <div class="page-header">
      <h2 class="page-title">用户与权限</h2>
      <button class="btn-primary" @click="showCreate = true">新增成员</button>
    </div>

    <div class="card">
      <div class="card-head">
        <h3 class="section-title">成员表</h3>
        <span class="head-note">最小必要授权；单条授权可查看与撤回</span>
      </div>
      <table class="data-table">
        <thead>
          <tr><th>姓名</th><th>角色</th><th>MFA</th><th>状态</th><th>最近登录</th><th>操作</th></tr>
        </thead>
        <tbody>
          <tr v-for="user in users" :key="user.id">
            <td>{{ user.name }}</td>
            <td><span class="tag tag-info">{{ roleName(user.role_id) }}</span></td>
            <td><span class="tag" :class="user.mfa_enabled ? 'tag-ok' : 'tag-warn'">{{ user.mfa_enabled ? '已启用' : '未启用' }}</span></td>
            <td><span class="tag tag-ok">{{ user.locked_until ? '已锁定' : '活跃' }}</span></td>
            <td>{{ user.lastLogin || '-' }}</td>
            <td>
              <button class="btn-small" @click="showGrants = showGrants === user.id ? '' : user.id">授权记录</button>
            </td>
          </tr>
        </tbody>
      </table>
      <div class="grant-panel" v-if="showGrants">
        <p class="grant-title">单条授权记录（{{ grantUser?.name }}）</p>
        <ul class="grant-list">
          <li v-for="(g, i) in grants" :key="i">
            <span>{{ g.scope }} · {{ g.granted }}</span>
            <button class="btn-small-danger" @click="revokeGrant(g)">撤回</button>
          </li>
          <li v-if="grants.length === 0" class="empty-note">暂无单条授权记录</li>
        </ul>
      </div>
    </div>

    <div class="card">
      <h3 class="section-title">权限矩阵</h3>
      <table class="data-table">
        <thead>
          <tr><th>权限点</th><th v-for="role in roles" :key="role.id">{{ role.name }}</th></tr>
        </thead>
        <tbody>
          <tr v-for="(perm, i) in permissionMatrix" :key="i">
            <td>{{ perm.name }}</td>
            <td v-for="(role, ri) in roles" :key="role.id">{{ perm.ops[ri] }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="card">
      <h3 class="section-title">双人确认设置</h3>
      <div class="dual-row">
        <div class="dual-info">
          <span class="dual-title">敏感操作需两名审批人确认</span>
          <span class="dual-desc">批量下线、模型发布等操作需不同审批人二次确认</span>
        </div>
        <button class="switch" :class="{ on: dualConfirm }" @click="dualConfirm = !dualConfirm"></button>
      </div>
    </div>

    <!-- 新增成员 -->
    <div class="modal" v-if="showCreate" @click.self="showCreate = false">
      <div class="modal-content card">
        <h3 class="modal-title">新增成员</h3>
        <div class="form-group">
          <label>姓名</label>
          <input v-model="newUser.name" placeholder="请输入姓名" />
        </div>
        <div class="form-group">
          <label>角色</label>
          <select v-model="newUser.roleId">
            <option v-for="role in roles" :key="role.id" :value="role.id">{{ role.name }}</option>
          </select>
        </div>
        <div class="modal-actions">
          <button class="btn-secondary" @click="showCreate = false">取消</button>
          <button class="btn-primary" @click="createUser">创建</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { api } from '../../utils/api';

const users = ref<any[]>([]);
const roles = ref<any[]>([]);
const showCreate = ref(false);
const showGrants = ref('');
const dualConfirm = ref(true);
const newUser = ref({ name: '', roleId: '' });

const grantUser = computed(() => users.value.find((u) => u.id === showGrants.value));

const grants = computed(() => {
  if (!grantUser.value) return [];
  return [
    { scope: '内容审核', granted: '2026-09-01' },
    { scope: '审计查看', granted: '2026-09-01' },
  ];
});

// 权限矩阵对齐 docs/design/admin/B10.png：✓ 允许 / ◐ 发起申请 / — 无
const permissionMatrix = [
  { name: '内容：编辑草稿/提交', ops: ['✓', '—', '—', '—', '✓'] },
  { name: '内容：审定/退回（医学审定）', ops: ['—', '✓', '—', '—', '—'] },
  { name: '内容：发布（双人）', ops: ['◐', '✓', '—', '—', '✓'] },
  { name: '内容：撤回/应急下线', ops: ['—', '✓', '—', '—', '✓'] },
  { name: '证据库：录入/核实/停用', ops: ['✓/—/—', '✓/✓/✓', '✓/✓/✓', '—', '✓'] },
  { name: '举报：初筛/临床复核/明文授权', ops: ['✓/—/—', '✓/✓/✓', '✓/—/—', '✓/—/—', '✓/✓/✓'] },
  { name: '用户资料：脱敏查看/明文（单条授权）', ops: ['✓/—', '✓/✓', '✓/—', '✓/—', '✓/✓'] },
  { name: '功能开关/模型发布', ops: ['—', '◐', '✓', '—', '✓'] },
  { name: '评测集/评测运行', ops: ['—', '◐', '✓', '—', '✓'] },
  { name: '成员与角色/审计导出审批', ops: ['—', '—', '—', '◐', '✓'] },
];

function roleName(roleId: string) {
  const role = roles.value.find((r) => r.id === roleId);
  return role?.name || roleId;
}

async function revokeGrant(g: any) {
  alert(`已撤回 ${grantUser.value?.name} 的“${g.scope}”授权（演示）。`);
}

async function createUser() {
  if (!newUser.value.name || !newUser.value.roleId) return;
  try {
    await api.createAdminUser({ name: newUser.value.name, roleId: newUser.value.roleId });
    showCreate.value = false;
    await loadUsers();
  } catch (e: any) {
    alert(e.message);
  }
}

async function loadUsers() {
  try {
    users.value = await api.getAdminUsers();
    roles.value = await api.getAdminRoles();
  } catch (e) {
    console.error('Failed to load users:', e);
  }
}

onMounted(loadUsers);
</script>

<style scoped>
.users-page {
  padding: 0;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-title {
  font-size: 20px;
  font-weight: 500;
}

.head-note {
  font-size: 12px;
  color: var(--text-3);
}

.card-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-title {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 16px;
}

.card-head .section-title {
  margin-bottom: 0;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.data-table th,
.data-table td {
  text-align: left;
  padding: 12px 8px;
  border-bottom: 1px solid var(--border);
}

.data-table th {
  color: var(--text-2);
  font-weight: 500;
}

.perm-y {
  color: var(--ok);
  font-weight: 600;
}

.perm-n {
  color: var(--text-3);
}

.grant-panel {
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 16px;
  margin-top: 16px;
}

.grant-title {
  font-size: 13px;
  font-weight: 500;
  margin-bottom: 10px;
}

.grant-list {
  list-style: none;
  padding: 0;
}

.grant-list li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  color: var(--text-2);
  padding: 6px 0;
}

.empty-note {
  color: var(--text-3);
}

.dual-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dual-title {
  display: block;
  font-size: 14px;
  font-weight: 500;
}

.dual-desc {
  display: block;
  font-size: 12px;
  color: var(--text-3);
  margin-top: 4px;
}

.switch {
  width: 44px;
  height: 24px;
  border-radius: 12px;
  background: var(--border);
  border: none;
  position: relative;
  cursor: pointer;
  flex-shrink: 0;
}

.switch::after {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #fff;
  transition: left 0.15s;
}

.switch.on {
  background: var(--primary);
}

.switch.on::after {
  left: 22px;
}

.btn-primary {
  background: var(--primary);
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 10px 20px;
  font-size: 13px;
  cursor: pointer;
}

.btn-secondary {
  background: var(--surface);
  color: var(--text-2);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 10px 20px;
  font-size: 13px;
  cursor: pointer;
}

.btn-small {
  background: var(--surface);
  color: var(--primary);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 5px 12px;
  font-size: 12px;
  cursor: pointer;
}

.btn-small-danger {
  background: none;
  color: var(--error);
  border: none;
  font-size: 12px;
  cursor: pointer;
}

.modal {
  position: fixed;
  inset: 0;
  background: rgba(27, 34, 48, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.modal-content {
  width: 420px;
  background: var(--surface);
  border-radius: 12px;
  padding: 24px;
}

.modal-title {
  font-size: 17px;
  font-weight: 500;
  margin-bottom: 20px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  font-size: 13px;
  color: var(--text-2);
  margin-bottom: 6px;
}

.form-group input,
.form-group select {
  width: 100%;
  height: 40px;
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 0 12px;
  font-size: 13px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
}
</style>
