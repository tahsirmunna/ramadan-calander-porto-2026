import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

console.log("App Loader: Starting initialization...");

const rootElement = document.getElementById('root');

if (!rootElement) {
  console.error("App Loader: Root element #root not found.");
} else {
  try {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    console.log("App Loader: React mount successful.");
  } catch (err) {
    console.error("App Loader: Critical failure during React mount.", err);
    rootElement.innerHTML = `
      <div style="color: #f59e0b; text-align: center; padding: 40px; font-family: sans-serif; background: #020617; height: 100vh; display: flex; flex-direction: column; justify-content: center;">
        <h1 style="font-size: 24px;">Application Error</h1>
        <p>Something went wrong during startup.</p>
        <div style="background: #1e293b; padding: 20px; border-radius: 12px; font-size: 13px; color: #f87171; overflow: auto; max-width: 90%; margin: 20px auto; text-align: left; border: 1px solid #ef4444;">
          <code>${err instanceof Error ? err.stack || err.message : String(err)}</code>
        </div>
        <button onclick="window.location.reload()" style="background: #f59e0b; color: #000; padding: 10px 20px; border-radius: 8px; border: none; font-weight: bold; cursor: pointer; margin-top: 20px;">Retry Load</button>
      </div>
    `;
  }
}