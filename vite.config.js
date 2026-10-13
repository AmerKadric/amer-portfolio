import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import quickView from './quick-view.js'

export default defineConfig({
  plugins: [react(), quickView()],
})
