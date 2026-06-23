export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          role: string | null
          created_at: string
        }
        Insert: {
          id: string
          email: string
          role?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          role?: string | null
          created_at?: string
        }
      }
      profiles: {
        Row: {
          user_id: string
          name: string
          photo_url: string | null
          bio: string | null
          city: string | null
          linkedin_url: string | null
        }
        Insert: {
          user_id: string
          name: string
          photo_url?: string | null
          bio?: string | null
          city?: string | null
          linkedin_url?: string | null
        }
        Update: {
          user_id?: string
          name?: string
          photo_url?: string | null
          bio?: string | null
          city?: string | null
          linkedin_url?: string | null
        }
      }
      founders: {
        Row: {
          user_id: string
          designation: string
          startup_name: string
          startup_stage: string
          startup_description: string | null
          industry: string | null
          looking_for: string[] | null
          website: string | null
          commitment: string | null
        }
        Insert: {
          user_id: string
          designation: string
          startup_name: string
          startup_stage: string
          startup_description?: string | null
          industry?: string | null
          looking_for?: string[] | null
          website?: string | null
          commitment?: string | null
        }
        Update: {
          user_id?: string
          designation?: string
          startup_name?: string
          startup_stage?: string
          startup_description?: string | null
          industry?: string | null
          looking_for?: string[] | null
          website?: string | null
          commitment?: string | null
        }
      }
      builders: {
        Row: {
          user_id: string
          college: string | null
          interests: string[] | null
          skills: string[] | null
          github_url: string | null
          leetcode_url: string | null
          portfolio_url: string | null
          resume_url: string | null
          current_projects: string | null
          commitment: string | null
        }
        Insert: {
          user_id: string
          college?: string | null
          interests?: string[] | null
          skills?: string[] | null
          github_url?: string | null
          leetcode_url?: string | null
          portfolio_url?: string | null
          resume_url?: string | null
          current_projects?: string | null
          commitment?: string | null
        }
        Update: {
          user_id?: string
          college?: string | null
          interests?: string[] | null
          skills?: string[] | null
          github_url?: string | null
          leetcode_url?: string | null
          portfolio_url?: string | null
          resume_url?: string | null
          current_projects?: string | null
          commitment?: string | null
        }
      }
      connections: {
        Row: {
          id: string
          sender_id: string
          receiver_id: string
          status: 'pending' | 'accepted' | 'rejected'
          created_at: string
          intro_message: string | null
        }
        Insert: {
          id?: string
          sender_id: string
          receiver_id: string
          status?: 'pending' | 'accepted' | 'rejected'
          created_at?: string
          intro_message?: string | null
        }
        Update: {
          id?: string
          sender_id?: string
          receiver_id?: string
          status?: 'pending' | 'accepted' | 'rejected'
          created_at?: string
          intro_message?: string | null
        }
      }
      messages: {
        Row: {
          id: string
          connection_id: string
          sender_id: string
          receiver_id: string
          message_text: string
          created_at: string
          read: boolean
        }
        Insert: {
          id?: string
          connection_id: string
          sender_id: string
          receiver_id: string
          message_text: string
          created_at?: string
          read?: boolean
        }
        Update: {
          id?: string
          connection_id?: string
          sender_id?: string
          receiver_id?: string
          message_text?: string
          created_at?: string
          read?: boolean
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
