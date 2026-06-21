/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useAppContext } from './context/AppContext';
import Layout from './components/Layout';
import LandingPage from './views/LandingPage';
import Onboarding from './views/Onboarding';
import Discovery from './views/Discovery';
import Connections from './views/Connections';
import Messages from './views/Messages';
import ProfilePage from './views/ProfilePage';
import AuthPage from './views/AuthPage';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { currentUser, isLoading } = useAppContext();
  
  if (isLoading) {
    return <div className="min-h-screen bg-[#0B1120] flex items-center justify-center text-white">Loading...</div>;
  }
  
  if (!currentUser) {
    return <Navigate to="/auth" replace />;
  }
  
  return <>{children}</>;
}

export default function App() {
  return (
    <AppProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth" element={<AuthPage />} />
          
          <Route path="/onboarding" element={<Onboarding />} />
          
          <Route element={<PrivateRoute><Layout /></PrivateRoute>}>
            <Route path="/discover" element={<Discovery />} />
            <Route path="/connections" element={<Connections />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>
        </Routes>
      </Router>
    </AppProvider>
  );
}
