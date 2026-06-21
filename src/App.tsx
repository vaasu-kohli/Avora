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

function PrivateRoute({ children, requireProfile = true }: { children: React.ReactNode, requireProfile?: boolean }) {
  const { session, currentUser, isLoading } = useAppContext();
  
  if (isLoading) {
    return <div className="min-h-screen bg-[#0B1120] flex items-center justify-center text-white">Loading...</div>;
  }
  
  if (!session) {
    return <Navigate to="/auth" replace />;
  }
  
  if (requireProfile && !currentUser) {
    return <Navigate to="/onboarding" replace />;
  }

  if (!requireProfile && currentUser) {
    return <Navigate to="/discover" replace />;
  }
  
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { session, currentUser, isLoading } = useAppContext();
  
  if (isLoading) {
    return <div className="min-h-screen bg-[#0B1120] flex items-center justify-center text-white">Loading...</div>;
  }
  
  if (session) {
    if (currentUser) return <Navigate to="/discover" replace />;
    return <Navigate to="/onboarding" replace />;
  }
  
  return <>{children}</>;
}

export default function App() {
  return (
    <AppProvider>
      <Router>
        <Routes>
          <Route path="/" element={<PublicRoute><LandingPage /></PublicRoute>} />
          <Route path="/auth" element={<PublicRoute><AuthPage /></PublicRoute>} />
          
          <Route path="/onboarding" element={<PrivateRoute requireProfile={false}><Onboarding /></PrivateRoute>} />
          
          <Route element={<PrivateRoute requireProfile={true}><Layout /></PrivateRoute>}>
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
