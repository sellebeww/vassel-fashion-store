import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { MotionConfig } from 'motion/react';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import './index.css';

createRoot(document.getElementById('root')!).render(<ErrorBoundary><MotionConfig reducedMotion="user"><App /></MotionConfig></ErrorBoundary>);
