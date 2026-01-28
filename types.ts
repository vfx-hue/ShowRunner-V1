export interface ViewershipEntry {
  rating_date: string;
  viewers: number;
}

export interface Show {
  id: string; // UUID from Supabase
  title: string;
  network: string;
  category: 'cable' | 'streaming';
  premiereDate: string;
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
  network_multiplier: number;
  waiver_type: 'rolling' | 'faab' | 'fcfs';
}

export type ViewState = 'AUTH' | 'ONBOARDING' | 'DASHBOARD' | 'LEAGUE' | 'DRAFT' | 'WAITING_ROOM' | 'LEADERBOARD' | 'ADMIN';