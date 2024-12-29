import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Map from './components/Map';
import EventForm from './components/EventForm';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Map />} />
        <Route path="/submit" element={<EventForm />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
