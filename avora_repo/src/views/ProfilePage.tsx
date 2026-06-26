import { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import EditProfileModal from '../components/EditProfileModal';
import { Pencil, Bell } from 'lucide-react';
import { UserProfile } from '../types';
import { api } from '../lib/api';

export default function ProfilePage() {
  const { currentUser, setCurrentUser, logout } = useAppContext();
  const [isEditing, setIsEditing] = useState(false);
  const [settings, setSettings] = useState({
    connection_requests: true,
    messages: true,
    meetings: true,
    product_updates: true
  });
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    if (currentUser) {
      api.getNotificationSettings().then(data => {
        if (data) setSettings(data);
      });
    }
  }, [currentUser]);

  const handleToggle = async (key: keyof typeof settings) => {
    const newSettings = { ...settings, [key]: !settings[key] };
    setSettings(newSettings);
    setSavingSettings(true);
    await api.updateNotificationSettings(newSettings);
    setSavingSettings(false);
  };

  if (!currentUser) return null;

  const handleSave = (updatedProfile: UserProfile) => {
    setCurrentUser(updatedProfile);
    setIsEditing(false);
  };

  return (
    <div className="p-6 max-w-2xl mx-auto pb-24">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-white">Your Profile</h1>
        <button 
          onClick={() => setIsEditing(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/80 hover:text-white hover:bg-white/10 transition-colors text-sm font-medium"
        >
          <Pencil className="w-4 h-4" /> Edit Profile
        </button>
      </div>
      
      <div className="glass-panel p-6 flex flex-col md:flex-row gap-6 items-start mb-8">
        <img src={currentUser.photoUrl} alt={currentUser.name} className="w-32 h-32 rounded-2xl object-cover border border-white/10" />
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-white mb-1">{currentUser.name}</h2>
          <p className="text-white/60 mb-4 capitalize font-semibold tracking-wider text-[10px]">{currentUser.userType}</p>
          <p className="text-sm text-white/80 leading-relaxed mb-4">{currentUser.bio}</p>
          
          <div className="flex flex-wrap gap-2 mb-4">
            {currentUser.github && (
              <a href={currentUser.github} target="_blank" rel="noreferrer" className="text-xs text-[#3B82F6] hover:underline">GitHub</a>
            )}
          </div>
        </div>
      </div>

      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="w-5 h-5 text-white/70" />
          <h2 className="text-xl font-bold text-white">Notification Settings</h2>
          {savingSettings && <span className="text-xs text-white/30 ml-2">Saving...</span>}
        </div>
        <div className="glass-panel p-2">
          {[
            { id: 'connection_requests', label: 'Connection Requests', desc: 'Email when someone wants to connect' },
            { id: 'messages', label: 'Messages', desc: 'Batched emails for unread messages' },
            { id: 'meetings', label: 'Meetings', desc: 'Email for meeting updates' },
            { id: 'product_updates', label: 'Product Updates', desc: 'News and feature updates' }
          ].map(item => (
            <div key={item.id} className="flex items-center justify-between p-4 border-b border-white/5 last:border-0">
              <div>
                <p className="text-sm font-medium text-white">{item.label}</p>
                <p className="text-xs text-white/50 mt-1">{item.desc}</p>
              </div>
              <button 
                onClick={() => handleToggle(item.id as keyof typeof settings)}
                className={`w-11 h-6 rounded-full relative transition-colors ${settings[item.id as keyof typeof settings] ? 'bg-blue-500' : 'bg-white/10'}`}
              >
                <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${settings[item.id as keyof typeof settings] ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 pt-8 border-t border-white/5">
        <button 
          onClick={logout}
          className="px-6 py-3 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 text-sm font-medium transition-colors"
        >
          Sign Out
        </button>
      </div>

      {isEditing && (
        <EditProfileModal 
          currentUser={currentUser} 
          onClose={() => setIsEditing(false)} 
          onSave={handleSave} 
        />
      )}
    </div>
  );
}
