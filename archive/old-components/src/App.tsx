import React from 'react';
import { Routes, Route } from 'react-router-dom';

// Import page components
import HomePage from './app/page';
import UploadsPage from './app/uploads/page';
import SlatesPage from './app/slates/page';
import OptimizerPage from './app/optimizer/page';
import SimsPage from './app/sims/page';
import SettingsPage from './app/settings/page';
import LiveDashboardPage from './app/dashboard/live/page';
import ContentPage from './app/content/page';
import SuperiorDashboardPage from './app/superior/page';

function App() {
  return (
    <div className='min-h-screen'>
      <Routes>
        <Route path='/' element={<HomePage />} />
        <Route path='/uploads' element={<UploadsPage />} />
        <Route path='/slates' element={<SlatesPage />} />
        <Route path='/optimizer' element={<OptimizerPage />} />
        <Route path='/sims' element={<SimsPage />} />
        <Route path='/content' element={<ContentPage />} />
        <Route path='/settings' element={<SettingsPage />} />
        <Route path='/dashboard/live' element={<LiveDashboardPage />} />
        <Route path='/superior' element={<SuperiorDashboardPage />} />
      </Routes>
    </div>
  );
}

export default App;
