import { useEffect, useMemo, useState } from 'react';
import { RouterProvider } from 'react-router-dom';
import { ConfigProvider, theme as antdTheme } from 'antd';
import viVN from 'antd/locale/vi_VN';
import router from './routes';
import './App.css';

const DEFAULT_APP_THEME = {
  themeColor: '#2563eb',
  darkMode: false,
  fontSize: 14,
};

const readStoredTheme = () => {
  try {
    const storedTheme = JSON.parse(localStorage.getItem('adminThemeSettings') || '{}');
    return {
      ...DEFAULT_APP_THEME,
      ...storedTheme,
      darkMode: Boolean(storedTheme.darkMode),
      fontSize: Number(storedTheme.fontSize) || DEFAULT_APP_THEME.fontSize,
    };
  } catch {
    return DEFAULT_APP_THEME;
  }
};

function App() {
  const [appTheme, setAppTheme] = useState(readStoredTheme);

  useEffect(() => {
    const syncTheme = () => setAppTheme(readStoredTheme());

    window.addEventListener('admin-theme-change', syncTheme);
    window.addEventListener('storage', syncTheme);

    return () => {
      window.removeEventListener('admin-theme-change', syncTheme);
      window.removeEventListener('storage', syncTheme);
    };
  }, []);

  useEffect(() => {
    document.documentElement.style.setProperty('--primary-color', appTheme.themeColor);
    document.documentElement.style.setProperty('--app-font-size', `${appTheme.fontSize}px`);
    document.documentElement.style.setProperty('--app-font-scale', String(appTheme.fontSize / DEFAULT_APP_THEME.fontSize));
    document.body.classList.toggle('dark-mode', appTheme.darkMode);
  }, [appTheme]);

  const themeConfig = useMemo(
    () => ({
      algorithm: appTheme.darkMode ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
      token: {
        colorPrimary: appTheme.themeColor,
        colorSuccess: '#16a34a',
        colorWarning: '#d97706',
        colorError: '#dc2626',
        colorText: appTheme.darkMode ? '#e5e7eb' : '#111827',
        colorTextSecondary: appTheme.darkMode ? '#94a3b8' : '#6b7280',
        colorBorder: appTheme.darkMode ? '#334155' : '#e5e7eb',
        colorBgLayout: appTheme.darkMode ? '#0f172a' : '#f3f6fb',
        colorBgContainer: appTheme.darkMode ? '#111827' : '#ffffff',
        colorBgElevated: appTheme.darkMode ? '#1e293b' : '#ffffff',
        borderRadius: 8,
        fontSize: appTheme.fontSize,
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        boxShadowSecondary: appTheme.darkMode
          ? '0 12px 28px rgba(0, 0, 0, 0.32)'
          : '0 12px 28px rgba(15, 23, 42, 0.08)',
      },
      components: {
        Card: {
          headerBg: appTheme.darkMode ? '#111827' : '#ffffff',
          borderRadiusLG: 8,
        },
        Table: {
          headerBg: appTheme.darkMode ? '#1e293b' : '#f8fafc',
          headerColor: appTheme.darkMode ? '#cbd5e1' : '#334155',
          rowHoverBg: appTheme.darkMode ? '#1e293b' : '#f8fbff',
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
    }),
    [appTheme]
  );

  return (
    <ConfigProvider 
      locale={viVN}
      theme={themeConfig}
    >
      <RouterProvider router={router} />
    </ConfigProvider>
  );
}

export default App
