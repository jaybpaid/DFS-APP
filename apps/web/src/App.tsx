import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import LiveIntelligence from './pages/LiveIntelligence';
import NotFound from './pages/not-found';

function App() {
  return (
    <div className='min-h-screen bg-background'>
      <Routes>
        {/* Main Dashboard Route */}
        <Route path='/' element={<Dashboard />} />

        {/* Dashboard Aliases for backwards compatibility */}
        <Route path='/dashboard' element={<Dashboard />} />
        <Route path='/optimizer' element={<Dashboard />} />

        {/* Live Intelligence & Market Data */}
        <Route path='/live' element={<LiveIntelligence />} />
        <Route path='/intelligence' element={<LiveIntelligence />} />
        <Route path='/market' element={<LiveIntelligence />} />

        {/* Catch-all 404 route */}
        <Route path='*' element={<NotFound />} />
      </Routes>
    </div>
  );
}

export default App;
