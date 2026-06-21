import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppContext } from '../context/AppContext';
import { getMatchReasons } from '../lib/matching';
import { X, Heart, MapPin, Briefcase, GraduationCap, Github, Linkedin, ExternalLink, Check, Send } from 'lucide-react';
import { cn } from '../lib/utils';
import { UserProfile } from '../types';

export default function Discovery() {
  const { currentUser, profiles, connections, sendConnectionRequest, seenProfiles, markSeen } = useAppContext();
  const [showDetail, setShowDetail] = useState(false);

  // Filter out the current user, those already seen, and active connections
  const potentialMatches = useMemo(() => {
    if (!currentUser) return [];
    
    const unseen = profiles.filter(p => 
      p.id !== currentUser.id && 
      !seenProfiles.includes(p.id) &&
      !connections.some(c => (c.toUserId === p.id && c.fromUserId === currentUser.id) || (c.fromUserId === p.id && c.toUserId === currentUser.id))
    );

    // Sort by matching score (mocking it by reason count for now)
    return unseen.sort((a, b) => {
      return getMatchReasons(currentUser, b).length - getMatchReasons(currentUser, a).length;
    });
  }, [currentUser, profiles, seenProfiles, connections]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const currentProfile = potentialMatches[currentIndex];

  const [showIntroModal, setShowIntroModal] = useState(false);
  const [introMessage, setIntroMessage] = useState('');

  const performConnection = (message?: string) => {
    if (!currentProfile) return;
    markSeen(currentProfile.id);
    sendConnectionRequest(currentProfile.id, message);
    setShowDetail(false);
    setShowIntroModal(false);
    setIntroMessage('');
    setTimeout(() => {
      setCurrentIndex(prev => prev + 1);
    }, 300);
  };

  const handleSwipe = (direction: 'left' | 'right') => {
    if (!currentProfile) return;
    
    if (direction === 'left') {
      markSeen(currentProfile.id);
      setShowDetail(false);
      setTimeout(() => {
        setCurrentIndex(prev => prev + 1);
      }, 300);
    } else {
      setShowIntroModal(true);
    }
  };

  if (!currentUser) return null;

  if (!currentProfile || currentIndex >= potentialMatches.length) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
        <div className="w-24 h-24 rounded-full bg-slate-800/50 flex items-center justify-center mb-6">
          <Heart className="w-10 h-10 text-white/20" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">You're all caught up!</h2>
        <p className="text-white/50 max-w-sm">We are looking for more users who match your criteria. Check back later.</p>
      </div>
    );
  }

  const matchReasons = getMatchReasons(currentUser, currentProfile);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-4 relative">
      <div className="w-full max-w-md aspect-[3/4] relative perspective-1000">
        <AnimatePresence mode="popLayout">
          <motion.div
            key={currentProfile.id}
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ 
              x: !showDetail ? (Math.random() > 0.5 ? 200 : -200) : 0, 
              opacity: 0, 
              rotate: !showDetail ? (Math.random() > 0.5 ? 15 : -15) : 0 
            }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="w-full h-full absolute inset-0 bg-white/5 border border-white/20 rounded-[40px] shadow-2xl backdrop-blur-md overflow-hidden flex flex-col"
          >
            {showDetail ? (
              <ProfileDetailView profile={currentProfile} matchReasons={matchReasons} onClose={() => setShowDetail(false)} />
            ) : (
              <div className="flex-1 relative cursor-pointer group" onClick={() => setShowDetail(true)}>
                {/* Photo & Gradient */}
                <div className="absolute inset-0 z-0">
                  <img src={currentProfile.photoUrl} alt={currentProfile.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0B1120] via-[#0B1120]/60 to-transparent" />
                </div>
                
                {/* Info Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-6 z-10 flex flex-col justify-end">
                  {matchReasons.length > 0 && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 w-fit mb-3">
                      <Check className="w-3 h-3 text-[#14B8A6]" />
                      <span className="text-[10px] text-white font-medium">{matchReasons[0]}</span>
                    </div>
                  )}
                  
                  <div className="flex items-baseline gap-2 mb-1">
                    <h2 className="text-3xl font-bold text-white">{currentProfile.name}</h2>
                    <span className="text-sm px-2 py-0.5 rounded bg-white/10 text-white/80 capitalize border border-white/10">{currentProfile.userType}</span>
                  </div>
                  
                  {(currentProfile.userType === 'founder' && currentProfile.startupName) && (
                    <p className="text-white/80 font-medium text-lg mb-2 flex items-center gap-2">
                       <Briefcase className="w-4 h-4 text-[#3B82F6]" /> {currentProfile.startupName}
                    </p>
                  )}
                  
                  <p className="text-white/70 line-clamp-2 text-sm mb-4">
                    {currentProfile.bio}
                  </p>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    {currentProfile.skills.slice(0, 3).map(skill => (
                      <span key={skill} className="text-[10px] bg-white/10 border border-white/10 px-2 py-1 rounded-md text-white/90">
                        {skill}
                      </span>
                    ))}
                    {currentProfile.skills.length > 3 && (
                      <span className="text-[10px] bg-white/5 border border-white/10 px-2 py-1 rounded-md text-white/50">+{currentProfile.skills.length - 3}</span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-3 text-xs text-white/40">
                    {currentProfile.city && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {currentProfile.city}</span>}
                    {(currentProfile.userType === 'builder' && currentProfile.college) && <span className="flex items-center gap-1"><GraduationCap className="w-3 h-3" /> {currentProfile.college.split(' ')[0]}</span>}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Action Buttons */}
      {!showDetail && !showIntroModal && (
        <div className="flex items-center gap-6 mt-8 z-10">
          <button 
            onClick={() => handleSwipe('left')}
            className="w-14 h-14 rounded-full border border-white/10 bg-white/5 backdrop-blur-lg flex items-center justify-center text-white/40 hover:text-red-500 hover:bg-red-500/20 transition-all group"
          >
            <X className="w-6 h-6 group-hover:scale-110 transition-transform" />
          </button>
          
          <button 
            onClick={() => setShowDetail(true)}
            className="w-12 h-12 rounded-full hidden md:flex items-center justify-center border border-white/10 bg-white/5 text-white/30 text-white/40 hover:text-white transition-all"
          >
            <span className="text-xs font-semibold uppercase tracking-wider">i</span>
          </button>
          
          <button 
            onClick={() => handleSwipe('right')}
            className="px-8 h-14 rounded-full bg-[#3B82F6] flex items-center justify-center font-bold text-sm tracking-wide shadow-[0_0_20px_rgba(59,130,246,0.4)] hover:scale-105 transition-transform text-white gap-2"
          >
            INTERESTED
          </button>
        </div>
      )}

      {/* Intro Message Modal */}
      {showIntroModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#0B1120] border border-white/10 rounded-3xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-2">Introduce yourself</h3>
            <p className="text-sm text-white/50 mb-4">You must include a message to send a connection request.</p>
            <textarea
              autoFocus
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#3B82F6] transition-colors resize-none mb-3"
              rows={4}
              placeholder="Hey, I really loved what you are building..."
              value={introMessage}
              onChange={e => setIntroMessage(e.target.value)}
            />
            {currentUser.userType === 'builder' && (
              <div className="mb-4">
                 <label className="text-xs text-white/50 mb-1 block">Resume Attachment (Optional)</label>
                 <input type="file" onChange={(e) => {
                   if (e.target.files?.length) {
                     setIntroMessage(prev => prev + '\n\n📄 [Resume Attached: ' + e.target.files![0].name + ']');
                   }
                 }} className="text-xs text-white/70 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-[#3B82F6]/10 file:text-[#3B82F6] hover:file:bg-[#3B82F6]/20 transition-colors cursor-pointer" />
              </div>
            )}
            
            <div className="flex gap-3 mt-4">
              <button 
                onClick={() => setShowIntroModal(false)}
                className="flex-1 py-3 rounded-xl border border-white/10 text-white/70 hover:bg-white/5 transition-colors font-medium"
              >
                Cancel
              </button>
              <button 
                disabled={!introMessage.trim()}
                onClick={() => performConnection(introMessage)}
                className="flex-1 py-3 rounded-xl bg-[#3B82F6] text-white hover:bg-blue-600 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50"
              >
                Send Request <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ProfileDetailView({ profile, matchReasons, onClose }: { profile: UserProfile, matchReasons: string[], onClose: () => void }) {
  return (
    <div className="w-full h-full overflow-y-auto scrollbar-hide bg-[#0B1120] relative flex flex-col">
      <div className="relative h-72 shrink-0">
        <img src={profile.photoUrl} alt={profile.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-surface to-transparent" />
        <button onClick={onClose} className="absolute top-4 left-4 w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:bg-black/60 transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>
      
      <div className="p-6 -mt-10 relative z-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-3xl font-bold text-white">{profile.name}</h2>
          <span className="text-[10px] font-semibold text-white/60 uppercase tracking-widest px-3 py-1 rounded bg-white/10">{profile.userType}</span>
        </div>
        
        <div className="flex items-center gap-4 text-sm text-white/60 mb-6">
          <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-[#3B82F6]" /> {profile.city}</span>
          {(profile.userType === 'builder' && profile.college) && <span className="flex items-center gap-1.5"><GraduationCap className="w-4 h-4 text-[#3B82F6]" /> {profile.college}</span>}
        </div>

        {/* Social Links */}
        <div className="flex gap-3 mb-8">
          {profile.linkedin && <a href={(profile.linkedin.startsWith('http') ? '' : 'https://') + profile.linkedin} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/60 hover:text-white hover:bg-[#0A66C2]/20 transition-colors"><Linkedin className="w-5 h-5" /></a>}
          {profile.github && <a href={(profile.github.startsWith('http') ? '' : 'https://') + profile.github} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors"><Github className="w-5 h-5" /></a>}
          {profile.portfolio && <a href={(profile.portfolio.startsWith('http') ? '' : 'https://') + profile.portfolio} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors"><ExternalLink className="w-5 h-5" /></a>}
          {profile.website && <a href={(profile.website.startsWith('http') ? '' : 'https://') + profile.website} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors"><ExternalLink className="w-5 h-5" /></a>}
        </div>

        {matchReasons.length > 0 && (
          <div className="p-4 bg-[#3B82F6]/5 border border-[#3B82F6]/20 rounded-2xl mb-6">
            <h3 className="text-[10px] font-semibold text-[#3B82F6] uppercase tracking-widest mb-3">Why Recommended</h3>
            <ul className="space-y-2">
              {matchReasons.map((reason, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-white/80">
                  <Check className="w-4 h-4 text-[#14B8A6] shrink-0 mt-0.5" />
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        <div className="space-y-6">
          <section>
            <h3 className="text-xs uppercase tracking-wider text-white/40 font-semibold mb-3">About</h3>
            <p className="text-white/80 leading-relaxed text-sm">{profile.bio}</p>
          </section>

          {profile.userType === 'founder' && profile.startupName && (
            <section className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <h3 className="text-[10px] uppercase tracking-widest text-white/40 font-bold mb-1">Company</h3>
              <h4 className="text-lg text-white font-medium mb-1">{profile.startupName}</h4>
              <p className="text-white/90 font-medium mb-2 text-sm leading-relaxed">{profile.startupDescription}</p>
              <h3 className="text-[10px] uppercase tracking-widest text-white/40 font-bold mt-4 mb-1">Problem Being Solved</h3>
              <p className="text-white/60 text-xs leading-relaxed mb-4">{profile.problemSolved}</p>
              
              <div className="flex gap-2">
                <span className="px-2 py-1 bg-white/10 rounded text-[10px] text-white/70">{profile.industry}</span>
                <span className="px-2 py-1 bg-white/10 rounded text-[10px] text-white/70">{profile.startupStage}</span>
              </div>
            </section>
          )}

          {profile.userType === 'builder' && profile.currentProjects && (
            <section>
              <h3 className="text-xs uppercase tracking-wider text-white/40 font-semibold mb-3">Current Projects</h3>
              <p className="text-white/80 leading-relaxed text-sm p-4 bg-white/5 rounded-xl border border-white/5">{profile.currentProjects}</p>
            </section>
          )}

          <section>
            <h3 className="text-xs uppercase tracking-wider text-white/40 font-semibold mb-3">Skills</h3>
            <div className="flex flex-wrap gap-2">
              {profile.skills.map(skill => (
                <span key={skill} className="px-3 py-1.5 rounded-md bg-white/5 border border-white/10 text-xs text-white/80">{skill}</span>
              ))}
            </div>
          </section>

          <section>
            <h3 className="text-xs uppercase tracking-wider text-white/40 font-semibold mb-3">Interests</h3>
            <div className="flex flex-wrap gap-2">
              {profile.interests.map(interest => (
                <span key={interest} className="px-3 py-1.5 rounded-md bg-[#14B8A6]/10 border border-[#14B8A6]/20 text-xs text-[#14B8A6]">{interest}</span>
              ))}
            </div>
          </section>

          <section className="pb-10">
            <h3 className="text-xs uppercase tracking-wider text-white/40 font-semibold mb-3">Commitment</h3>
            <div className="inline-flex px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white/80">
              {profile.commitment}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
