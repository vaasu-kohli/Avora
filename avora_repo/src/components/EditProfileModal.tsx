import React, { useState, useRef } from 'react';
import { UserProfile } from '../types';
import { X, Upload, Loader2, Save } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';
import { api } from '../lib/api';

interface EditProfileModalProps {
  currentUser: UserProfile;
  onClose: () => void;
  onSave: (updatedProfile: UserProfile) => void;
}

const SKILLS_LIST = ['AI/ML', 'Python', 'Web Development', 'Mobile Development', 'UI/UX Design', 'Marketing', 'Sales', 'Finance', 'Product Management'];
const STAGE_OPTIONS = ['Idea Stage', 'MVP Stage', 'Launched', 'Revenue Stage'];
const ROLES = ['AI Engineer', 'Backend', 'Frontend', 'Design', 'Marketing', 'Sales'];

export default function EditProfileModal({ currentUser, onClose, onSave }: EditProfileModalProps) {
  const [formData, setFormData] = useState<Partial<UserProfile>>({
    ...currentUser
  });
  
  const [isOtherRoleSelected, setIsOtherRoleSelected] = useState(() => {
    return (currentUser.lookingFor || []).some(r => !ROLES.includes(r));
  });
  
  const [customRolesText, setCustomRolesText] = useState(() => {
    return (currentUser.lookingFor || []).filter(r => !ROLES.includes(r)).join(', ');
  });

  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateForm = (updates: Partial<UserProfile>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = event.target.files?.[0];
      if (!file) return;

      setIsUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${currentUser.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
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

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const finalFormData = { ...formData };
      if (finalFormData.userType === 'founder') {
        const standardRoles = (finalFormData.lookingFor || []).filter(r => ROLES.includes(r));
        let additionalRoles: string[] = [];
        if (isOtherRoleSelected && customRolesText.trim().length > 0) {
           additionalRoles = customRolesText.split(',').map(s => s.trim()).filter(s => s.length > 0);
        }
        finalFormData.lookingFor = Array.from(new Set([...standardRoles, ...additionalRoles]));
      }

      const updatedProfile = { ...currentUser, ...finalFormData } as UserProfile;
      await api.createProfile(updatedProfile); // Maps perfectly to upserts
      onSave(updatedProfile);
    } catch (err: any) {
      alert('Failed to save profile: ' + (err.message || 'Unknown error'));
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm sm:p-6 overflow-y-auto w-full h-full">
      <div className="bg-[#0B1120] border border-white/10 rounded-3xl w-full max-w-2xl shadow-2xl relative my-auto">
        <div className="sticky top-0 bg-[#0B1120] rounded-t-3xl border-b border-white/10 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-xl font-bold text-white">Edit Profile</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 transition-colors">
            <X className="w-5 h-5 text-white/60 hover:text-white" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[70vh] space-y-6 scrollbar-hide">
          {/* Photo & Basics - Shared */}
          <section className="space-y-4">
            <h3 className="text-sm uppercase tracking-wider text-white/40 font-semibold">Basic Info</h3>
            
            <div className="flex items-center gap-4">
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
                <input type="file" ref={fileInputRef} onChange={handlePhotoUpload} accept="image/*" className="hidden" />
                <button type="button" onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="text-xs font-medium bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50">
                   Change Photo
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs text-white/50 mb-1 block">Full Name *</label>
              <input type="text" value={formData.name || ''} onChange={e => updateForm({ name: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#3B82F6]" />
            </div>

            <div>
              <label className="text-xs text-white/50 mb-1 block">Bio / Tagline *</label>
              <input type="text" maxLength={100} value={formData.bio || ''} onChange={e => updateForm({ bio: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#3B82F6]" />
            </div>

            <div>
              <label className="text-xs text-white/50 mb-1 block">College / University</label>
              <input type="text" value={formData.college || ''} onChange={e => updateForm({ college: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#3B82F6]" />
            </div>

            <div>
              <label className="text-xs text-white/50 mb-1 block">City (e.g., San Francisco, CA)</label>
              <input type="text" value={formData.city || ''} onChange={e => updateForm({ city: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#3B82F6]" />
            </div>

            <div>
              <label className="text-xs text-white/50 mb-1 block">LinkedIn Profile URL</label>
              <input type="url" value={formData.linkedin || ''} onChange={e => updateForm({ linkedin: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#3B82F6]" />
            </div>
          </section>

          {/* Founder Specific */}
          {currentUser.userType === 'founder' && (
            <section className="space-y-4 pt-4 border-t border-white/5">
              <h3 className="text-sm uppercase tracking-wider text-white/40 font-semibold">Startup Details</h3>
              
              <div>
                <label className="text-xs text-white/50 mb-1 block">Startup Name *</label>
                <input type="text" value={formData.startupName || ''} onChange={e => updateForm({ startupName: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#3B82F6]" />
              </div>

              <div>
                <label className="text-xs text-white/50 mb-1 block">Designation</label>
                <input type="text" value={formData.designation || ''} onChange={e => updateForm({ designation: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#3B82F6]" placeholder="e.g. Founder, CEO" />
              </div>

              <div>
                <label className="text-xs text-white/50 mb-1 block">Stage *</label>
                <div className="flex gap-2 max-w-full overflow-x-auto pb-2 scrollbar-hide">
                  {STAGE_OPTIONS.map(opt => (
                    <button key={opt} type="button" onClick={() => updateForm({ startupStage: opt })} className={cn("px-4 py-2 rounded-full border text-xs whitespace-nowrap transition-all", formData.startupStage === opt ? "bg-[#3B82F6] border-[#3B82F6] text-white" : "bg-white/5 border-white/10 text-white/50 hover:bg-white/10")}>
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-white/50 mb-1 block">Startup Description</label>
                <textarea value={formData.startupDescription || ''} onChange={e => updateForm({ startupDescription: e.target.value })} rows={3} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#3B82F6] resize-none" />
              </div>

              <div>
                <label className="text-xs text-white/50 mb-1 block">Problem Statement *</label>
                <textarea value={formData.problemSolved || ''} onChange={e => updateForm({ problemSolved: e.target.value })} rows={2} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#3B82F6] resize-none" placeholder="What problem are you solving?" />
              </div>

              <div>
                 <label className="text-xs text-white/50 mb-1 block">Website</label>
                 <input type="url" value={formData.website || ''} onChange={e => updateForm({ website: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#3B82F6]" />
              </div>

              <div>
                 <label className="text-xs text-white/50 mb-1 block">Industry</label>
                 <input type="text" value={formData.industry || ''} onChange={e => updateForm({ industry: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#3B82F6]" />
              </div>
              
              <div>
                <label className="text-xs text-white/50 mb-1 block">Team Needs</label>
                <div className="flex flex-wrap gap-2">
                  {ROLES.map(role => {
                    const selected = formData.lookingFor?.includes(role);
                    return <button key={role} type="button" onClick={() => updateForm({ lookingFor: selected ? formData.lookingFor?.filter(s => s !== role) : [...(formData.lookingFor || []), role] })} className={cn("px-3 py-1.5 rounded-full border text-xs transition-all", selected ? "bg-[#3B82F6] text-white border-[#3B82F6]" : "bg-white/5 text-white/70 border-white/10 hover:border-white/30")}>{role}</button>;
                  })}
                  <button 
                    key="Other" 
                    type="button"
                    onClick={() => setIsOtherRoleSelected(!isOtherRoleSelected)} 
                    className={cn("px-3 py-1.5 rounded-full border text-xs transition-all", isOtherRoleSelected ? "bg-[#3B82F6] text-white border-[#3B82F6]" : "bg-white/5 text-white/70 border-white/10 hover:border-white/30")}
                  >
                    Other
                  </button>
                </div>
                {isOtherRoleSelected && (
                  <div className="mt-3">
                    <input 
                      type="text" 
                      placeholder="Specify the role you are looking for" 
                      value={customRolesText} 
                      onChange={e => setCustomRolesText(e.target.value)} 
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#3B82F6] text-sm"
                    />
                    <p className="text-[10px] text-white/40 mt-1 pl-1">Examples: Legal Advisor, Hardware Engineer, Product Manager (comma separated)</p>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Builder Specific */}
          {currentUser.userType === 'builder' && (
            <section className="space-y-4 pt-4 border-t border-white/5">
              <h3 className="text-sm uppercase tracking-wider text-white/40 font-semibold">Builder Details</h3>

              <div>
                <label className="text-xs text-white/50 mb-1 block">Skills</label>
                <div className="flex flex-wrap gap-2">
                  {SKILLS_LIST.map(skill => {
                    const selected = formData.skills?.includes(skill);
                    return (
                      <button key={skill} type="button" onClick={() => updateForm({ skills: selected ? formData.skills?.filter(s => s !== skill) : [...(formData.skills || []), skill] })} className={cn("px-3 py-1.5 rounded-full border text-xs transition-all", selected ? "bg-[#14B8A6] text-white border-[#14B8A6]" : "bg-white/5 text-white/70 border-white/10 hover:border-white/30")}>
                        {skill}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-xs text-white/50 mb-1 block">GitHub URL</label>
                <input type="url" value={formData.github || ''} onChange={e => updateForm({ github: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#3B82F6]" />
              </div>
              
              <div>
                <label className="text-xs text-white/50 mb-1 block">Portfolio Website</label>
                <input type="url" value={formData.portfolio || ''} onChange={e => updateForm({ portfolio: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#3B82F6]" />
              </div>

              <div>
                <label className="text-xs text-white/50 mb-1 block">Resume URL</label>
                <input type="url" value={formData.resumeUrl || ''} onChange={e => updateForm({ resumeUrl: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#3B82F6]" />
              </div>

              <div>
                <label className="text-xs text-white/50 mb-1 block">Commitment / Availability</label>
                <input type="text" value={formData.commitment || ''} onChange={e => updateForm({ commitment: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#3B82F6]" placeholder="e.g. Full-time, Part-time, 10 hrs/week" />
              </div>
            </section>
          )}

        </div>

        <div className="sticky bottom-0 bg-[#0B1120] rounded-b-3xl border-t border-white/10 px-6 py-4 flex gap-3 z-10">
          <button 
             onClick={onClose}
             className="flex-1 py-3 rounded-xl border border-white/10 text-white/70 hover:bg-white/5 transition-colors font-medium text-sm"
          >
             Cancel
          </button>
          <button 
             disabled={isSaving || !formData.name || !formData.bio || (currentUser.userType === 'founder' && (!formData.startupName || !formData.startupStage))}
             onClick={handleSave}
             className="flex-1 py-3 rounded-xl bg-[#3B82F6] text-white hover:bg-blue-600 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50 text-sm"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
