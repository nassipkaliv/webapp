import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/global.css';

// Block all touch scroll globally on iOS Safari.
// Only allow scroll inside elements marked with data-scroll-allow.
document.addEventListener('touchmove', (e) => {
  const target = e.target as HTMLElement;
  if (target.closest('[data-scroll-allow]')) return;
  e.preventDefault();
}, { passive: false });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
