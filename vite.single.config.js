// Builds the whole site into one self-contained HTML file (dist-single/index.html)
// that can be opened directly, without a server.
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'

export default defineConfig({
  plugins: [react(), viteSingleFile()],
  build: { outDir: 'dist-single', assetsInlineLimit: 100_000_000, chunkSizeWarningLimit: 10_000 },
})
