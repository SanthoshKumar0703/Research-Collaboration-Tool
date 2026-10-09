import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { ThemeProvider } from './lib/theme';
import { SessionProvider } from './lib/session';
import { ToastProvider } from './lib/toast';
import { WorkProvider } from './lib/work';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <SessionProvider>
          <ToastProvider>
            <WorkProvider>
              <App />
            </WorkProvider>
          </ToastProvider>
        </SessionProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}
