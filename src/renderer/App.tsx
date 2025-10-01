import React, { useEffect } from 'react';
import { ThemeProvider, Global, css } from '@emotion/react';
import Layout from './components/Layout';
import { useAppStore } from './store/app';
import AttachPage from './pages/attach';
import { theme } from './theme';
import { ToastContainer } from './components/Toast';
import { AlertsContainer } from './components/Alerts';
import { AnimatePresence, motion } from 'framer-motion';

export default function App() {
  const activeTab = useAppStore(s => s.activeTab);
  const refreshDevices = useAppStore(s => s.refreshDevices);

  useEffect(() => {
    refreshDevices().catch(() => void 0);
  }, [refreshDevices]);

  return (
    <ThemeProvider theme={theme}>
      <Global styles={css`
        :root {
          --border: ${theme.colors.border};
          --accent-50: #eef2ff;
          --accent-900: #1e293b;
          --hover: #f3f4f6;
        }
        html, body, #root { height: 100%; }
        body { margin: 0; font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Noto Sans, Ubuntu, Cantarell, Helvetica Neue, Arial, "Apple Color Emoji", "Segoe UI Emoji"; color: ${theme.colors.text}; background: ${theme.colors.bg}; }
        * { box-sizing: border-box; }
      `}/>
      <Layout>
        <AnimatePresence mode="wait">
          {activeTab === 'attach' ? (
            <motion.div
              key="tab-attach"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
              style={{ height: '100%' }}
            >
              <AttachPage />
            </motion.div>
          ) : (
            <motion.div
              key={`tab-${activeTab}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
              style={{ padding: 16 }}
            >
              <h3 style={{ marginTop: 0 }}>Coming soon</h3>
              <p>Tab: {activeTab}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </Layout>
      <ToastContainer />
      <AlertsContainer />
    </ThemeProvider>
  );
}
