export interface ViewershipEntry {
  rating_date: string;
  viewers: number;
}

export interface Show {
  id: string; // UUID from Supabase
  title: string;
  network: string;
  category: 'cable' | 'streaming';
  nextEpisodeDate?: string; // Maps from "Next Episode Date"
  description: string;
  projectedRating: number;
  cumulativeRating: number;
  lastPoints: number;
  status: 'available' | 'drafted';
  draftedBy?: string; // user_id
  viewershipHistory?: ViewershipEntry[];

  // New Fields
  posterUrl?: string;
  imdbRating?: number;
  hype?: number; // Maps from "Hype"
}

export interface Team {
  id: string; // user_id
  name: string; // User email or display name
  owner: string;
  initials: string;
  color: string;
  roster: Show[];
  totalPoints: number;
}

export const STANDARD_NETWORK_MULTIPLIER = 1.5;

export interface League {
  id: string;
  name: string;
  code: string;
  draft_start_time: string; // ISO String
  created_by: string;
  members?: string[]; // Array of user IDs or detailed member objects
  max_members?: number;

  // Settings
  cable_slots: number;
  streaming_slots: number;
  waiver_type: 'rolling' | 'faab' | 'fcfs';
}

export interface UserProfile {
  id: string;
  display_name: string;
  email: string;
  avatar_url?: string;
  color: string;
  initials: string;
}

export type ViewState = 'AUTH' | 'ONBOARDING' | 'DASHBOARD' | 'LEAGUE' | 'DRAFT' | 'WAITING_ROOM' | 'LEADERBOARD' | 'ADMIN' | 'PROFILE';