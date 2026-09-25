<template>
  <div class="users-page">
    <div class="page-header">
      <h2 class="page-title">用户与权限</h2>
    </div>
    <div class="card">
      <h3 class="section-title">成员列表</h3>
      <table class="data-table">
        <thead>
          <tr><th>姓名</th><th>角色</th><th>MFA</th><th>状态</th></tr>
        </thead>
        <tbody>
          <tr v-for="user in users" :key="user.id">
            <td>{{ user.name }}</td>
            <td><span class="tag tag-info">{{ roleName(user.role_id) }}</span></td>
            <td>{{ user.mfa_enabled ? '已启用' : '未启用' }}</td>
            <td><span class="tag tag-ok">活跃</span></td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="card">
      <h3 class="section-title">权限矩阵</h3>
      <table class="data-table">
        <thead>
          <tr><th>权限</th><th>运营编辑</th><th>临床审核</th><th>技术</th><th>合规</th><th>超级管理</th></tr>
        </thead>
        <tbody>
          <tr><td>内容创建/编辑</td><td>Y</td><td>-</td><td>-</td><td>-</td><td>Y</td></tr>
          <tr><td>内容审核</td><td>-</td><td>Y</td><td>-</td><td>-</td><td>Y</td></tr>
          <tr><td>功能开关</td><td>-</td><td>-</td><td>Y</td><td>-</td><td>Y</td></tr>
          <tr><td>审计日志</td><td>-</td><td>-</td><td>-</td><td>Y</td><td>Y</td></tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { api } from '../../utils/api';

const users = ref<any[]>([]);

function roleName(roleId: string) {
  const map: Record<string, string> = {};
  map['role-1'] = '\u8fd0\u8425\u7f16\u8f91';
  map['role-2'] = '\u4e34\u5e8a\u5ba1\u6838';
  map['role-3'] = '\u6280\u672f';
  map['role-4'] = '\u5408\u89c4';
  map['role-5'] = '\u8d85\u7ea7\u7ba1\u7406';
  return map[roleId] || roleId;
}

async function loadUsers() {
  try {
    users.value = await api.getAdminUsers();
  } catch (e) {
    console.error('Failed to load users:', e);
  }
}

onMounted(() => { loadUsers(); });
</script>

<style scoped>
.users-page { padding: 0; }
.page-header { margin-bottom: 24px; }
.page-title { font-size: 20px; font-weight: 500; }
.section-title { font-size: 16px; font-weight: 500; margin-bottom: 16px; }
.data-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.data-table th, .data-table td { text-align: left; padding: 12px 8px; border-bottom: 1px solid var(--border); }
.data-table th { color: var(--text-2); font-weight: 500; }
</style>
