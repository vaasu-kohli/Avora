import { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import EditProfileModal from '../components/EditProfileModal';
import { Pencil } from 'lucide-react';
import { UserProfile } from '../types';

export default function ProfilePage() {
  const { currentUser, setCurrentUser, logout } = useAppContext();
  const [isEditing, setIsEditing] = useState(false);

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
      
      <div className="glass-panel p-6 flex flex-col md:flex-row gap-6 items-start mb-6">
        <img src={currentUser.photoUrl} alt={currentUser.name} className="w-32 h-32 rounded-2xl object-cover border border-white/10" />
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-white mb-1">{currentUser.name}</h2>
          <p className="text-white/60 mb-4 capitalize font-semibold tracking-wider text-[10px]">{currentUser.userType}</p>
          <p className="text-sm text-white/80 leading-relaxed mb-4">{currentUser.bio}</p>
          
          <div className="flex flex-wrap gap-2 mb-4">
            {currentUser.linkedin && (
              <a href={currentUser.linkedin} target="_blank" rel="noreferrer" className="text-xs text-[#3B82F6] hover:underline">LinkedIn</a>
            )}
            {currentUser.website && (
              <>
                <span className="text-white/20">•</span>
                <a href={currentUser.website} target="_blank" rel="noreferrer" className="text-xs text-[#3B82F6] hover:underline">Website</a>
              </>
            )}
            {currentUser.github && (
              <>
                <span className="text-white/20">•</span>
                <a href={currentUser.github} target="_blank" rel="noreferrer" className="text-xs text-[#3B82F6] hover:underline">GitHub</a>
              </>
            )}
          </div>
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
