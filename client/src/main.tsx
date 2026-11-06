import { createRoot } from 'react-dom/client';
import '@google/model-viewer';
import './styles.css';
import { App } from './App.tsx';

createRoot(document.getElementById('root')!).render(<App />);
