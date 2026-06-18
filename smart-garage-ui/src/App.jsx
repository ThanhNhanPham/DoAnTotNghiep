import { RouterProvider } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import viVN from 'antd/locale/vi_VN';
import router from './routes';
import './App.css';

function App() {
  return (
    <ConfigProvider 
      locale={viVN}
      theme={{
        token: {
          colorPrimary: '#2563eb',
          colorSuccess: '#16a34a',
          colorWarning: '#d97706',
          colorError: '#dc2626',
          colorText: '#111827',
          colorTextSecondary: '#6b7280',
          colorBorder: '#e5e7eb',
          colorBgLayout: '#f3f6fb',
          borderRadius: 8,
          fontSize: 14,
          fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          boxShadowSecondary: '0 12px 28px rgba(15, 23, 42, 0.08)',
        },
        components: {
          Card: {
            headerBg: '#ffffff',
            borderRadiusLG: 8,
          },
          Table: {
            headerBg: '#f8fafc',
            headerColor: '#334155',
            rowHoverBg: '#f8fbff',
          },
          Button: {
            controlHeight: 36,
          },
          Input: {
            controlHeight: 38,
          },
          Select: {
            controlHeight: 38,
          },
        },
      }}
    >
      <RouterProvider router={router} />
    </ConfigProvider>
  );
}

export default App
