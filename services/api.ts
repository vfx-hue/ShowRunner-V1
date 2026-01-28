import { Show, League } from '../types';
import { supabase } from '../lib/supabase';

// --- Data Fetching from Supabase ---

export const fetchShowsFromSupabase = async (): Promise<Show[]> => {
  // fetch shows and join viewership_data
  const { data, error } = await supabase
    .from('shows')
    .select(`
      id,
      show_name,
      network,
      type,
      release_date,
      poster_url,
      imdb_rating,
      viewership_data (
        rating_date,
        viewers
      )
    `);

  if (error) {
    console.error("Error fetching shows:", error);
    return [];
  }

  return data.map((s: any) => {
    const history = s.viewership_data || [];
    // Sort by date ascending for charts
    history.sort((a: any, b: any) => new Date(a.rating_date).getTime() - new Date(b.rating_date).getTime());

    // Scoring: Sum of all viewers in viewership_data
    const totalViewers = history.reduce((sum: number, entry: any) => sum + (entry.viewers || 0), 0);
    const lastEntry = history[history.length - 1];

    // FIX: Category Detection (Case Insensitive)
    let category: 'cable' | 'streaming' = 'cable';

    if (s.type) {
      const lowerType = s.type.toLowerCase().trim();
      if (lowerType === 'streaming') {
        category = 'streaming';
      } else {
        // Default to cable if type exists but isn't streaming (e.g. 'cable', 'broadcast')
        category = 'cable';
      }
    } else {
      // Fallback if type is null
      const streamingNetworks = ['Netflix', 'Hulu', 'Apple TV+', 'Prime Video', 'Disney+', 'Peacock', 'Max'];
      category = streamingNetworks.includes(s.network) ? 'streaming' : 'cable';
    }

    // FIX: Date Parsing (Handle "Already Aired" or Invalid Dates)
    let premiereDate = 'TBD';
    if (s.release_date) {
      const rawDate = s.release_date.toString();
      // Check if it's a special text status
      if (rawDate.toLowerCase().includes('already aired')) {
        premiereDate = 'Already Aired';
      } else {
        // Try parsing as date
        const date = new Date(rawDate);
        if (!isNaN(date.getTime())) {
          premiereDate = date.toLocaleDateString();
        } else {
          // If invalid date format (e.g. "Fall 2026"), use the raw string
          premiereDate = rawDate;
        }
      }
    }

    return {
      id: s.id,
      title: s.show_name,
      network: s.network || 'N/A',
      category: category,
      premiereDate: premiereDate,
      description: '',
      projectedRating: 0,
      cumulativeRating: totalViewers,
      lastPoints: lastEntry ? lastEntry.viewers : 0,
      status: 'available',
      viewershipHistory: history,
      posterUrl: s.poster_url,
      imdbRating: s.imdb_rating
    };
  });
};

export const fetchShowsFromSheet = async (): Promise<Show[]> => {
  // Deprecated, redirected to Supabase
  return fetchShowsFromSupabase();
};

// --- League & Picks ---

export const fetchLeaguePicks = async (leagueId: string) => {
  const { data, error } = await supabase
    .from('picks')
    .select('*')
    .eq('league_id', leagueId);

  if (error) throw error;
  return data;
};

export const fetchLeagueMembers = async (leagueId: string) => {
  // IMPORTANT: Order by created_at to ensure the "Snake Draft" order is consistent for all users
  const { data, error } = await supabase
    .from('league_members')
    .select('user_id')
    .eq('league_id', leagueId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data.map(m => m.user_id);
}

export const getLeagueLeaderboard = async (leagueId: string) => {
  const { data, error } = await supabase
    .from('adjusted_league_scores')
    .select('*')
    .eq('league_id', leagueId)
    .order('adjusted_total_points', { ascending: false });

  if (error) {
    console.error("Error fetching league leaderboard view:", error);
    return [];
  }
  return data;
};

export const getGlobalShowRankings = async () => {
  const { data, error } = await supabase
    .from('show_power_rankings')
    .select('*')
    .order('cumulative_viewership', { ascending: false });

  if (error) throw error;
  return data;
};

export const makePick = async (leagueId: string, userId: string, show: Show) => {
  const { error } = await supabase
    .from('picks')
    .insert({
      league_id: leagueId,
      user_id: userId,
      show_id: show.id,
      show_name: show.title
    });

  if (error) throw error;
};

export const createLeague = async (userId: string, name: string, draftStartTime: string) => {
  const code = Math.floor(100000 + Math.random() * 900000).toString();

  const { data: league, error: leagueError } = await supabase
    .from('leagues')
    .insert({
      name,
      invite_code: code,
      created_by: userId,
      draft_start_time: draftStartTime,
      max_members: 4,
      cable_slots: 3, // Default
      streaming_slots: 3, // Default
      network_multiplier: 1.5, // Default
      waiver_type: 'rolling' // Default
    })
    .select()
    .single();

  if (leagueError) throw leagueError;

  const { error: memberError } = await supabase
    .from('league_members')
    .insert({ league_id: league.id, user_id: userId });

  if (memberError) throw memberError;

  return {
    ...league,
    code: league.invite_code || code
  };
};

export const updateLeague = async (leagueId: string, updates: Partial<League>) => {
  const { error } = await supabase
    .from('leagues')
    .update(updates)
    .eq('id', leagueId);

  if (error) throw error;
};

export const joinLeague = async (userId: string, code: string) => {
  // Check invite_code instead of code
  const { data: league, error: leagueError } = await supabase
    .from('leagues')
    .select('*')
    .eq('invite_code', code)
    .single();

  if (leagueError || !league) throw new Error("League not found. Check the code and try again.");

  // Check if league is full
  const { count, error: countError } = await supabase
    .from('league_members')
    .select('*', { count: 'exact', head: true })
    .eq('league_id', league.id);

  if (countError) throw countError;

  const maxMembers = league.max_members || 4;

  if (count !== null && count >= maxMembers) {
    throw new Error(`This league is full (${maxMembers}/${maxMembers} members).`);
  }

  const { error: joinError } = await supabase
    .from('league_members')
    .insert({ league_id: league.id, user_id: userId });

  if (joinError) {
    if (!joinError.message.includes('duplicate key')) throw joinError;
  }

  return {
    ...league,
    code: league.invite_code
  };
};

export const fetchUserLeagues = async (userId: string) => {
  const { data, error } = await supabase
    .from('league_members')
    .select('leagues(*)')
    .eq('user_id', userId);

  if (error) throw error;

  return data.map((d: any) => ({
    ...d.leagues,
    code: d.leagues.invite_code || d.leagues.code // Map invite_code to frontend 'code' property
  }));
};

export const addShow = async (show: Partial<Show>) => {
  const { data, error } = await supabase
    .from('shows')
    .insert({
      show_name: show.title,
      network: show.network,
      type: show.category,
      release_date: show.premiereDate,
      poster_url: show.posterUrl,
      imdb_rating: show.imdbRating
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

// --- Profile & User Settings ---

export const fetchProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    // If profile doesn't exist, we might want to create one on the fly
    // but the trigger should handle it. For safety, return null.
    console.error("Error fetching profile:", error);
    return null;
  }
  return data;
};

export const fetchProfiles = async (userIds: string[]) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .in('id', userIds);

  if (error) {
    console.error("Error fetching profiles:", error);
    return [];
  }
  return data;
};

export const updateProfile = async (userId: string, updates: any) => {
  const { error } = await supabase
    .from('profiles')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (error) throw error;

  // If email is updated, we also need to update it in Supabase Auth
  if (updates.email) {
    const { error: authError } = await supabase.auth.updateUser({ email: updates.email });
    if (authError) throw authError;
  }
};