import process from 'node:process';
import console from 'node:console';
import { createServer } from 'vite';
import react from '@vitejs/plugin-react';
import tailwind from '@tailwindcss/vite';
import path from 'node:path';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
const root = process.cwd();
const cacheDir = await mkdtemp(
  path.join(tmpdir(), 'oa-approval-presentation-'),
);
const server = await createServer({
  cacheDir,
  configFile: false,
  root,
  plugins: [react(), tailwind()],
  resolve: {
    alias: [
      {
        find: '#extensions/nocobase-approval-ui',
        replacement: path.join(
          root,
          'client/extensions/nocobase-approval-ui/index.ts',
        ),
      },
      {
        find: /^#components\/(.*)$/,
        replacement: path.join(root, 'client/components/$1'),
      },
      { find: /^#lib\/(.*)$/, replacement: path.join(root, 'client/lib/$1') },
      {
        find: /^#hooks\/(.*)$/,
        replacement: path.join(root, 'client/hooks/$1'),
      },
    ],
    dedupe: ['react', 'react-dom', 'react-router'],
  },
  server: {
    host: '127.0.0.1',
    port: 17853,
    strictPort: true,
    hmr: false,
    watch: null,
  },
});
await server.listen();
console.log('Approval presentation fixture ready on 17853');

for (const signal of ['SIGINT', 'SIGTERM'])
  process.once(signal, async () => {
    await server.close();
    await rm(cacheDir, { recursive: true, force: true });
    process.exit(0);
  });
