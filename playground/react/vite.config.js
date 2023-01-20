import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import inspectPlugin from 'vite-plugin-inspect'
import autoCSSModules from 'vite-plugin-auto-css-modules'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [autoCSSModules(), react(), inspectPlugin()],
})
