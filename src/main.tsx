import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ExamProvider } from './context/ExamContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ExamProvider>
      <App />
    </ExamProvider>
  </StrictMode>,
);
