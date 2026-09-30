import { defineConfig } from 'vitest/config';

/** 独立 vitest 配置：不加载 uni-app 的 vite 插件（避免 Node 环境报错） */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
