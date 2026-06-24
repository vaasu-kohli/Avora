import { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { MessageCircle, Check, X } from 'lucide-react';
import ChatPage from '../components/Chat';
import { getMatchReasons } from '../lib/matching';

export default function Messages() {
  const { currentUser, profiles, connections, messages, updateConnectionStatus } = useAppContext();
  const [activeChatId, setActiveChatId] = useState<string | null>(null);

  if (!currentUser) return null;

  if (activeChatId) {
    return (
      <div className="h-screen md:p-6 md:max-w-4xl max-w-full w-full mx-auto pb-20 md:pb-6">
        <ChatPage partnerId={activeChatId} onClose={() => setActiveChatId(null)} />
      </div>
    );
  }

  const pendingRequests = connections.filter(c => c.toUserId === currentUser.id && c.status === 'pending');
  const sentRequests = connections.filter(c => c.fromUserId === currentUser.id && (c.status === 'pending' || c.status === 'rejected'));
  const acceptedConnections = connections.filter(c => 
    c.status === 'accepted' && (c.fromUserId === currentUser.id || c.toUserId === currentUser.id)
  );

  const getProfile = (id: string) => profiles.find(p => p.id === id);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-8">Messages</h1>

      {pendingRequests.length > 0 && (
        <section className="mb-12">
          <h2 className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-4 flex items-center gap-2">
            Message Requests <span className="bg-[#3B82F6] text-white text-[10px] px-2 py-0.5 rounded-full">{pendingRequests.length}</span>
          </h2>
          <div className="flex flex-col gap-3">
            {pendingRequests.map(req => {
              const p = getProfile(req.fromUserId);
              if (!p) return null;
              
              return (
                <div key={req.id} className="bg-white/5 border border-white/10 p-4 rounded-3xl flex flex-col md:flex-row md:items-center gap-4">
                  <div className="flex items-center gap-4 flex-1">
                     <img src={p.photoUrl} alt={p.name} className="w-16 h-16 rounded-full object-cover shrink-0 border border-white/10" />
                     <div className="flex-1 min-w-0">
                       <h3 className="font-semibold text-white truncate text-lg">{p.name}</h3>
                       <p className="text-[10px] font-medium text-white/40 uppercase tracking-widest mb-2">{p.userType}</p>
                       <div className="bg-[#3B82F6]/10 border border-[#3B82F6]/20 rounded-xl p-3">
                         <p className="text-sm text-white/90 whitespace-pre-line">"{req.introMessage}"</p>
                       </div>
                     </div>
                  </div>
                  
                  <div className="flex items-center gap-2 md:w-48 shrink-0 mt-4 md:mt-0">
                    <button 
                      onClick={() => updateConnectionStatus(req.id, 'accepted')}
                      className="flex-1 bg-[#3B82F6] text-white text-sm font-medium py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-blue-600 transition-colors"
                    >
                      <Check className="w-4 h-4" /> Accept
                    </button>
                    <button 
                      onClick={() => updateConnectionStatus(req.id, 'rejected')}
                      className="w-12 h-12 bg-white/5 text-white/70 font-medium rounded-xl flex items-center justify-center hover:bg-red-500/20 hover:text-red-400 transition-colors shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {sentRequests.length > 0 && (
        <section className="mb-12">
          <h2 className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-4 flex items-center gap-2">
            Pending Requests Sent <span className="bg-white/10 text-white/70 text-[10px] px-2 py-0.5 rounded-full">{sentRequests.length}</span>
          </h2>
          <div className="flex flex-col gap-3">
            {sentRequests.map(req => {
              const p = getProfile(req.toUserId);
              if (!p) return null;
              
              return (
                <div key={req.id} className="bg-white/5 border border-white/10 p-4 rounded-3xl flex flex-col md:flex-row md:items-center gap-4">
                  <div className="flex items-center gap-4 flex-1">
                     <img src={p.photoUrl} alt={p.name} className="w-16 h-16 rounded-full object-cover shrink-0 border border-white/10 opacity-70" />
                     <div className="flex-1 min-w-0">
                       <h3 className="font-semibold text-white/80 truncate text-lg">{p.name}</h3>
                       <p className="text-[10px] font-medium text-white/40 uppercase tracking-widest mb-2">{p.userType}</p>
                     </div>
                  </div>
                  
                  <div className="flex items-center gap-2 shrink-0 mt-4 md:mt-0">
                    <span className={`text-xs px-3 py-1 rounded-full border ${
                      req.status === 'rejected' 
                        ? 'border-red-500/30 text-red-400 bg-red-500/10' 
                        : 'border-yellow-500/30 text-yellow-400 bg-yellow-500/10'
                    }`}>
                      {req.status === 'rejected' ? 'Declined' : 'Pending Approval'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-4">Active Chats</h2>
        {acceptedConnections.length === 0 ? (
          <div className="text-center py-12 px-4 border border-white/5 bg-white/[0.02] rounded-3xl">
            <h3 className="text-white font-medium mb-2">No conversations yet</h3>
            <p className="text-white/50 text-sm">Accept a connection request to start chatting.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {acceptedConnections.map(conn => {
              const otherId = conn.fromUserId === currentUser.id ? conn.toUserId : conn.fromUserId;
              const p = getProfile(otherId);
              if (!p) return null;

              const connMsgs = messages.filter(m => 
                (m.senderId === currentUser.id && m.receiverId === otherId) || 
                (m.senderId === otherId && m.receiverId === currentUser.id)
              ).sort((a,b) => b.timestamp - a.timestamp);
              const lastMsg = connMsgs[0];
              const unreadCount = connMsgs.filter(m => m.receiverId === currentUser.id && !m.read).length;
              
              return (
                <div key={conn.id} onClick={() => setActiveChatId(otherId)} className="bg-white/5 border border-white/10 p-4 rounded-2xl flex items-center gap-4 hover:bg-white/10 transition-colors cursor-pointer group">
                  <div className="relative">
                    <img src={p.photoUrl} alt={p.name} className="w-14 h-14 rounded-full object-cover border border-white/10" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-[#3B82F6] text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-[#0B1120]">
                        {unreadCount}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                     <div className="flex justify-between items-baseline mb-1">
                       <h3 className="font-medium text-white truncate">{p.name}</h3>
                       {lastMsg && <span className="text-[10px] text-white/40">{new Date(lastMsg.timestamp).toLocaleDateString()}</span>}
                     </div>
                     {lastMsg ? (
                       <p className="text-xs text-white/70 truncate leading-relaxed">
                          {lastMsg.senderId === currentUser.id ? 'You: ' : ''}
                          {lastMsg.content.startsWith('[MEETING_INVITE]:') ? '📅 Meeting Invitation' : lastMsg.content}
                       </p>
                     ) : (
                       <p className="text-xs text-[#3B82F6] italic">Say hi to start the conversation!</p>
                     )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
