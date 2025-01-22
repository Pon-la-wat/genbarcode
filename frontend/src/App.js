import React from 'react';
import ImportExcel from './components/ImportExcel';
import Dashboard from './components/Dashboard';

function App() {
  return (
    <div className="container py-4">
      <h1>Excel Import & Dashboard App</h1>
      <ImportExcel />
      <Dashboard />
    </div>
  );
}

export default App;