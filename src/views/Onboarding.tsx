import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { UserType, UserProfile } from '../types';
import { supabase } from '../lib/supabase';
import { api } from '../lib/api';
import { ArrowRight, ChevronLeft, Rocket, UserCircle, Upload, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';

const SKILLS_LIST = ['AI/ML', 'Python', 'Web Development', 'Mobile Development', 'UI/UX Design', 'Marketing', 'Sales', 'Finance', 'Product Management'];
const STAGE_OPTIONS = ['Idea Stage', 'MVP Stage', 'Launched', 'Revenue Stage'];

export default function Onboarding() {
  const navigate = useNavigate();
  const { setCurrentUser } = useAppContext();
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [authId, setAuthId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<UserProfile>>({
    skills: [],
    interests: [],
    lookingFor: [],
    photoUrl: ''
  });
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setAuthId(session.user.id);
      else navigate('/auth');
    });
  }, [navigate]);

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = event.target.files?.[0];
      if (!file) return;

      setIsUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${authId}/${fileName}`;

      const { error: uploadError, data } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      updateForm({ photoUrl: publicUrl });
    } catch (error: any) {
      alert(error.message || 'Error uploading image!');
    } finally {
      setIsUploading(false);
    }
  };

  const nextStep = () => {
    setDirection(1);
    setStep(s => s + 1);
  };

  const prevStep = () => {
    setDirection(-1);
    setStep(s => s - 1);
  };

  const handleComplete = async () => {
    if (!authId) return;
    
    // if photoUrl is empty string, put a generator url
    let userPhoto = formData.photoUrl || '';
    if (!userPhoto.trim()) {
      userPhoto = `https://ui-avatars.com/api/?name=${formData.name || 'U'}&background=random`;
    }

    const newUser: UserProfile = {
      id: authId,
      ...formData as UserProfile,
      photoUrl: userPhoto,
    };
    
    await api.createProfile(newUser);
    setCurrentUser(newUser);
    navigate('/discover');
  };

  const updateForm = (updates: Partial<UserProfile>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const variants = {
    enter: (direction: number) => ({ x: direction > 0 ? 50 : -50, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (direction: number) => ({ x: direction < 0 ? 50 : -50, opacity: 0 })
  };

  const isValidLinkedin = (url: string) => url.includes('linkedin.com/in/');

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="flex flex-col space-y-4">
            <h2 className="text-2xl font-bold text-white mb-6">Who are you?</h2>
            
            <button
              onClick={() => { updateForm({ userType: 'founder' }); nextStep(); }}
              className={cn(
                "flex items-center p-6 rounded-2xl border transition-all text-left group",
                formData.userType === 'founder' ? "border-[#3B82F6] bg-[#3B82F6]/10" : "border-white/10 bg-white/5 hover:border-white/30"
              )}
            >
              <div className="flex-1">
                <h3 className="text-lg font-medium text-white mb-2">Founder</h3>
                <p className="text-sm text-white/60">I am building a startup and looking for team members.</p>
              </div>
              <Rocket className={cn("w-8 h-8", formData.userType === 'founder' ? "text-[#3B82F6]" : "text-white/40 group-hover:text-white")} />
            </button>
            
            <button
              onClick={() => { updateForm({ userType: 'builder' }); nextStep(); }}
              className={cn(
                "flex items-center p-6 rounded-2xl border transition-all text-left group",
                formData.userType === 'builder' ? "border-[#14B8A6] bg-[#14B8A6]/10" : "border-white/10 bg-white/5 hover:border-white/30"
              )}
            >
              <div className="flex-1">
                <h3 className="text-lg font-medium text-white mb-2">Builder</h3>
                <p className="text-sm text-white/60">I want to join a startup and build products.</p>
              </div>
              <UserCircle className={cn("w-8 h-8", formData.userType === 'builder' ? "text-[#14B8A6]" : "text-white/40 group-hover:text-white")} />
            </button>
          </div>
        );

      case 2:
        return (
          <div className="flex flex-col space-y-4">
            <h2 className="text-2xl font-bold text-white mb-2">
              Basic Profile
            </h2>
            
            <input type="text" placeholder="Full Name *" value={formData.name || ''} onChange={e => updateForm({ name: e.target.value })} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#3B82F6]" />
            
            <div className="flex items-center gap-4 py-2">
              <div 
                className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0 overflow-hidden cursor-pointer hover:border-[#3B82F6] transition-colors relative"
                onClick={() => fileInputRef.current?.click()}
              >
                {formData.photoUrl ? (
                  <img src={formData.photoUrl} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <Upload className="w-6 h-6 text-white/40" />
                )}
                {isUploading && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <Loader2 className="w-5 h-5 text-white animate-spin" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handlePhotoUpload}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="text-sm font-medium bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                >
                  Upload Photo *
                </button>
              </div>
            </div>

            <div className="pt-2 tracking-tight">
              <input type="url" placeholder="LinkedIn URL (Mandatory) *" value={formData.linkedin || ''} onChange={e => updateForm({ linkedin: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#3B82F6]" />
              {formData.linkedin && !isValidLinkedin(formData.linkedin) && (
                <p className="text-red-400 text-xs mt-1">Please enter a valid LinkedIn profile URL (must contain linkedin.com/in/)</p>
              )}
            </div>
            
            <button 
              disabled={
                !formData.name || !formData.photoUrl || !formData.linkedin || !isValidLinkedin(formData.linkedin)
              } 
              onClick={nextStep} 
              className="mt-6 px-6 py-3 rounded-xl bg-[#3B82F6] text-white font-medium transition-colors disabled:opacity-50"
            >
              Continue
            </button>
          </div>
        );

      case 3:
        if (formData.userType === 'founder') {
          return (
            <div className="flex flex-col space-y-4">
              <h2 className="text-2xl font-bold text-white mb-2">Startup Details</h2>
              <p className="text-sm text-white/60 mb-2">Required fields to start discovering.</p>

              <input type="text" placeholder="Startup Name *" value={formData.startupName || ''} onChange={e => updateForm({ startupName: e.target.value })} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#3B82F6]" />
              
              <div className="flex gap-2 max-w-full overflow-x-auto pb-2 scrollbar-hide">
                {STAGE_OPTIONS.map(opt => (
                  <button key={opt} onClick={() => updateForm({ startupStage: opt })} className={cn("px-4 py-2 rounded-full border text-xs whitespace-nowrap transition-all", formData.startupStage === opt ? "bg-[#3B82F6] border-[#3B82F6] text-white" : "bg-white/5 border-white/10 text-white/50 hover:bg-white/10")}>
                    {opt}
                  </button>
                ))}
              </div>

              <input type="text" placeholder="One-line Startup Pitch *" value={formData.bio || ''} onChange={e => updateForm({ bio: e.target.value })} maxLength={100} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#3B82F6]" />
              
              <button disabled={!formData.startupName || !formData.startupStage || !formData.bio} onClick={nextStep} className="mt-6 px-6 py-3 rounded-xl bg-[#3B82F6] text-white font-medium transition-colors disabled:opacity-50">
                Continue
              </button>
            </div>
          );
        } else {
          return (
            <div className="flex flex-col space-y-4">
              <h2 className="text-2xl font-bold text-white mb-2">Optional Additions (Builder)</h2>
              <p className="text-sm text-white/60 mb-2">Add more details or skip to discover now.</p>
              
              <input type="text" placeholder="College / University" value={formData.college || ''} onChange={e => updateForm({ college: e.target.value })} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#3B82F6]" />
              <input type="url" placeholder="GitHub URL" value={formData.github || ''} onChange={e => updateForm({ github: e.target.value })} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#3B82F6]" />
              <input type="url" placeholder="LeetCode URL" value={formData.leetcode || ''} onChange={e => updateForm({ leetcode: e.target.value })} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#3B82F6]" />
              <input type="url" placeholder="Portfolio Website" value={formData.portfolio || ''} onChange={e => updateForm({ portfolio: e.target.value })} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#3B82F6]" />
              <input type="url" placeholder="Resume Upload URL" value={formData.resumeUrl || ''} onChange={e => updateForm({ resumeUrl: e.target.value })} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#3B82F6]" />
              
              <div className="pt-2">
                <p className="text-xs text-white/50 mb-2">Skills (Optional)</p>
                <div className="flex flex-wrap gap-2">
                  {SKILLS_LIST.map(skill => {
                    const selected = formData.skills?.includes(skill);
                    return (
                      <button key={skill} onClick={() => updateForm({ skills: selected ? formData.skills?.filter(s => s !== skill) : [...(formData.skills || []), skill] })} className={cn("px-4 py-2 rounded-full border text-xs transition-all", selected ? "bg-[#3B82F6] text-white border-[#3B82F6]" : "bg-white/5 text-white/70 border-white/10 hover:border-white/30")}>
                        {skill}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                 <button onClick={handleComplete} className="flex-1 px-6 py-3 rounded-xl bg-white/5 text-white font-medium hover:bg-white/10 transition-colors">
                   Skip
                 </button>
                 <button onClick={handleComplete} className="flex-1 px-6 py-3 rounded-xl bg-[#3B82F6] text-white font-medium transition-colors">
                   Complete
                 </button>
              </div>
            </div>
          );
        }

      case 4:
        if (formData.userType === 'founder') {
          return (
            <div className="flex flex-col space-y-4">
              <h2 className="text-2xl font-bold text-white mb-2">Optional Additions (Founder)</h2>
              <p className="text-sm text-white/60 mb-2">Add more details or skip to discover now.</p>
              
              <textarea placeholder="Startup Description" value={formData.startupDescription || ''} onChange={e => updateForm({ startupDescription: e.target.value })} rows={3} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#3B82F6] resize-none" />
              <input type="text" placeholder="Industry" value={formData.industry || ''} onChange={e => updateForm({ industry: e.target.value })} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#3B82F6]" />
              <input type="url" placeholder="Startup Website" value={formData.website || ''} onChange={e => updateForm({ website: e.target.value })} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#3B82F6]" />
              
              <div className="pt-2">
                <p className="text-xs text-white/50 mb-2">Team Needs (Optional)</p>
                <div className="flex flex-wrap gap-2">
                  {['AI Engineer', 'Backend', 'Frontend', 'Design', 'Marketing', 'Sales'].map(role => {
                    const selected = formData.lookingFor?.includes(role);
                    return <button key={role} onClick={() => updateForm({ lookingFor: selected ? formData.lookingFor?.filter(s => s !== role) : [...(formData.lookingFor || []), role] })} className={cn("px-4 py-2 rounded-full border text-xs transition-all", selected ? "bg-[#3B82F6] text-white border-[#3B82F6]" : "bg-white/5 text-white/70 border-white/10 hover:border-white/30")}>{role}</button>;
                  })}
                </div>
              </div>
               
              <div className="flex gap-3 pt-4">
                 <button onClick={handleComplete} className="flex-1 px-6 py-3 rounded-xl bg-white/5 text-white font-medium hover:bg-white/10 transition-colors">
                   Skip
                 </button>
                 <button onClick={handleComplete} className="flex-1 px-6 py-3 rounded-xl bg-[#3B82F6] text-white font-medium transition-colors">
                   Complete
                 </button>
              </div>
            </div>
          );
        }
        return null;

      default: return null;
    }
  };

  const totalSteps = formData.userType === 'founder' ? 4 : 3;

  return (
    <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        {step > 1 && (
          <button onClick={prevStep} className="mb-8 flex items-center text-sm font-medium text-white/50 hover:text-white transition-colors">
            <ChevronLeft className="w-4 h-4 mr-1" /> Back
          </button>
        )}
        
        <div className="w-full h-1.5 bg-white/10 rounded-full mb-8 overflow-hidden">
          <motion.div 
            className="h-full bg-gradient-to-r from-[#3B82F6] to-[#14B8A6]"
            initial={{ width: `${((step - 1) / totalSteps) * 100}%` }}
            animate={{ width: `${(step / totalSteps) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        <div className="relative">
          <AnimatePresence custom={direction} mode="wait">
            <motion.div
              key={step}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: 'easeOut' }}
            >
              {renderStep()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
