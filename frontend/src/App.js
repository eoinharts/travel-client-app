// src/App.js
import React from 'react';
import { Routes, Route, Link, Navigate } from 'react-router-dom';

import Login        from './Pages/Login/Login';
import TravelLogs   from './Pages/TravelLogs/TravelLogs';
import JourneyPlans from './Pages/JourneyPlans/JourneyPlans';
import ProtectedRoute from './utils/ProtectedRoutes';

export default function App() {
  return (
    <div>
      <nav style={{ marginBottom: '1rem' }}>
        <Link to="/login"      style={{ marginRight: '1rem' }}>Login</Link>
        <Link to="/travellogs" style={{ marginRight: '1rem' }}>Travel Logs</Link>
        <Link to="/journeyplans">Journey Plans</Link>
      </nav>

      <Routes>
        <Route path="/login"      element={<Login />} />
        <Route 
          path="/travellogs" 
          element={
            <ProtectedRoute>
              <TravelLogs />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/journeyplans" 
          element={
            <ProtectedRoute>
              <JourneyPlans />
            </ProtectedRoute>
          } 
        />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </div>
  );
}
