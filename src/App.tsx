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

const DiscoverSkeleton = () => (
  <div className="w-full max-w-md aspect-[3/4] rounded-[40px] bg-white/5 border border-white/10 overflow-hidden animate-pulse relative">
    <div className="absolute inset-0 bg-gradient-to-t from-[#0B1120] via-transparent to-transparent" />
    <div className="absolute bottom-0 left-0 right-0 p-6 flex flex-col justify-end">
      <div className="h-8 w-3/4 bg-white/20 rounded mb-2"></div>
      <div className="h-5 w-1/2 bg-white/20 rounded mb-4"></div>
      <div className="h-4 w-full bg-white/10 rounded mb-2"></div>
      <div className="h-4 w-5/6 bg-white/10 rounded mb-4"></div>
      <div className="flex gap-2">
         <div className="h-6 w-16 bg-white/10 rounded-md"></div>
         <div className="h-6 w-16 bg-white/10 rounded-md"></div>
         <div className="h-6 w-16 bg-white/10 rounded-md"></div>
      </div>
    </div>
  </div>
);

const ProfileSkeleton = () => (
  <div className="w-full max-w-2xl mx-auto space-y-6 animate-pulse">
    <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
      <div className="flex flex-col md:flex-row items-center gap-6">
        <div className="w-24 h-24 rounded-full bg-white/10"></div>
        <div className="space-y-4 w-full">
          <div className="h-8 w-1/2 bg-white/20 rounded"></div>
          <div className="h-4 w-1/3 bg-white/10 rounded"></div>
          <div className="flex gap-2">
            <div className="h-8 w-8 rounded-full bg-white/10"></div>
            <div className="h-8 w-8 rounded-full bg-white/10"></div>
          </div>
        </div>
      </div>
    </div>
    <div className="space-y-4">
      <div className="h-32 w-full bg-white/5 rounded-2xl"></div>
      <div className="h-32 w-full bg-white/5 rounded-2xl"></div>
    </div>
  </div>
);

const MessagesSkeleton = () => (
  <div className="w-full h-full flex flex-col md:flex-row bg-[#0B1120] animate-pulse">
    <div className="w-full md:w-80 border-r border-white/5 p-4 space-y-4">
      <div className="h-8 w-1/2 bg-white/10 rounded mb-6"></div>
      {[1,2,3,4].map(i => (
        <div key={i} className="flex gap-3 items-center">
          <div className="w-12 h-12 rounded-full bg-white/10"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 w-3/4 bg-white/10 rounded"></div>
            <div className="h-3 w-1/2 bg-white/5 rounded"></div>
          </div>
        </div>
      ))}
    </div>
    <div className="hidden md:flex flex-1 items-center justify-center">
      <div className="h-10 w-10 border-4 border-[#3B82F6] border-t-transparent rounded-full animate-spin opacity-50"></div>
    </div>
  </div>
);

function FullScreenSkeleton() {
  const path = window.location.pathname;
  
  // Public routes don't usually show the sidebar layout skeleton
  if (path === '/' || path.startsWith('/auth') || path.startsWith('/onboarding')) {
    return <div className="min-h-screen bg-[#0B1120] flex items-center justify-center text-white">
      <div className="w-10 h-10 border-4 border-[#3B82F6] border-t-transparent rounded-full animate-spin"></div>
    </div>;
  }

  return (
    <div className="min-h-screen bg-[#0B1120] text-white flex flex-col md:flex-row">
      <aside className="hidden md:flex w-64 flex-col border-r border-white/5 bg-white/5 fixed h-full z-10 p-6 animate-pulse">
        <div className="h-8 w-24 bg-white/10 rounded mb-8"></div>
        <div className="space-y-4">
          <div className="h-10 w-full bg-white/10 rounded-xl"></div>
          <div className="h-10 w-full bg-white/10 rounded-xl"></div>
          <div className="h-10 w-full bg-white/10 rounded-xl"></div>
          <div className="h-10 w-full bg-white/10 rounded-xl"></div>
        </div>
      </aside>
      <main className="flex-1 md:ml-64 w-full h-screen p-6 relative flex items-center justify-center overflow-hidden">
         { path.includes('/discover') ? <DiscoverSkeleton /> : 
           path.includes('/profile') ? <ProfileSkeleton /> :
           path.includes('/messages') ? <MessagesSkeleton /> : 
           <div className="w-10 h-10 border-4 border-[#3B82F6] border-t-transparent rounded-full animate-spin"></div>
         }
      </main>
    </div>
  );
}

function PrivateRoute({ children, requireProfile = true }: { children: React.ReactNode, requireProfile?: boolean }) {
  const { session, currentUser, isLoading } = useAppContext();
  
  if (isLoading) {
    return <FullScreenSkeleton />;
  }
  
  console.log(`[PrivateRoute] path=${window.location.pathname} session=${!!session} hasProfile=${!!currentUser} requireProfile=${requireProfile}`);

  if (!session) {
    console.log('[PrivateRoute] No session, redirecting to /auth');
    return <Navigate to="/auth" replace />;
  }
  
  if (requireProfile && !currentUser) {
    console.log('[PrivateRoute] Profile required but missing, redirecting to /onboarding');
    return <Navigate to="/onboarding" replace />;
  }

  if (!requireProfile && currentUser) {
    console.log('[PrivateRoute] Profile not required but present, redirecting to /discover');
    return <Navigate to="/discover" replace />;
  }
  
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { session, currentUser, isLoading } = useAppContext();
  
  if (isLoading) {
    return <FullScreenSkeleton />;
  }
  
  console.log(`[PublicRoute] path=${window.location.pathname} session=${!!session} hasProfile=${!!currentUser}`);

  if (session) {
    if (currentUser) {
      console.log('[PublicRoute] Has session+profile, redirecting to /discover');
      return <Navigate to="/discover" replace />;
    }
    console.log('[PublicRoute] Has session no profile, redirecting to /onboarding');
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
