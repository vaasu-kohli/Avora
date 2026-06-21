import { useAppContext } from '../context/AppContext';

export default function ProfilePage() {
  const { currentUser, logout } = useAppContext();

  if (!currentUser) return null;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-8">Your Profile</h1>
      
      <div className="glass-panel p-6 flex flex-col md:flex-row gap-6 items-start mb-6">
        <img src={currentUser.photoUrl} alt={currentUser.name} className="w-32 h-32 rounded-2xl object-cover border border-white/10" />
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-white mb-1">{currentUser.name}</h2>
          <p className="text-white/60 mb-4 capitalize">{currentUser.userType}</p>
          <p className="text-sm text-white/80 leading-relaxed mb-4">{currentUser.bio}</p>
        </div>
      </div>

      <div className="mt-8">
        <button 
          onClick={logout}
          className="px-6 py-3 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 text-sm font-medium transition-colors"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}
