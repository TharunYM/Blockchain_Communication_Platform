import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App'; // Assumes your App.js is in the src folder

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);