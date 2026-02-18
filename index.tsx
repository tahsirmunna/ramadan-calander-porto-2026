import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

console.log("System: React Entry Point Initialized");

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error("System Error: Root element missing");
  throw new Error("Could not find root element to mount to");
}

try {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  console.log("System: React Mount Complete");
} catch (error) {
  console.error("System Error during mount:", error);
  rootElement.innerHTML = `<div style="color: white; padding: 20px;">Critical App Error: ${error}</div>`;
}