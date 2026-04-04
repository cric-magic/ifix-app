import { ConfigProvider } from 'antd'
import { RouterProvider } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { DevToolsProvider, useDevTools, DEVICE_CONFIG } from './contexts/DevToolsContext'
import { DevToolsPanel } from './components/DevToolsPanel'
import { router } from './router'

function AppViewport({ children }: { children: React.ReactNode }) {
  const { device } = useDevTools()
  const width = DEVICE_CONFIG[device].width
  const isConstrained = device !== 'desktop'

  return (
    <div style={{
      background: isConstrained ? '#999' : undefined,
      minHeight: '100vh',
      paddingBottom: isConstrained ? 80 : 0,
    }}>
      <div style={{
        width,
        margin: '0 auto',
        overflow: 'hidden',
        transition: 'width 0.25s ease',
        boxShadow: isConstrained ? '0 0 0 1px #bbb' : 'none',
        minHeight: '100vh',
      }}>
        {children}
      </div>
    </div>
  )
}

function App() {
  return (
    <ConfigProvider theme={{
      token: {
        colorPrimary: '#000000',
        colorLink: '#000000',
        colorInfo: '#000000',
      },
      components: {
        Menu: {
          itemSelectedBg: '#f0f0f0',
          itemSelectedColor: '#000000',
          itemActiveBg: '#f5f5f5',
        },
      },
    }}>
      <AuthProvider>
        <DevToolsProvider>
          <AppViewport>
            <RouterProvider router={router} />
          </AppViewport>
          <DevToolsPanel />
        </DevToolsProvider>
      </AuthProvider>
    </ConfigProvider>
  )
}

export default App
