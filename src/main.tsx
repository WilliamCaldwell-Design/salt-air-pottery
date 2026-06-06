import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Hidden Easter Egg for tech-savvy explorers 🍯
console.log(
  `%c✨ Happy Birthday, Eleftheria! ✨%c\n\n"Good luck with all of the clay!" 🍶🌊\n`,
  "color: #8E8070; font-size: 16px; font-weight: bold; font-family: serif; text-shadow: 1px 1px 2px rgba(0,0,0,0.1);",
  "color: #5C5346; font-size: 11px; font-family: monospace; line-height: 1.5;"
);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
