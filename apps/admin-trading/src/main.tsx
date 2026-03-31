import React from 'react'
import ReactDOM from 'react-dom/client'
import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import { renderWithQiankun, qiankunWindow } from 'vite-plugin-qiankun/dist/helper'
import App from './App'
import 'antd/dist/reset.css'

let root: ReturnType<typeof ReactDOM.createRoot> | null = null

function render(props: any = {}) {
  const { container } = props
  // When running inside qiankun, mount directly into the container div (not a nested #root)
  const mountPoint = container
    ? (container.querySelector('#root') ?? container)
    : document.getElementById('root')

  root = ReactDOM.createRoot(mountPoint!)
  root.render(
    <React.StrictMode>
      <ConfigProvider locale={zhCN} theme={{ token: { colorPrimary: '#01c2c3' } }}>
        <App
          basename={qiankunWindow.__POWERED_BY_QIANKUN__ ? '/admin/trading' : '/'}
          globalState={props.globalState}
        />
      </ConfigProvider>
    </React.StrictMode>
  )
}

renderWithQiankun({
  bootstrap() {},
  mount(props) { render(props) },
  unmount() {
    root?.unmount()
    root = null
  },
  update() {},
})

// Standalone mode (dev without shell).
if (!qiankunWindow.__POWERED_BY_QIANKUN__) {
  render()
}
