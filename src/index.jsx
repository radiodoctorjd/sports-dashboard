import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);

// src/App.jsx
import React from 'react';
import SportsApp from './components/SportsApp';

function App() {
  return <SportsApp />;
}

export default App;

// src/components/SportsApp.jsx
/* Paste your current SportsApp code here */