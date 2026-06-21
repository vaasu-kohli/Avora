import React, { useState, useRef, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { motion } from 'motion/react';
import { ArrowLeft, Send, Calendar, Clock, Check, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { UserProfile, Meeting } from '../types';

export default function ChatPage({ partnerId, onClose }: { partnerId: string, onClose: () => void }) {
  const { currentUser, profiles, connections, messages, sendMessage, meetings, createMeeting, updateMeetingStatus } = useAppContext();
  const [content, setContent] = useState('');
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [meetingDate, setMeetingDate] = useState('');
  const [meetingTime, setMeetingTime] = useState('');
  
  const bottomRef = useRef<HTMLDivElement>(null);

  const partnerProfile = profiles.find(p => p.id === partnerId);
  
  const thread = messages
    .filter(m => 
      (m.senderId === currentUser?.id && m.receiverId === partnerId) || 
      (m.senderId === partnerId && m.receiverId === currentUser?.id)
    )
    .sort((a, b) => a.timestamp - b.timestamp);

  const connection = connections.find(c => 
    (c.fromUserId === currentUser?.id && c.toUserId === partnerId) ||
    (c.fromUserId === partnerId && c.toUserId === currentUser?.id)
  );

  const activeMeetings = meetings.filter(m => m.connectionId === connection?.id).sort((a,b) => a.createdAt - b.createdAt);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [thread, activeMeetings]);

  if (!currentUser || !partnerProfile) return null;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    if (!connection) return;

    sendMessage(connection.id, partnerId, content.trim());
    setContent('');
  };

  const handleScheduleMeeting = (e: React.FormEvent) => {
    e.preventDefault();
    if (!connection || !meetingDate || !meetingTime) return;
    
    createMeeting(connection.id, partnerProfile.id, meetingDate, meetingTime);
    setShowMeetingModal(false);
    setMeetingDate('');
    setMeetingTime('');
  };

  const isMeetingMessage = (text: string) => text.startsWith('[MEETING_INVITE]:');

  return (
    <div className="fixed inset-0 z-50 bg-[#0B1120] flex flex-col md:relative md:h-full md:rounded-3xl border-0 md:border md:border-white/10 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-white/5 bg-[#0B1120]/80 backdrop-blur-xl">
        <button onClick={onClose} className="p-2 rounded-full hover:bg-white/5 text-white/60">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <img src={partnerProfile.photoUrl} alt={partnerProfile.name} className="w-10 h-10 rounded-full object-cover border border-white/10" />
        <div>
          <h3 className="font-semibold text-white">{partnerProfile.name}</h3>
          <p className="text-xs text-white/50 capitalize">{partnerProfile.userType}</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {thread.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-white/40">
            <p>Start a conversation with {partnerProfile.name.split(' ')[0]}</p>
          </div>
        ) : (
          thread.map(msg => {
            const isMe = msg.senderId === currentUser.id;
            
            if (isMeetingMessage(msg.content)) {
               // Find associated meeting object to render interaction state
               const mtg = activeMeetings.find(m => Math.abs(m.createdAt - msg.timestamp) < 5000) || activeMeetings[activeMeetings.length - 1];
               
               return (
                 <div key={msg.id} className="flex justify-center my-6">
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 w-full max-w-sm">
                       <div className="flex items-center gap-2 mb-3">
                         <div className="w-8 h-8 rounded-full bg-[#14B8A6]/20 flex items-center justify-center">
                            <Calendar className="w-4 h-4 text-[#14B8A6]" />
                         </div>
                         <h4 className="text-sm font-semibold text-white">Meeting Invitation</h4>
                       </div>
                       
                       <p className="text-xs text-white/70 mb-4">{msg.content.replace('[MEETING_INVITE]: ', '')}</p>
                       
                       {mtg ? (
                         <div className="flex flex-col gap-2">
                           <div className="flex items-center justify-between text-xs bg-black/20 p-2 rounded-lg text-white/60">
                             <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {mtg.meetDate}</span>
                             <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {mtg.meetTime}</span>
                           </div>
                           
                           {mtg.status === 'pending' && currentUser.userType === 'builder' && (
                             <div className="flex gap-2 mt-2">
                               <button onClick={() => updateMeetingStatus(mtg.id, 'declined')} className="flex-1 py-1.5 rounded-lg border border-red-500/30 text-red-400 text-xs hover:bg-red-500/10 transition-colors">Decline</button>
                               <button onClick={() => updateMeetingStatus(mtg.id, 'accepted')} className="flex-1 py-1.5 rounded-lg bg-[#3B82F6] text-white text-xs hover:bg-blue-600 transition-colors">Accept</button>
                             </div>
                           )}
                           
                           {mtg.status !== 'pending' && (
                             <div className={cn("mt-2 text-center text-xs font-semibold py-1.5 rounded-lg", mtg.status === 'accepted' ? "bg-[#14B8A6]/20 text-[#14B8A6]" : "bg-red-500/20 text-red-400")}>
                               {mtg.status === 'accepted' ? 'Meeting Accepted' : 'Meeting Declined'}
                             </div>
                           )}
                           {mtg.status === 'pending' && currentUser.userType === 'founder' && (
                             <div className="mt-2 text-center text-xs text-white/40">Waiting for builder to respond...</div>
                           )}
                         </div>
                       ) : (
                          <div className="mt-2 text-center text-xs text-white/40">Legacy Meeting Event</div>
                       )}
                    </div>
                 </div>
               );
            }

            return (
              <div key={msg.id} className={cn("flex", isMe ? "justify-end" : "justify-start")}>
                <div 
                  className={cn(
                    "max-w-[75%] px-4 py-2.5 rounded-2xl text-sm",
                    isMe 
                      ? "bg-[#3B82F6] text-white rounded-br-sm" 
                      : "bg-white/5 border border-white/10 text-white/90 rounded-bl-sm"
                  )}
                >
                  {msg.content}
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-white/5 bg-[#0B1120]">
        {showMeetingModal ? (
          <form onSubmit={handleScheduleMeeting} className="bg-white/5 border border-white/10 rounded-2xl p-4 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-semibold text-white">Schedule Meeting</h4>
              <button type="button" onClick={() => setShowMeetingModal(false)} className="text-white/40 hover:text-white"><X className="w-4 h-4"/></button>
            </div>
            <div className="flex gap-3 mb-4">
               <input type="date" required value={meetingDate} onChange={e=>setMeetingDate(e.target.value)} className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#3B82F6]" />
               <input type="time" required value={meetingTime} onChange={e=>setMeetingTime(e.target.value)} className="w-32 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#3B82F6]" />
            </div>
            <button type="submit" className="w-full py-2 bg-[#3B82F6] text-white rounded-xl text-sm font-medium hover:bg-blue-600 transition-colors">Send Invite</button>
          </form>
        ) : (
          <form onSubmit={handleSend} className="relative flex items-center gap-2">
            {currentUser.userType === 'founder' && (
              <button type="button" onClick={() => setShowMeetingModal(true)} className="p-3 bg-white/5 border border-white/10 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors shrink-0">
                <Calendar className="w-5 h-5" />
              </button>
            )}
            <input
              type="text"
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 bg-white/5 border border-white/10 rounded-full px-5 py-3 text-white focus:outline-none focus:border-[#3B82F6] transition-colors"
            />
            <button 
              type="submit"
              disabled={!content.trim()}
              className="p-3 rounded-full bg-[#3B82F6] text-white disabled:opacity-50 disabled:bg-white/10 transition-colors shrink-0"
            >
              <Send className="w-5 h-5 ml-0.5" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
