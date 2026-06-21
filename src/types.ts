export type UserType = 'founder' | 'builder';
export type ConnectionStatus = 'pending' | 'accepted' | 'rejected';

export interface UserProfile {
  id: string;
  userType: UserType;
  name: string;
  photoUrl: string;
  college: string;
  city: string;
  linkedin: string;
  github: string;
  portfolio: string;
  bio: string;
  skills: string[];
  interests: string[];
  commitment: string;
  
  // Builder specific
  leetcode?: string;
  resumeUrl?: string;
  currentProjects?: string;

  // Founder specific
  designation?: string;
  startupName?: string;
  startupDescription?: string;
  problemSolved?: string;
  industry?: string;
  startupStage?: string;
  lookingFor?: string[];
  website?: string;
}

export interface ConnectionRequest {
  id: string;
  fromUserId: string;
  toUserId: string;
  status: ConnectionStatus;
  introMessage?: string;
  createdAt: number;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: number;
  read: boolean;
}

export interface Meeting {
  id: string;
  connectionId: string;
  founderId: string;
  builderId: string;
  meetDate: string;
  meetTime: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: number;
}
