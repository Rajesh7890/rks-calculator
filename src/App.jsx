import React from 'react';

import './App.css';
import Expression from './components/Expression';

function App(){
  return (
    <div className="App">
      <header className="App-header">
        RKS Expression Calculator
      </header>

      <main>
        <Expression />
      </main>
    </div>
  );
}

export default App;
