import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { spawn, ChildProcess } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'

// Get directory name in ESM
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Plugin to start backend server automatically
function backendServerPlugin() {
  let backendProcess: ChildProcess | null = null

  return {
    name: 'backend-server',
    configureServer() {
      const backendPath = path.resolve(__dirname, 'backend')
      
      console.log('\n🚀 Starting Python backend server...\n')
      console.log('📁 Backend path:', backendPath)
      
      // For Windows, use python
      backendProcess = spawn('python', ['run.py'], {
        cwd: backendPath,
        stdio: 'inherit',
        shell: true
      })

      backendProcess.on('error', (err) => {
        console.error('❌ Failed to start backend server:', err)
        console.log('💡 Make sure Python is installed and in PATH')
        console.log('💡 Try running: cd backend && python run.py')
      })

      backendProcess.on('exit', (code) => {
        if (code !== null && code !== 0) {
          console.error(`❌ Backend server exited with code ${code}`)
        }
      })

      console.log('✅ Backend server started on http://localhost:8000')
      console.log('📚 API docs available at http://localhost:8000/docs\n')
    },
    closeBundle() {
      // Kill backend server when Vite closes
      if (backendProcess) {
        console.log('\n🛑 Stopping backend server...\n')
        backendProcess.kill()
      }
    }
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), backendServerPlugin()],
  server: {
    port: 3000,
    host: '0.0.0.0',
    open: true,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path
      },
      '/docs': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
      '/openapi.json': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
})