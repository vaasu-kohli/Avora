import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, ConnectionRequest, Message, Meeting } from '../types';
import { supabase } from '../lib/supabase';
import { api } from '../lib/api';

interface AppContextType {
  currentUser: UserProfile | null;
  setCurrentUser: (user: UserProfile | null) => void;
  profiles: UserProfile[];
  connections: ConnectionRequest[];
  sendConnectionRequest: (toUserId: string, introMessage?: string) => Promise<void>;
  updateConnectionStatus: (requestId: string, status: 'accepted' | 'rejected') => Promise<void>;
  messages: Message[];
  sendMessage: (connectionId: string, toUserId: string, content: string) => Promise<void>;
  meetings: Meeting[];
  createMeeting: (connectionId: string, builderId: string, date: string, time: string) => Promise<void>;
  updateMeetingStatus: (meetingId: string, status: 'accepted' | 'declined') => Promise<void>;
  markSeen: (userId: string) => void;
  seenProfiles: string[];
  isLoading: boolean;
  logout: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [connections, setConnections] = useState<ConnectionRequest[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [seenProfiles, setSeenProfiles] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        loadData(session.user.id);
      } else {
        setIsLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        loadData(session.user.id);
      } else {
        setCurrentUser(null);
        setProfiles([]);
        setConnections([]);
        setMessages([]);
        setMeetings([]);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!currentUser) return;

    // Realtime subscriptions
    const connSub = supabase.channel('connections')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'connections' }, () => {
        api.getConnections().then(setConnections);
      }).subscribe();

    const msgSub = supabase.channel('messages')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => {
        api.getMessages().then(setMessages);
      }).subscribe();

    const meetSub = supabase.channel('meetings')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'meetings' }, () => {
        api.getMeetings().then(setMeetings);
      }).subscribe();

    return () => {
      connSub.unsubscribe();
      msgSub.unsubscribe();
      meetSub.unsubscribe();
    };
  }, [currentUser]);

  const loadData = async (userId: string) => {
    try {
      setIsLoading(true);
      const profile = await api.getProfile(userId);
      if (profile) setCurrentUser(profile);

      const allProfiles = await api.getAllProfiles();
      setProfiles(allProfiles);

      const conns = await api.getConnections();
      setConnections(conns);

      const msgs = await api.getMessages();
      setMessages(msgs);

      const meets = await api.getMeetings();
      setMeetings(meets);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  const sendConnectionRequest = async (toUserId: string, introMessage?: string) => {
    try {
      await api.requestConnection(toUserId, introMessage);
      const conns = await api.getConnections();
      setConnections(conns);
    } catch (err) {
      console.error("Failed to send request", err);
    }
  };

  const updateConnectionStatus = async (requestId: string, status: 'accepted' | 'rejected') => {
    try {
      await api.updateConnection(requestId, status);
      const conns = await api.getConnections();
      setConnections(conns);
    } catch (err) {
      console.error("Failed to update status", err);
    }
  };

  const sendMessage = async (connectionId: string, toUserId: string, content: string) => {
    try {
      await api.sendMessage(connectionId, toUserId, content);
      const msgs = await api.getMessages();
      setMessages(msgs);
    } catch (err) {
      console.error("Failed to send message", err);
    }
  };

  const createMeeting = async (connectionId: string, builderId: string, date: string, time: string) => {
    try {
      await api.createMeeting(connectionId, builderId, date, time);
      const meets = await api.getMeetings();
      setMeetings(meets);
      const msgs = await api.getMessages();
      setMessages(msgs);
    } catch (err) {
      console.error(err);
    }
  };

  const updateMeetingStatus = async (meetingId: string, status: 'accepted' | 'declined') => {
    try {
      await api.updateMeeting(meetingId, status);
      const meets = await api.getMeetings();
      setMeetings(meets);
    } catch (err) {
      console.error(err);
    }
  };

  const markSeen = (userId: string) => {
    if (!seenProfiles.includes(userId)) {
      setSeenProfiles(prev => [...prev, userId]);
    }
  };

  return (
    <AppContext.Provider value={{
      currentUser,
      setCurrentUser,
      profiles,
      connections,
      sendConnectionRequest,
      updateConnectionStatus,
      messages,
      sendMessage,
      meetings,
      createMeeting,
      updateMeetingStatus,
      markSeen,
      seenProfiles,
      isLoading,
      logout
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}

