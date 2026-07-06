import React from 'react';
import { createRoot } from 'react-dom/client';
import DrivingSimulator from './DrivingSimulator';

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<DrivingSimulator />);
} else {
  console.error("Root element not found to mount DrivingSimulator");
}
