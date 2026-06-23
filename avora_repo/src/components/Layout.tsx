import { Outlet, Navigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { Compass, MessageSquare, UserCircle, Bell, Users } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export default function Layout() {
  const { currentUser } = useAppContext();
  const location = useLocation();

  if (!currentUser) {
    return <Navigate to="/" replace />;
  }

  const navItems = [
    { name: 'Discover', path: '/discover', icon: Compass },
    { name: 'Connections', path: '/connections', icon: Users },
    { name: 'Messages', path: '/messages', icon: MessageSquare },
    { name: 'Profile', path: '/profile', icon: UserCircle },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex w-64 flex-col border-r border-white/5 bg-white/5 backdrop-blur-sm fixed h-full z-10">
        <div className="p-6">
          <h1 className="text-2xl font-bold tracking-tight text-white mb-1"><span className="text-primary">AVO</span>RA</h1>
          <p className="text-xs text-muted-foreground">Find your teammates</p>
        </div>
        
        <nav className="flex-1 px-4 space-y-2 mt-4">
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive 
                    ? 'bg-primary/10 text-primary font-medium' 
                    : 'text-muted-foreground hover:bg-white/5 hover:text-white'
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>
        
        <div className="p-4 border-t border-white/5">
          <div className="flex items-center gap-3 px-4 py-2">
            <img 
              src={currentUser.photoUrl || `https://ui-avatars.com/api/?name=${currentUser.name}&background=0D8ABC&color=fff`} 
              alt={currentUser.name} 
              className="w-8 h-8 rounded-full border border-border" 
            />
            <div className="truncate">
              <p className="text-sm font-medium text-white truncate">{currentUser.name}</p>
              <p className="text-xs text-muted-foreground capitalize">{currentUser.userType}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 md:ml-64 w-full h-screen overflow-y-auto pb-20 md:pb-0 relative">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between p-4 border-b border-white/5 bg-background/80 backdrop-blur-md sticky top-0 z-20">
          <h1 className="text-xl font-bold tracking-tight text-white"><span className="text-primary">AVO</span>RA</h1>
          <button className="text-muted-foreground hover:text-white">
            <Bell className="w-5 h-5" />
          </button>
        </header>

        <Outlet />
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t border-white/5 bg-[#0B1120]/90 backdrop-blur-xl z-50 px-4 py-3 pb-8">
        <ul className="flex items-center justify-between">
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <li key={item.name} className="flex-1">
                <Link
                  to={item.path}
                  className={`flex flex-col items-center gap-1 transition-colors ${
                    isActive ? 'text-primary' : 'text-muted-foreground'
                  }`}
                >
                  <item.icon className={`w-6 h-6 ${isActive ? 'fill-primary/20' : ''}`} />
                  <span className="text-[10px] font-medium">{item.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
