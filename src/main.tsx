import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import { QueryProvider } from './QueryProvider.tsx';
import { GeminiModelProvider } from './context/GeminiModelContext.tsx';
import 'katex/dist/katex.min.css';
import './index.css';

// El motor de ingesta y asimilación continua se coordina de forma atómica en App.tsx al montar el Gemelo Digital.

// Suppress benign ResizeObserver loop limit errors and WebSocket HMR errors (Environment constraint: HMR disabled)
if (typeof window !== 'undefined') {
  const resizeObserverErrRegex = /ResizeObserver loop (limit exceeded|completed with undelivered notifications)/i;
  
  const isIgnoredError = (msg: unknown) => {
    if (!msg) return false;
    const str = typeof msg === 'string' ? msg : (msg instanceof Error ? msg.message : String(msg));
    return resizeObserverErrRegex.test(str)
      || /WebSocket/i.test(str)
      || /vite:ws/i.test(str)
      || /WebSocket closed without opened/i.test(str)
      || /failed to connect to websocket/i.test(str);
  };

  window.addEventListener('error', (event) => {
    if (isIgnoredError(event.message) || isIgnoredError(event.error)) {
      event.stopImmediatePropagation();
      event.preventDefault();
    }
  }, true);

  window.addEventListener('unhandledrejection', (event) => {
    if (event.reason && isIgnoredError(event.reason)) {
      event.stopImmediatePropagation();
      event.preventDefault();
    }
  });

  const prevOnError = window.onerror;
  window.onerror = function (message, source, lineno, colno, error) {
    if (isIgnoredError(message) || isIgnoredError(error)) {
      return true;
    }
    if (typeof prevOnError === 'function') {
      return prevOnError.apply(this, [message, source, lineno, colno, error]);
    }
  };

  window.addEventListener('vite:preloadError', (event) => {
    event.preventDefault();
    window.location.reload();
  });
}

// Arranque resiliente y protegido contra pantallas en blanco
try {
  const rootElement = document.getElementById('root');
  if (rootElement) {
    const root = createRoot(rootElement);
    root.render(
      <StrictMode>
        <ErrorBoundary>
          <QueryProvider>
            <GeminiModelProvider>
              <App />
            </GeminiModelProvider>
          </QueryProvider>
        </ErrorBoundary>
      </StrictMode>
    );

    // Pre-carga silenciosa en memoria RAM (a los 800 ms del arranque, con el mapa ya en pantalla):
    // garantiza apertura en 0 ms de cualquier ventana doctoral incluso si cae el Wi-Fi en el tribunal
    window.setTimeout(() => {
      import('./components/ScientificModalRegistry').catch(() => {
        // Pre-carga oportunista silenciosa
      });
    }, 800);
  }
} catch (startupError) {
  console.error('[Startup Fatal Error] Ocurrió una incidencia durante la inicialización:', startupError);
  const container = document.getElementById('root');
  if (container) {
    container.innerHTML = `
      <div style="min-height: 100vh; background: #030712; color: #f8fafc; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 24px; font-family: ui-monospace, monospace; text-align: center;">
        <div style="padding: 20px; background: #0f172a; border: 1px solid #dc2626; border-radius: 12px; max-width: 480px; width: 100%; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);">
          <div style="color: #f87171; font-weight: bold; font-size: 14px; margin-bottom: 8px;">⚠️ Incidencia en el Arranque del Gemelo Digital</div>
          <div style="color: #94a3b8; font-size: 11px; margin-bottom: 16px; line-height: 1.5; word-break: break-word;">${String(startupError)}</div>
          <button onClick="sessionStorage.clear();window.location.reload();" style="background: #10b981; color: #030712; border: none; padding: 10px 18px; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 12px;">Recargar Aplicativo (Conservando Datos)</button>
        </div>
      </div>
    `;
  }
}

