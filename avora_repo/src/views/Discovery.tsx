import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useAppContext } from '../context/AppContext';
import { getMatchReasons } from '../lib/matching';
import { X, Heart, MapPin, Briefcase, GraduationCap, Github, Linkedin, ExternalLink, Check, Send, Info, MessageCircle, ArrowLeft, ArrowRight } from 'lucide-react';
import { cn } from '../lib/utils';
import { UserProfile } from '../types';

export default function Discovery() {
  const navigate = useNavigate();
  const { currentUser, profiles, connections, sendConnectionRequest, seenProfiles, markSeen } = useAppContext();
  const [showDetail, setShowDetail] = useState(false);

  // Filter out the current user, show opposite type only
  const potentialMatches = useMemo(() => {
    console.log('[Discover] Total profiles fetched:', profiles.length);
    if (!currentUser) return [];
    
    console.log('[Discover] Current user ID:', currentUser.id);
    console.log('[Discover] Current user type:', currentUser.userType);
    
    const unseen = profiles.filter(p => {
      let isExcluded = false;
      let reason = '';
      
      if (p.id === currentUser.id) {
        isExcluded = true;
        reason = 'Same as current user';
      } else if (p.userType === currentUser.userType) {
        isExcluded = true;
        reason = `Same user type (${p.userType})`;
      } else if (seenProfiles.includes(p.id)) {
        isExcluded = true;
        reason = 'Already seen (in seenProfiles)';
      }
      
      if (isExcluded) {
        console.log(`[Discover] Filtered out profile ID: ${p.id}. Reason: ${reason}`);
        return false;
      }
      
      return true;
    });

    console.log('[Discover] Profiles after filtering:', unseen.length);

    // Sort by matching score (mocking it by reason count for now)
    return unseen.sort((a, b) => {
      return getMatchReasons(currentUser, b).length - getMatchReasons(currentUser, a).length;
    });
  }, [currentUser, profiles, seenProfiles]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const currentProfile = potentialMatches[currentIndex];

  const [showIntroModal, setShowIntroModal] = useState(false);
  const [introMessage, setIntroMessage] = useState('');

  const hasConnection = useMemo(() => {
    if (!currentUser || !currentProfile) return false;
    return connections.some(c => 
      (c.toUserId === currentProfile.id && c.fromUserId === currentUser.id) || 
      (c.fromUserId === currentProfile.id && c.toUserId === currentUser.id)
    );
  }, [connections, currentProfile, currentUser]);

  const performConnection = (message?: string) => {
    if (!currentProfile) return;
    markSeen(currentProfile.id);
    sendConnectionRequest(currentProfile.id, message);
    setShowDetail(false);
    setShowIntroModal(false);
    setIntroMessage('');
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
              <div className="flex-1 relative cursor-pointer group flex flex-col" onClick={() => setShowDetail(true)}>
                {currentProfile.userType === 'founder' ? (
                  <div className="flex flex-col h-full bg-gradient-to-br from-[#0B1120] to-[#111827] p-6 pt-8 relative">
                    {matchReasons.length > 0 && (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 w-fit mb-4">
                        <Check className="w-3 h-3 text-[#14B8A6]" />
                        <span className="text-[10px] text-white font-medium">{matchReasons[0]}</span>
                      </div>
                    )}
                    
                    <div className="flex-1 flex flex-col pt-2 overflow-y-auto scrollbar-hide">
                      <div className="mb-4">
                        <span className="text-[10px] text-[#14B8A6] uppercase tracking-widest font-bold mb-1.5 block">
                          {currentProfile.industry || "Technology"}
                        </span>
                        <h2 className="text-3xl font-extrabold text-white leading-tight tracking-tight">
                          {currentProfile.startupName || "Stealth Startup"}
                        </h2>
                        {currentProfile.bio && (
                          <p className="text-white/90 text-sm font-medium mt-2 leading-relaxed">
                            {currentProfile.bio}
                          </p>
                        )}
                      </div>
                      
                      {currentProfile.startupDescription && currentProfile.startupDescription !== currentProfile.bio && (
                        <p className="text-[#94A3B8] text-xs leading-relaxed line-clamp-3 mb-5">
                          {currentProfile.startupDescription}
                        </p>
                      )}

                      <div className="flex flex-wrap gap-2 mb-5">
                        {currentProfile.startupStage && (
                          <span className="px-2.5 py-1 rounded-md bg-[#8B5CF6]/10 text-[#8B5CF6] text-[10px] font-bold uppercase tracking-wider border border-[#8B5CF6]/20">
                            Stage: {currentProfile.startupStage}
                          </span>
                        )}
                        {currentProfile.equity && currentProfile.equity !== '0' && currentProfile.equity !== '0%' && (
                          <span className="px-2.5 py-1 rounded-md bg-[#10B981]/10 text-[#10B981] text-[10px] font-bold uppercase tracking-wider border border-[#10B981]/20">
                            Equity: {currentProfile.equity}
                          </span>
                        )}
                        {currentProfile.city && (
                          <span className="px-2.5 py-1 rounded-md bg-white/5 text-white/70 text-[10px] font-bold uppercase tracking-wider border border-white/10 flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> {currentProfile.city}
                          </span>
                        )}
                      </div>

                      {currentProfile.lookingFor && currentProfile.lookingFor.length > 0 && (
                        <div className="mb-4">
                          <span className="text-[10px] uppercase tracking-wider text-white/30 font-semibold mb-2 block">Team Requirements</span>
                          <div className="flex flex-wrap gap-2">
                            {currentProfile.lookingFor.slice(0, 5).map(role => (
                              <span key={role} className="px-2.5 py-1 rounded bg-[#3B82F6]/10 text-[#3B82F6] text-[11px] font-medium border border-[#3B82F6]/20">
                                {role}
                              </span>
                            ))}
                            {currentProfile.lookingFor.length > 5 && (
                              <span className="px-2.5 py-1 rounded bg-white/5 text-white/40 text-[11px] border border-white/10">+{currentProfile.lookingFor.length - 5}</span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4 mt-auto pt-5 border-t border-white/10 shrink-0">
                      <img src={currentProfile.photoUrl} alt={currentProfile.name} className="w-12 h-12 rounded-full object-cover border border-white/20 shrink-0" />
                      <div className="overflow-hidden">
                        <h3 className="text-white font-medium text-sm truncate">{currentProfile.name}</h3>
                        <p className="text-[#94A3B8] text-xs mt-0.5 truncate flex items-center gap-1 text-[11px]">
                          {currentProfile.designation || 'Founder'} <span className="text-white/30">•</span> {currentProfile.startupName || "Stealth Startup"}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="absolute inset-0 z-0">
                      <img src={currentProfile.photoUrl} alt={currentProfile.name} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0B1120] via-[#0B1120]/80 to-transparent" />
                    </div>
                    
                    <div className="absolute bottom-0 left-0 right-0 p-6 z-10 flex flex-col justify-end">
                      {matchReasons.length > 0 && (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 w-fit mb-3">
                          <Check className="w-3 h-3 text-[#14B8A6]" />
                          <span className="text-[10px] text-white font-medium">{matchReasons[0]}</span>
                        </div>
                      )}
                      
                      <div className="flex flex-col gap-1 mb-3">
                        <div className="flex items-center gap-2">
                          <h2 className="text-3xl font-bold text-white">{currentProfile.name}</h2>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-[#14B8A6]/20 text-[#14B8A6] uppercase font-bold tracking-widest border border-[#14B8A6]/20">{currentProfile.userType}</span>
                        </div>
                        
                        {currentProfile.bio && (
                          <p className="text-[#94A3B8] line-clamp-2 text-sm mt-1 leading-relaxed">
                            {currentProfile.bio}
                          </p>
                        )}
                      </div>
                      
                      {currentProfile.skills && currentProfile.skills.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-5">
                          {currentProfile.skills.slice(0, 3).map(skill => (
                            <span key={skill} className="text-[11px] bg-white/10 border border-white/10 px-2.5 py-1 rounded text-white/90 font-medium">
                              {skill}
                            </span>
                          ))}
                          {currentProfile.skills.length > 3 && (
                            <span className="text-[11px] bg-white/5 border border-white/10 px-2.5 py-1 rounded text-white/50">+{currentProfile.skills.length - 3}</span>
                          )}
                        </div>
                      )}
                      
                      <div className="flex items-center gap-4 text-xs text-white/40 font-medium tracking-wide">
                        {currentProfile.city && <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> {currentProfile.city}</span>}
                        {currentProfile.college && <span className="flex items-center gap-1.5"><GraduationCap className="w-3.5 h-3.5" /> {currentProfile.college.split(' ')[0]}</span>}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Action Buttons */}
      {!showIntroModal && (
        <div className="flex flex-col gap-3 mt-6 z-10 w-full px-4">
          <div className="flex items-center gap-3 w-full justify-center">
            {currentIndex > 0 ? (
              <button 
                onClick={() => { setShowDetail(false); setCurrentIndex(prev => prev - 1); }}
                className="flex items-center justify-center gap-2 px-4 h-12 rounded-full bg-white/5 backdrop-blur-lg border border-white/10 text-white/50 hover:bg-white/10 hover:text-white transition-all font-medium flex-1"
              >
                <ArrowLeft className="w-4 h-4" /> Previous
              </button>
            ) : (
              <div className="flex-1" />
            )}
            
            <button 
              onClick={() => {
                if (hasConnection) navigate('/messages');
              }}
              disabled={!hasConnection}
              className={cn("flex items-center justify-center gap-2 px-4 h-12 rounded-full transition-all font-medium flex-1", hasConnection ? "bg-[#0B1120] border border-[#14B8A6]/30 text-[#14B8A6] hover:bg-[#14B8A6]/10" : "bg-white/5 border border-white/5 text-white/30 cursor-not-allowed")}
            >
              <MessageCircle className="w-4 h-4" /> Message
            </button>

            <button 
              onClick={() => { setShowDetail(false); performConnection(); }}
              disabled={hasConnection}
              className={cn("flex items-center justify-center gap-2 px-4 h-12 rounded-full font-bold tracking-wide flex-1 transition-all", hasConnection ? "bg-white/10 text-white/50 cursor-not-allowed" : "bg-[#3B82F6] text-white hover:bg-blue-600 transition-transform hover:scale-105 shadow-[0_0_20px_rgba(59,130,246,0.3)]")}
            >
              <Heart className="w-4 h-4" /> {hasConnection ? 'Connected' : 'Connect'}
            </button>
            
            {currentIndex < potentialMatches.length - 1 ? (
              <button 
                onClick={() => { setShowDetail(false); setCurrentIndex(prev => prev + 1); }}
                className="flex items-center justify-center gap-2 px-4 h-12 rounded-full bg-white/5 backdrop-blur-lg border border-white/10 text-white/50 hover:bg-white/10 hover:text-white transition-all font-medium flex-1"
              >
                Next <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <div className="flex-1" />
            )}
          </div>
          {currentUser.userType === 'founder' && (
            <button className="flex items-center justify-center gap-2 w-full h-10 rounded-full bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:text-white transition-all text-xs font-semibold">
              Book Meeting
            </button>
          )}
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
  if (profile.userType === 'founder') {
    return (
      <div className="w-full h-full overflow-y-auto scrollbar-hide bg-[#0B1120] relative flex flex-col">
        <div className="sticky top-0 bg-[#0B1120]/80 backdrop-blur-md z-20 border-b border-white/5 p-4 flex items-center gap-4">
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-colors shrink-0">
            <X className="w-5 h-5" />
          </button>
          <div className="flex-1 truncate">
            <h2 className="text-white font-bold truncate">{profile.startupName || 'Stealth Startup'}</h2>
            <p className="text-white/40 text-xs">Startup Profile</p>
          </div>
        </div>

        <div className="p-6">
          <div className="flex items-start gap-4 mb-8">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#3B82F6]/20 to-[#8B5CF6]/20 border border-white/10 flex items-center justify-center shrink-0">
              <Briefcase className="w-8 h-8 text-[#3B82F6]/50" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white leading-tight mb-2">{profile.startupName || 'Stealth Startup'}</h1>
              <div className="flex flex-wrap gap-2 text-xs">
                {profile.industry && <span className="px-2 py-1 rounded bg-white/5 text-white/70">{profile.industry}</span>}
                {profile.startupStage && <span className="px-2 py-1 rounded bg-[#14B8A6]/10 text-[#14B8A6]">{profile.startupStage}</span>}
                {profile.equity && profile.equity !== '0' && profile.equity !== '0%' && <span className="px-2 py-1 rounded bg-[#10B981]/10 text-[#10B981]">Equity: {profile.equity}</span>}
              </div>
            </div>
          </div>

          {matchReasons.length > 0 && (
            <div className="p-4 bg-[#3B82F6]/5 border border-[#3B82F6]/20 rounded-2xl mb-8">
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
          
          <div className="space-y-8">
            <section>
              <h3 className="text-xs uppercase tracking-wider text-white/40 font-semibold mb-3">About the Startup</h3>
              <p className="text-white/80 leading-relaxed text-sm bg-white/5 p-4 rounded-2xl border border-white/5">
                {profile.startupDescription || profile.bio}
              </p>
            </section>

            {profile.problemSolved && (
              <section>
                <h3 className="text-xs uppercase tracking-wider text-white/40 font-semibold mb-3">Problem Being Solved</h3>
                <p className="text-white/70 leading-relaxed text-sm">
                  {profile.problemSolved}
                </p>
              </section>
            )}

            {profile.lookingFor && profile.lookingFor.length > 0 && (
              <section>
                <h3 className="text-xs uppercase tracking-wider text-white/40 font-semibold mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#3B82F6] animate-pulse"></span>
                  Team Roles Needed
                </h3>
                <div className="flex flex-wrap gap-2">
                  {profile.lookingFor.map(role => (
                     <span key={role} className="px-3 py-1.5 rounded-lg bg-[#3B82F6]/10 border border-[#3B82F6]/20 text-xs text-[#3B82F6] font-medium">{role}</span>
                  ))}
                </div>
              </section>
            )}

            <section className="pt-8 border-t border-white/10">
              <h3 className="text-xs uppercase tracking-wider text-white/40 font-semibold mb-4">Founder</h3>
              <div className="flex items-center gap-4 mb-4">
                <img src={profile.photoUrl} alt={profile.name} className="w-16 h-16 rounded-full object-cover border border-white/20" />
                <div>
                  <h4 className="text-white font-medium text-lg">{profile.name}</h4>
                  <div className="flex items-center gap-3 mt-1">
                    {profile.city && <span className="flex items-center gap-1 text-xs text-white/50"><MapPin className="w-3 h-3" /> {profile.city}</span>}
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2 mb-6">
                {profile.linkedin && <a href={(profile.linkedin.startsWith('http') ? '' : 'https://') + profile.linkedin} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/60 hover:text-white hover:bg-[#0A66C2]/20 transition-colors"><Linkedin className="w-4 h-4" /></a>}
                {profile.website && <a href={(profile.website.startsWith('http') ? '' : 'https://') + profile.website} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors"><ExternalLink className="w-4 h-4" /></a>}
              </div>

              {profile.startupDescription && profile.bio && profile.startupDescription !== profile.bio && (
                 <p className="text-white/70 leading-relaxed text-sm">
                   {profile.bio}
                 </p>
              )}
            </section>
            
            <div className="h-20" />
          </div>
        </div>
      </div>
    );
  }

  // Builder Profile Detail Layout
  return (
    <div className="w-full h-full overflow-y-auto scrollbar-hide bg-[#0B1120] relative flex flex-col">
      <div className="relative h-72 shrink-0">
        <img src={profile.photoUrl} alt={profile.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B1120] to-transparent" />
        <button onClick={onClose} className="absolute top-4 left-4 w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:bg-black/60 transition-colors z-20">
          <X className="w-5 h-5" />
        </button>
      </div>
      
      <div className="p-6 -mt-10 relative z-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-3xl font-bold text-white">{profile.name}</h2>
          <span className="text-[10px] font-semibold text-[#14B8A6] bg-[#14B8A6]/10 border border-[#14B8A6]/20 uppercase tracking-widest px-3 py-1 rounded">{profile.userType}</span>
        </div>
        
        <div className="flex items-center gap-4 text-sm text-white/60 mb-6">
          {profile.city && <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-[#3B82F6]" /> {profile.city}</span>}
          {profile.college && <span className="flex items-center gap-1.5"><GraduationCap className="w-4 h-4 text-[#3B82F6]" /> {profile.college}</span>}
        </div>

        <div className="flex gap-3 mb-8">
          {profile.linkedin && <a href={(profile.linkedin.startsWith('http') ? '' : 'https://') + profile.linkedin} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/60 hover:text-white hover:bg-[#0A66C2]/20 transition-colors"><Linkedin className="w-5 h-5" /></a>}
          {profile.github && <a href={(profile.github.startsWith('http') ? '' : 'https://') + profile.github} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors"><Github className="w-5 h-5" /></a>}
          {profile.portfolio && <a href={(profile.portfolio.startsWith('http') ? '' : 'https://') + profile.portfolio} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors"><ExternalLink className="w-5 h-5" /></a>}
        </div>

        {matchReasons.length > 0 && (
          <div className="p-4 bg-[#14B8A6]/5 border border-[#14B8A6]/20 rounded-2xl mb-6">
            <h3 className="text-[10px] font-semibold text-[#14B8A6] uppercase tracking-widest mb-3">Why Recommended</h3>
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
        
        <div className="space-y-8">
          <section>
            <h3 className="text-xs uppercase tracking-wider text-white/40 font-semibold mb-3">About</h3>
            <p className="text-white/80 leading-relaxed text-sm">{profile.bio}</p>
          </section>

          {profile.currentProjects && (
            <section>
              <h3 className="text-xs uppercase tracking-wider text-white/40 font-semibold mb-3">Current Projects</h3>
              <p className="text-white/80 leading-relaxed text-sm p-4 bg-white/5 rounded-xl border border-white/5">{profile.currentProjects}</p>
            </section>
          )}

          {profile.skills && profile.skills.length > 0 && (
            <section>
              <h3 className="text-xs uppercase tracking-wider text-white/40 font-semibold mb-3">Skills</h3>
              <div className="flex flex-wrap gap-2">
                {profile.skills.map(skill => (
                  <span key={skill} className="px-3 py-1.5 rounded-md bg-white/5 border border-white/10 text-xs text-white/80 font-medium">{skill}</span>
                ))}
              </div>
            </section>
          )}

          {profile.interests && profile.interests.length > 0 && (
            <section>
              <h3 className="text-xs uppercase tracking-wider text-white/40 font-semibold mb-3">Interests</h3>
              <div className="flex flex-wrap gap-2">
                {profile.interests.map(interest => (
                  <span key={interest} className="px-3 py-1.5 rounded-md bg-[#14B8A6]/10 border border-[#14B8A6]/20 text-xs text-[#14B8A6] font-medium">{interest}</span>
                ))}
              </div>
            </section>
          )}

          {profile.commitment && (
            <section className="pb-10">
              <h3 className="text-xs uppercase tracking-wider text-white/40 font-semibold mb-3">Commitment</h3>
              <div className="inline-flex px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white/80 font-medium">
                {profile.commitment}
              </div>
            </section>
          )}
          
          <div className="h-20" />
        </div>
      </div>
    </div>
  );
}
