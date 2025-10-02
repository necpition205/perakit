import React, { useEffect } from 'react';
import { ThemeProvider, Global, css } from '@emotion/react';
import Layout from './components/Layout';
import { useAppStore } from './store/app';
import AttachPage from './pages/attach';
import MemoryPage from './pages/memory';
import { theme } from './theme';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertsContainer } from './components/Alert';

export default function App() {
  const activeTab = useAppStore(s => s.activeTab);
  const refreshDevices = useAppStore(s => s.refreshDevices);

  useEffect(() => {
    refreshDevices().catch(() => void 0);
  }, [refreshDevices]);

  return (
    <ThemeProvider theme={theme}>
      <Global styles={css`
        html, body, #root { height: 100%; }
        body { margin: 0; font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Noto Sans, Ubuntu, Cantarell, Helvetica Neue, Arial, "Apple Color Emoji", "Segoe UI Emoji"; }
        * { box-sizing: border-box; }
      `}/>
      <Layout>
        <AnimatePresence mode="wait">
            <motion.div
              key={`tab-${activeTab}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
              style={{ height: '100%' }}
            >
              {activeTab === 'attach' ? (
                <AttachPage />
              ) : activeTab === 'memory' ? (
                <MemoryPage />
              ) : (<>
                <h3 style={{ marginTop: 0 }}>Coming soon</h3>
                <p>Tab: {activeTab}</p>
              </>)}
            </motion.div>
        </AnimatePresence>
      </Layout>
      <AlertsContainer />
    </ThemeProvider>
  );
}
