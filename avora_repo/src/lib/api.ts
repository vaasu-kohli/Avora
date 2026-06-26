import { supabase } from './supabase';
import { UserProfile, UserType, ConnectionRequest, Message, Meeting } from '../types';

export const api = {
  async getProfile(userId: string): Promise<UserProfile | null> {
    try {
      const { data: userRow, error: uErr } = await supabase.from('users').select('*').eq('id', userId).single();
      if (uErr && uErr.code !== 'PGRST116') throw uErr; // Not found code is PGRST116
      if (!userRow) return null;

      const { data: profileRow, error: pErr } = await supabase.from('profiles').select('*').eq('user_id', userId).single();
      if (pErr && pErr.code !== 'PGRST116') throw pErr;
      if (!profileRow) return null;

      const userType = userRow.role as UserType;
      
      let finalProfile: UserProfile = {
        id: userId,
        userType,
        name: profileRow.name,
        photoUrl: profileRow.photo_url || '',
        college: profileRow.college || '',
        city: profileRow.city || '',
        linkedin: profileRow.linkedin_url || '',
        github: '',
        portfolio: '',
        bio: profileRow.bio || '',
        skills: [],
        interests: [],
        commitment: '',
      };

      if (userType === 'founder') {
        const { data: f, error: fErr } = await supabase.from('founders').select('*').eq('user_id', userId).single();
        if (fErr && fErr.code !== 'PGRST116') throw fErr;
        if (f) {
          finalProfile.designation = f.designation;
          finalProfile.startupName = f.startup_name;
          finalProfile.startupDescription = f.startup_description || '';
          finalProfile.problemSolved = f.startup_description || ''; // Mapping back for UI state
          finalProfile.industry = f.industry || '';
          finalProfile.startupStage = f.startup_stage;
          finalProfile.lookingFor = f.looking_for || [];
          finalProfile.website = f.website || '';
          finalProfile.equity = f.equity || '';
        }
      } else if (userType === 'builder') {
        const { data: b, error: bErr } = await supabase.from('builders').select('*').eq('user_id', userId).single();
        if (bErr && bErr.code !== 'PGRST116') throw bErr;
        if (b) {
          finalProfile.interests = b.interests || [];
          finalProfile.skills = b.skills || [];
          finalProfile.github = b.github_url || '';
          finalProfile.leetcode = b.leetcode_url || '';
          finalProfile.portfolio = b.portfolio_url || '';
          finalProfile.resumeUrl = b.resume_url || '';
          finalProfile.currentProjects = b.current_projects || '';
          finalProfile.commitment = b.commitment || '';
        }
      }

      return finalProfile;
    } catch(err) {
      console.error('[API] Error fetching profile:', err);
      // We throw the error so that the loader can handle real failures
      // instead of confusing them with "user does not exist".
      throw err;
    }
  },

  async getAllProfiles(): Promise<UserProfile[]> {
    try {
      const { data: users, error: usersErr } = await supabase.from('users').select('id, role');
      if (usersErr) {
        throw new Error(`Database error fetching users: ${usersErr.message} (Code: ${usersErr.code})`);
      }
      
      console.log(`[API Audit] 1. Raw users fetched from Supabase:`, users);
      
      if (!users) return [];

      console.log(`[API Audit] Total users fetched count: ${users.length}`);

      const profilesList: UserProfile[] = [];

      for (const u of users) {
        if (u.role && u.role !== 'none') {
          try {
            const p = await this.getProfile(u.id);
            if (p) profilesList.push(p);
          } catch(err) {
            console.error(`[API] Error fetching profile ${u.id}:`, err);
          }
        }
      }

      console.log(`[API Audit] 2. Raw profiles returned from getAllProfiles():`, profilesList);
      return profilesList;

    } catch(err) {
      console.error('[API] Fatal error in getAllProfiles:', err);
      // We only return [] if the users table fetch itself fails
      return [];
    }
  },

  async createProfile(profile: UserProfile): Promise<boolean> {
    try {
      console.log('[API] Saving profile to DB:', profile);
      const { error: userErr } = await supabase.from('users').upsert(
        { id: profile.id, role: profile.userType }, 
        { onConflict: 'id' }
      );
      if (userErr) throw new Error(`User update error: ${userErr.message}`);
      
      const profilePayload = {
        user_id: profile.id,
        name: profile.name,
        photo_url: profile.photoUrl,
        bio: profile.bio,
        city: profile.city || '',
        linkedin_url: profile.linkedin || '',
        college: profile.college || ''
      };
      console.log('[API] Saving to profiles table:', profilePayload);
      const { error: profileErr } = await supabase.from('profiles').upsert(profilePayload, { onConflict: 'user_id' });
      if (profileErr) throw new Error(`Profiles update error: ${profileErr.message}`);

      if (profile.userType === 'founder') {
        const founderPayload: any = {
          user_id: profile.id,
          designation: profile.designation || '',
          startup_name: profile.startupName || '',
          startup_description: profile.problemSolved || profile.startupDescription || '',
          startup_stage: profile.startupStage || '',
          industry: profile.industry || '',
          looking_for: profile.lookingFor || [],
          website: profile.website || ''
        };

        const payloadWithEquity = { ...founderPayload, equity: profile.equity || '' };
        console.log('[API] Saving to founders table (with equity):', payloadWithEquity);
        let { error: fErr } = await supabase.from('founders').upsert(payloadWithEquity, { onConflict: 'user_id' });
        
        if (fErr && fErr.message.includes('equity')) {
           console.warn('[API] Equity column missing in schema, retrying without it');
           console.log('[API] Saving to founders table (without equity):', founderPayload);
           const retry = await supabase.from('founders').upsert(founderPayload, { onConflict: 'user_id' });
           fErr = retry.error;
        }

        if (fErr) throw new Error(`Founders update error: ${fErr.message}`);
      } else {
        const builderPayload = {
          user_id: profile.id,
          interests: profile.interests || [],
          skills: profile.skills || [],
          github_url: profile.github || '',
          leetcode_url: profile.leetcode || '',
          portfolio_url: profile.portfolio || '',
          resume_url: profile.resumeUrl || '',
          current_projects: profile.currentProjects || '',
          commitment: profile.commitment || ''
        };
        console.log('[API] Saving to builders table:', builderPayload);
        const { error: bErr } = await supabase.from('builders').upsert(builderPayload, { onConflict: 'user_id' });
        if (bErr) throw new Error(`Builders update error: ${bErr.message}`);
      }
      console.log('[API] Profile saved successfully');
      return true;
    } catch(err) {
      console.error('[API] createProfile failed:', err);
      // throw it so we can see it in Onboarding instead of failing silently
      throw err;
    }
  },

  async getConnections(): Promise<ConnectionRequest[]> {
     const { data: user } = await supabase.auth.getUser();
     if (!user.user) return [];
     
     const { data } = await supabase.from('connections')
       .select('*')
       .or(`sender_id.eq.${user.user.id},receiver_id.eq.${user.user.id}`);
     
     if (!data) return [];
     return data.map((d: any) => ({
       id: d.id,
       fromUserId: d.sender_id,
       toUserId: d.receiver_id,
       status: d.status as any,
       introMessage: d.intro_message || undefined,
       createdAt: new Date(d.created_at).getTime()
     }));
  },

  async requestConnection(toUserId: string, introMessage?: string) {
     const { data: user } = await supabase.auth.getUser();
     if (!user.user) {
       console.log('[API] requestConnection - No authenticated user found');
       return null;
     }

     const { data: existing, error: existingErr } = await supabase.from('connections')
       .select('*')
       .or(`and(sender_id.eq.${user.user.id},receiver_id.eq.${toUserId}),and(sender_id.eq.${toUserId},receiver_id.eq.${user.user.id})`)
       .maybeSingle();

     if (existing) {
       console.log('[API] requestConnection - Connection already exists:', existing);
       return existing;
     }
     
     console.log(`[API] requestConnection - Inserting connection for sender ${user.user.id} to receiver ${toUserId}`);
     const { data, error } = await supabase.from('connections').insert({
       sender_id: user.user.id,
       receiver_id: toUserId,
       status: 'pending',
       intro_message: introMessage
     }).select().single();
     
     if (error) {
       console.error('[API] requestConnection error:', error);
       throw error;
     }
     console.log('[API] requestConnection - Insert successful:', data);

     // Notify Server
     fetch('/api/email-alerts/connection', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ recipientId: toUserId, senderId: user.user.id, introMessage })
     }).catch(console.error);

     return data;
  },

  async updateConnection(id: string, status: 'accepted' | 'rejected') {
     const { data, error } = await supabase.from('connections').update({ status }).eq('id', id).select().single();
     if (error) {
       console.error('[API] updateConnection error:', error);
       throw error;
     }

     if (status === 'accepted' && data) {
       fetch('/api/email-alerts/connection-accepted', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ recipientId: data.sender_id, accepterId: data.receiver_id })
       }).catch(console.error);
     }
  },

  async getMessages(): Promise<Message[]> {
     const { data: user } = await supabase.auth.getUser();
     if (!user.user) return [];

     const { data, error } = await supabase.from('messages')
       .select('*');
       
     if (error) {
       console.error('[API] getMessages error:', error);
       return [];
     }
     
     if (!data) return [];
     return data.map((m: any) => ({
       id: m.id,
       senderId: m.sender_id,
       receiverId: m.receiver_id,
       content: m.content || m.message_text,
       timestamp: new Date(m.timestamp || m.created_at).getTime(),
       read: m.read || false
     }));
  },

  async markMessagesAsRead(connectionId: string, userId: string) {
     const { error } = await supabase.from('messages')
       .update({ read: true })
       .eq('connection_id', connectionId)
       .eq('receiver_id', userId);
     
     if (error) {
       console.error('[API] markMessagesAsRead error:', error);
     }
  },

  async sendMessage(connectionId: string, toUserId: string, content: string) {
     console.log("STEP 1 - sendMessage entered");
     const { data: user } = await supabase.auth.getUser();
     if (!user.user) {
       console.log('[API] sendMessage - No authenticated user found');
       return null;
     }
     
     console.log(`[API] sendMessage - Inserting message for connection ${connectionId}, sender ${user.user.id}, receiver ${toUserId}`);
     const { data, error } = await supabase.from('messages').insert({
       connection_id: connectionId,
       sender_id: user.user.id,
       receiver_id: toUserId,
       content: content
     }).select().single();
     
     if (error) {
       console.error('[API] sendMessage error object full:', JSON.stringify(error, null, 2));
       console.error('[API] sendMessage error:', error);
       throw error;
     }
     console.log("STEP 2 - Message inserted");
     console.log('[API] sendMessage - Insert successful:', data);

     // Exclude meeting invites from general message notifications if needed
     if (!content.startsWith('[MEETING_INVITE]')) {
       console.log("STEP 3 - About to call /api/email-alerts/message");
       console.log('[API] Preparing to fetch /api/email-alerts/message');
       try {
         const res = await fetch('/api/email-alerts/message', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ recipientId: toUserId, senderId: user.user.id, content })
         });
         console.log("STEP 4 - Fetch completed", res.status);
         console.log('[API] fetch /api/email-alerts/message returned status:', res.status);
         const text = await res.text();
         console.log('[API] fetch /api/email-alerts/message response body:', text);
       } catch (err) {
         console.error('[API] fetch /api/email-alerts/message threw an error:', err);
       }
       console.log('[API] fetch /api/email-alerts/message has completed');
     } else {
       console.log('[API] Message content starts with [MEETING_INVITE], skipping /api/email-alerts/message');
     }

     return data;
  },

  async getMeetings(): Promise<Meeting[]> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return [];

    const { data } = await supabase.from('meetings')
      .select('*')
      .or(`founder_id.eq.${user.user.id},builder_id.eq.${user.user.id}`);
      
    if (!data) return [];
    
    return data.map((m: any) => ({
      id: m.id,
      connectionId: m.connection_id,
      founderId: m.founder_id,
      builderId: m.builder_id,
      meetDate: m.meet_date,
      meetTime: m.meet_time,
      status: m.status,
      createdAt: new Date(m.created_at).getTime()
    }));
  },

  async createMeeting(connectionId: string, builderId: string, date: string, time: string): Promise<Meeting | null> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      console.log('[API] createMeeting - No authenticated user found');
      return null;
    }
    
    console.log(`[API] createMeeting - Inserting meeting for connection ${connectionId}, founder ${user.user.id}, builder ${builderId}`);
    const { data, error } = await supabase.from('meetings').insert({
      connection_id: connectionId,
      founder_id: user.user.id,
      builder_id: builderId,
      meet_date: date,
      meet_time: time,
      status: 'pending'
    }).select().single();

    if (error) {
      console.error('[API] createMeeting error:', error);
      return null;
    }
    
    if (!data) return null;

    console.log('[API] createMeeting - Insert successful:', data);

    // Send a message directly indicating a meeting request so it appears in chat
    const meetingMessage = `[MEETING_INVITE]: I've proposed a meeting on ${date} at ${time}.`;
    await this.sendMessage(connectionId, builderId, meetingMessage);

    fetch('/api/email-alerts/meeting', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipientId: builderId, senderId: user.user.id, action: 'requested' })
    }).catch(console.error);

    return {
      id: data.id,
      connectionId: data.connection_id,
      founderId: data.founder_id,
      builderId: data.builder_id,
      meetDate: data.meet_date,
      meetTime: data.meet_time,
      status: data.status,
      createdAt: new Date(data.created_at).getTime()
    };
  },

  async updateMeeting(meetingId: string, status: 'accepted' | 'declined'): Promise<void> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return;
    
    const { data, error } = await supabase.from('meetings').update({ status }).eq('id', meetingId).select().single();
    if (error) {
      console.error('[API] updateMeeting error:', error);
      throw error;
    }

    if (data) {
      const recipientId = data.founder_id === user.user.id ? data.builder_id : data.founder_id;
      fetch('/api/email-alerts/meeting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientId, senderId: user.user.id, action: status })
      }).catch(console.error);
    }
  },

  async getNotificationSettings(): Promise<any> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return null;
    const { data } = await supabase.from('notification_settings').select('*').eq('user_id', user.user.id).single();
    return data || {
      connection_requests: true,
      messages: true,
      meetings: true,
      product_updates: true
    };
  },

  async updateNotificationSettings(settings: any): Promise<void> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return;
    await supabase.from('notification_settings').upsert({
      user_id: user.user.id,
      ...settings,
      updated_at: new Date().toISOString()
    });
  }
};
