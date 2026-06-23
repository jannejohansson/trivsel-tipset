import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Build id: the commit SHA in CI (set automatically by GitHub Actions), or a
// timestamp for local builds. The running bundle bakes this in as __APP_VERSION__
// and compares it against /version.json to detect that a newer build was deployed.
const APP_VERSION = process.env.GITHUB_SHA || String(Date.now());

// Emit dist/version.json so an already-open tab can poll for new deploys.
function emitVersionFile() {
  return {
    name: 'emit-version-file',
    apply: 'build',
    closeBundle() {
      writeFileSync(
        resolve(__dirname, 'dist', 'version.json'),
        JSON.stringify({ version: APP_VERSION }),
      );
    },
  };
}

export default defineConfig({
  plugins: [react(), emitVersionFile()],
  define: {
    __APP_VERSION__: JSON.stringify(APP_VERSION),
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:7071',
        changeOrigin: true,
      },
    },
  },
});
