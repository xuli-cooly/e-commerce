import React from 'react'
import ReactDOM from 'react-dom/client'
import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import { registerMicroApps, start } from 'qiankun'
import App from './App'
import { microApps } from './qiankun/apps'
import { initState } from './qiankun/state'
import 'antd/dist/reset.css'

// Initialize qiankun global state
const raw = localStorage.getItem('admin_shell_auth')
let initialToken: string | null = null
if (raw) {
  try {
    initialToken = JSON.parse(raw)?.state?.token ?? null
  } catch {
    // ignore
  }
}
initState(initialToken)

// Sync admin_token for sub-apps that read it directly from localStorage on init
if (initialToken) {
  localStorage.setItem('admin_token', initialToken)
}

// Register sub-apps
registerMicroApps(microApps, {
  beforeMount: [(app) => {
    console.log('[shell] before mount:', app.name)
    return Promise.resolve()
  }],
  afterUnmount: [(app) => {
    console.log('[shell] after unmount:', app.name)
    return Promise.resolve()
  }],
})

// Render shell first, then start qiankun so sub-app containers (#subapp-*) exist in DOM
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ConfigProvider locale={zhCN} theme={{ token: { colorPrimary: '#01c2c3' } }}>
      <App />
    </ConfigProvider>
  </React.StrictMode>
)

// Start qiankun after React has rendered (containers must exist before qiankun activates)
setTimeout(() => {
  start({
    prefetch: false,
    singular: false,
    // Strip inline `type="module"` scripts (e.g. @react-refresh preamble) that qiankun
    // cannot eval. The vite-plugin-qiankun only transforms body module scripts;
    // Vite injects the React HMR preamble into <head> as a module script which causes
    // "Cannot use import statement outside a module" when qiankun tries to eval it.
    getTemplate: (tpl: string) =>
      tpl.replace(/<script\s[^>]*type=["']?module["']?[^>]*>[\s\S]*?<\/script>/gi, ''),
  })
}, 0)
