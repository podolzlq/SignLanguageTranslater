import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Splash from './pages/Splash';
import Home from './pages/Home';
import Translator from './pages/Translator/Translator';
import './App.css';
import Education from './pages/Education/Education';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Splash />} />
        <Route path="/home" element={<Home />} />
        <Route path="/translator" element={<Translator />} />
        <Route path="/education" element={<Education />} />
      </Routes>
    </Router>
  );
}

export default App;