import React from 'react';

export default function App() {
  const info = {
    platform: window.api?.platform,
    node: window.api?.versions?.node,
    chrome: window.api?.versions?.chrome,
    electron: window.api?.versions?.electron,
    frida: window.api?.fridaVersion || 'not loaded'
  };

  return (
    <div style={{ fontFamily: 'sans-serif', padding: 24 }}>
      <h1>PeraKit</h1>
      <p>Electron + React + Frida + Bun</p>
      <ul>
        <li>Platform: {info.platform}</li>
        <li>Node: {info.node}</li>
        <li>Chrome: {info.chrome}</li>
        <li>Electron: {info.electron}</li>
        <li>Frida: {info.frida}</li>
      </ul>
      <p>HMR is enabled. Edit this file to test.</p>
    </div>
  );
}

