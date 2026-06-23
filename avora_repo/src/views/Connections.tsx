import { useAppContext } from '../context/AppContext';
import { UserProfile } from '../types';
import { MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Connections() {
  const { currentUser, profiles, connections } = useAppContext();
  const navigate = useNavigate();

  if (!currentUser) return null;

  const acceptedConnections = connections.filter(c => 
    c.status === 'accepted' && (c.fromUserId === currentUser.id || c.toUserId === currentUser.id)
  );

  const getProfile = (id: string) => profiles.find(p => p.id === id);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-8">Connections</h1>

      <section>
        <h2 className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-4">Your Network</h2>
        {acceptedConnections.length === 0 ? (
          <div className="text-center py-12 px-4 border border-white/5 bg-white/[0.02] rounded-3xl">
            <h3 className="text-white font-medium mb-2">No connections yet</h3>
            <p className="text-white/50 text-sm">Keep discovering to find your startup teammates.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {acceptedConnections.map(conn => {
              const otherId = conn.fromUserId === currentUser.id ? conn.toUserId : conn.fromUserId;
              const p = getProfile(otherId);
              if (!p) return null;
              
              return (
                <div key={conn.id} onClick={() => navigate('/messages')} className="bg-white/5 border border-white/10 p-4 rounded-2xl flex items-center gap-4 hover:bg-white/10 transition-colors cursor-pointer group">
                  <img src={p.photoUrl} alt={p.name} className="w-14 h-14 rounded-full object-cover border border-white/10" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-white truncate">{p.name}</h3>
                    <p className="text-xs text-white/50 capitalize truncate">{p.userType} • {p.city}</p>
                  </div>
                  <button className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-[#3B82F6] group-hover:bg-[#3B82F6] group-hover:text-white transition-colors">
                    <MessageCircle className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
