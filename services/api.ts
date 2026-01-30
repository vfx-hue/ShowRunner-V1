import { Show, League, LeaguePeriod } from '../types';
import { supabase } from '../lib/supabase';

// --- Data Fetching from Supabase ---

export const fetchShowsFromSupabase = async (): Promise<Show[]> => {
  // Only fetch show details. Avoid fetching the entire viewership_data history 
  // until it's actually needed for a specific league or show view.
  const { data, error } = await supabase
    .from('shows')
    .select(`
      id,
      show_name,
      "Network/Streamer",
      type,
      "Next Episode Date",
      poster_url,
      imdb_rating,
      hype,
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
    // FIX: Category Detection (Case Insensitive)
    let category: 'cable' | 'streaming' = 'cable';
    if (s.type) {
      const lowerType = s.type.toLowerCase().trim();
      category = lowerType === 'streaming' ? 'streaming' : 'cable';
    } else {
      const streamingNetworks = ['Netflix', 'Hulu', 'Apple TV+', 'Prime Video', 'Disney+', 'Peacock', 'Max'];
      const network = s["Network/Streamer"] || '';
      category = streamingNetworks.includes(network) ? 'streaming' : 'cable';
    }

    return {
      id: s.id,
      title: s.show_name,
      network: s["Network/Streamer"] || 'N/A',
      category: category,
      nextEpisodeDate: s["Next Episode Date"] || 'TBD',
      description: '',
      projectedRating: 0,
      cumulativeRating: 0, // Will be calculated dynamically in league view
      lastPoints: 0,
      status: 'available',
      viewershipHistory: (s.viewership_data || []).map((v: any) => ({
        rating_date: v.rating_date,
        viewers: v.viewers
      })),
      posterUrl: s.poster_url,
      imdbRating: s.imdb_rating,
      hype: s.hype ? Number(s.hype) : 0
    };
  });
};

// NEW: Fetch specific viewership data for a set of shows to save Egress
export const fetchShowStatsForLeague = async (showIds: string[]): Promise<any[]> => {
  if (showIds.length === 0) return [];

  const { data, error } = await supabase
    .from('viewership_data')
    .select('show_id, rating_date, viewers')
    .in('show_id', showIds)
    .order('rating_date', { ascending: true });

  if (error) {
    console.error("Error fetching Targeted Stats:", error);
    return [];
  }
  return data;
};

export const fetchShowsFromSheet = async (): Promise<Show[]> => {
  // Deprecated, redirected to Supabase
  return fetchShowsFromSupabase();
};

// --- League & Picks ---

export const fetchLeaguePicks = async (leagueId: string, periodId?: string) => {
  let query = supabase
    .from('picks')
    .select('*')
    .eq('league_id', leagueId);

  if (periodId) {
    query = query.eq('period_id', periodId);
  }

  const { data, error } = await query;
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

export const getLeagueLeaderboard = async (leagueId: string, periodId?: string) => {
  let activePeriodId = periodId;
  let activePeriod: LeaguePeriod | null = null;

  if (!activePeriodId) {
    activePeriod = await getCurrentPeriod(leagueId);
    activePeriodId = activePeriod?.id;
  } else {
    const { data, error } = await supabase
      .from('league_periods')
      .select('*')
      .eq('id', activePeriodId)
      .maybeSingle();
    activePeriod = data;
  }

  if (!activePeriodId) return [];

  // 1.5 Fetch League Settings (for draft_start_time fallback if period is null)
  const { data: leagueDetail } = await supabase
    .from('leagues')
    .select('draft_start_time')
    .eq('id', leagueId)
    .single();

  const draftStartTime = activePeriod?.draft_start_time || leagueDetail?.draft_start_time || null;

  // 2. Fetch all picks for this period
  const { data: picks, error: picksError } = await supabase
    .from('picks')
    .select('user_id, show_id, show_name')
    .eq('league_id', leagueId)
    .eq('period_id', activePeriodId);

  if (picksError) {
    console.error("Error fetching picks for leaderboard:", picksError);
    return [];
  }

  if (!picks || picks.length === 0) return [];

  // 3. Fetch relevant shows and THEIR ENTIRE HISTORY for momentum/growth
  const showIds = [...new Set(picks.map((p: any) => p.show_id))];
  const { data: shows, error: showsError } = await supabase
    .from('shows')
    .select(`
      id, 
      show_name,
      "Network/Streamer", 
      type, 
      viewership_data (viewers, rating_date)
    `)
    .in('id', showIds);

  if (showsError) {
    console.error("Error fetching show stats for league:", showsError);
    return [];
  }

  // 4. Calculate Heat-Based Scores
  const userScores: Record<string, number> = {};

  const calculateMomentumScore = (show: any, draftTime: string | null) => {
    if (!show || !show.viewership_data || show.viewership_data.length === 0) return 0;

    // Sort history by date ascending for easier cumulative processing
    const history = [...show.viewership_data].sort((a, b) =>
      new Date(a.rating_date).getTime() - new Date(b.rating_date).getTime()
    );

    // Filter relevant entries (Day after draft)
    const validEntries = draftTime
      ? history.filter(h => {
        const ratingDate = new Date(h.rating_date);
        const draftDate = new Date(draftTime);
        // Set to start of day for inclusive comparison if needed, 
        // but user said "day after", so > is correct.
        return ratingDate.getTime() > draftDate.getTime();
      })
      : [history[history.length - 1]]; // Fallback to latest

    if (validEntries.length === 0) return 0;

    // Apply Network Multiplier logic
    let category: 'cable' | 'streaming' = 'cable';
    if (show.type) {
      const lowerType = show.type.toLowerCase().trim();
      category = lowerType === 'streaming' ? 'streaming' : 'cable';
    } else {
      const streamingNetworks = ['Netflix', 'Hulu', 'Apple TV+', 'Prime Video', 'Disney+', 'Peacock', 'Max'];
      const network = show["Network/Streamer"] || '';
      category = streamingNetworks.includes(network) ? 'streaming' : 'cable';
    }
    const multiplier = category === 'streaming' ? 1 : 1.5;

    let totalPoints = 0;

    validEntries.forEach((entry) => {
      // Find growth relative to the entry IMMEDIATELY PRECEDING THIS ONE in the FULL history
      const entryIdx = history.findIndex(h => h.rating_date === entry.rating_date);
      const previous = history[entryIdx - 1];

      let entryScore = entry.viewers || 0;

      // Heat Bonus (Growth %): Score = Current * (1 + GrowthRate)
      // Note: Previous entry can be BEFORE the draft
      if (previous && previous.viewers > 0 && entry.viewers > previous.viewers) {
        const growthRate = (entry.viewers - previous.viewers) / previous.viewers;
        entryScore = Math.floor(entryScore * (1 + growthRate));
      }

      totalPoints += entryScore;
    });

    return totalPoints * multiplier;
  };

  picks.forEach((pick: any) => {
    const show = shows.find((s: any) => s.id === pick.show_id);
    const showPoints = calculateMomentumScore(show, draftStartTime);

    if (!userScores[pick.user_id]) userScores[pick.user_id] = 0;
    userScores[pick.user_id] += showPoints;
  });

  // 5. Format and Sort
  const leaderboard = Object.keys(userScores).map(userId => ({
    user_id: userId,
    league_id: leagueId,
    adjusted_total_points: userScores[userId]
  }));

  return leaderboard.sort((a, b) => b.adjusted_total_points - a.adjusted_total_points);
};

export const getGlobalShowRankings = async () => {
  const { data: shows, error } = await supabase
    .from('shows')
    .select(`
      *,
      viewership_data (
        viewers
      )
    `);

  if (error) throw error;

  // Calculate cumulative viewership and sort
  const rankedShows = shows.map((s: any) => {
    // FIX: Category Detection (Case Insensitive)
    let category: 'cable' | 'streaming' = 'cable';
    if (s.type) {
      const lowerType = s.type.toLowerCase().trim();
      category = lowerType === 'streaming' ? 'streaming' : 'cable';
    } else {
      const streamingNetworks = ['Netflix', 'Hulu', 'Apple TV+', 'Prime Video', 'Disney+', 'Peacock', 'Max'];
      const network = s["Network/Streamer"] || '';
      category = streamingNetworks.includes(network) ? 'streaming' : 'cable';
    }

    // Calculate sum of viewers
    const multiplier = category === 'streaming' ? 1 : 1.5; // Use standard multiplier
    const totalViewers = (s.viewership_data || []).reduce((acc: number, curr: any) => acc + (curr.viewers || 0) * multiplier, 0);

    return {
      id: s.id,
      show_name: s.show_name,
      network: s["Network/Streamer"],
      category: category,
      next_episode_date: s["Next Episode Date"],
      poster_url: s.poster_url,
      imdb_rating: s.imdb_rating,
      hype: s.hype,
      cumulative_viewership: totalViewers
    };
  });

  // Sort descending by viewership
  return rankedShows.sort((a, b) => b.cumulative_viewership - a.cumulative_viewership);
};

export const getGlobalTeamRankings = async () => {
  // 1. Fetch All Picks
  const { data: allPicks, error: picksError } = await supabase
    .from('picks')
    .select('user_id, league_id, show_id, show_name');

  if (picksError) {
    console.error("Error fetching global picks:", picksError);
    return [];
  }

  // 2. Fetch Show Values
  const shows = await getGlobalShowRankings();

  // 3. Aggregate Scores by User+League
  // Key: "leagueId_userId" -> Value: points
  const scoresMap: Record<string, { user_id: string, league_id: string, adjusted_total_points: number }> = {};

  allPicks.forEach((pick: any) => {
    const key = `${pick.league_id}_${pick.user_id}`;

    // Find show points
    const show = shows.find((s: any) => s.id === pick.show_id || s.show_name === pick.show_name);
    const points = show ? show.cumulative_viewership : 0;

    if (!scoresMap[key]) {
      scoresMap[key] = {
        user_id: pick.user_id,
        league_id: pick.league_id,
        adjusted_total_points: 0
      };
    }
    scoresMap[key].adjusted_total_points += points;
  });

  const scores = Object.values(scoresMap);

  // Sort and Top 50
  scores.sort((a, b) => b.adjusted_total_points - a.adjusted_total_points);
  const topScores = scores.slice(0, 50);

  if (topScores.length === 0) return [];

  // 4. Fetch Metadata (Profiles & Leagues)
  const userIds = [...new Set(topScores.map(s => s.user_id))];
  const leagueIds = [...new Set(topScores.map(s => s.league_id))];

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, display_name, color, initials')
    .in('id', userIds);

  const { data: leagues } = await supabase
    .from('leagues')
    .select('id, name, max_members, cable_slots, streaming_slots')
    .in('id', leagueIds);

  // 5. Merge and calculate averages
  return topScores.map((score) => {
    const profile = profiles?.find(p => p.id === score.user_id);
    const league = leagues?.find(l => l.id === score.league_id);

    // Calculate normalized average (Total Points / (Cable + Streaming Slots))
    // Fallback to 6 slots if league settings aren't found
    const totalSlots = (league?.cable_slots || 3) + (league?.streaming_slots || 3);
    const averagePerShow = score.adjusted_total_points / totalSlots;

    return {
      ...score,
      average_per_show: averagePerShow,
      profiles: profile || { display_name: 'Unknown', color: '#cbd5e1', initials: '??' },
      leagues: league || { name: 'Unknown League' }
    };
  }).sort((a, b) => b.average_per_show - a.average_per_show); // Sort by average now
};

export const makePick = async (leagueId: string, userId: string, show: Show, isWaiver: boolean = false) => {
  const period = await getCurrentPeriod(leagueId);

  const { error } = await supabase
    .from('picks')
    .insert({
      league_id: leagueId,
      user_id: userId,
      show_id: show.id,
      show_name: show.title,
      is_waiver_add: isWaiver,
      period_id: period?.id
    });

  if (error) throw error;
};

export const dropShow = async (leagueId: string, userId: string, showId: string) => {
  const { error } = await supabase
    .from('picks')
    .delete()
    .eq('league_id', leagueId)
    .eq('user_id', userId)
    .eq('show_id', showId);

  if (error) throw error;
};

export const getWeeklyAddCount = async (leagueId: string, userId: string) => {
  // Simple check: count waiver adds since start of week
  // For simplicity, we'll just count all is_waiver_add=true for now, 
  // but in a real app you'd filter by created_at > start_of_week
  const { count, error } = await supabase
    .from('picks')
    .select('*', { count: 'exact', head: true })
    .eq('league_id', leagueId)
    .eq('user_id', userId)
    .eq('is_waiver_add', true);

  if (error) throw error;
  return count || 0;
};

export const getLatestWaiverAdd = async (leagueId: string, userId: string) => {
  const { data, error } = await supabase
    .from('picks')
    .select('created_at')
    .eq('league_id', leagueId)
    .eq('user_id', userId)
    .eq('is_waiver_add', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data?.created_at || null;
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
      cable_slots: 3,
      streaming_slots: 3,
      waiver_type: 'rolling_priority',
      max_adds_per_week: 3,
      waiver_cooldown_days: 7,
      redraft_every_period: true
    })
    .select()
    .single();

  if (leagueError) throw leagueError;

  // IMPORTANT: Create the first period for this league
  const monthYear = new Date().toISOString().slice(0, 7); // YYYY-MM
  await createLeaguePeriod(league.id, monthYear, 'drafting', draftStartTime);

  const { error: memberError } = await supabase
    .from('league_members')
    .insert({ league_id: league.id, user_id: userId });

  if (memberError) {
    if (!memberError.message.includes('duplicate key')) throw memberError;
  }

  return {
    ...league,
    code: league.invite_code || code
  };
};

// --- League Period Management ---

export const createLeaguePeriod = async (leagueId: string, monthYear: string, status: 'drafting' | 'active' | 'finished' = 'drafting', draftStartTime?: string, copyRostersFromPeriodId?: string) => {
  const { data: period, error } = await supabase
    .from('league_periods')
    .insert({
      league_id: leagueId,
      month_year: monthYear,
      status,
      draft_start_time: draftStartTime
    })
    .select()
    .single();

  if (error) throw error;

  // Update league's current_period_id
  await supabase
    .from('leagues')
    .update({ current_period_id: period.id })
    .eq('id', leagueId);

  // Handle Roster Carry-over if requested
  if (copyRostersFromPeriodId) {
    const { data: oldPicks } = await supabase
      .from('picks')
      .select('user_id, show_id, show_name, is_waiver_add')
      .eq('league_id', leagueId)
      .eq('period_id', copyRostersFromPeriodId);

    if (oldPicks && oldPicks.length > 0) {
      const newPicks = oldPicks.map(p => ({
        ...p,
        league_id: leagueId,
        period_id: period.id
      }));
      await supabase.from('picks').insert(newPicks);
    }
  }

  return period;
};

export const fetchLeaguePeriods = async (leagueId: string): Promise<LeaguePeriod[]> => {
  const { data, error } = await supabase
    .from('league_periods')
    .select('*')
    .eq('league_id', leagueId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

export const getCurrentPeriod = async (leagueId: string): Promise<LeaguePeriod | null> => {
  // Try to find the latest active/drafting period
  const { data, error } = await supabase
    .from('league_periods')
    .select('*')
    .eq('league_id', leagueId)
    .in('status', ['active', 'drafting'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Error fetching current period:", error);
    return null;
  }
  return data;
};

export const updatePeriodStatus = async (periodId: string, status: 'drafting' | 'active' | 'finished') => {
  const { error } = await supabase
    .from('league_periods')
    .update({ status })
    .eq('id', periodId);

  if (error) throw error;
};

export const updateLeague = async (leagueId: string, updates: Partial<League>) => {
  const { error } = await supabase
    .from('leagues')
    .update(updates)
    .eq('id', leagueId);

  if (error) throw error;
};

export const getLeagueCareerStats = async (leagueId: string) => {
  const { data: periods } = await supabase
    .from('league_periods')
    .select('id')
    .eq('league_id', leagueId)
    .eq('status', 'finished');

  if (!periods || periods.length === 0) return {};

  const careerStats: Record<string, { total_points: number, ranks: number[] }> = {};

  // For each finished period, get the leaderboard to see points and ranks
  for (const period of periods) {
    try {
      const leaderboard = await getLeagueLeaderboard(leagueId, period.id);
      leaderboard.forEach((entry, index) => {
        if (!careerStats[entry.user_id]) {
          careerStats[entry.user_id] = { total_points: 0, ranks: [] };
        }
        careerStats[entry.user_id].total_points += entry.adjusted_total_points;
        careerStats[entry.user_id].ranks.push(index + 1);
      });
    } catch (e) {
      console.error(`Error processing period ${period.id}:`, e);
    }
  }

  const finalStats: Record<string, { total_points: number, avg_finish: number }> = {};
  Object.keys(careerStats).forEach(uid => {
    const s = careerStats[uid];
    finalStats[uid] = {
      total_points: s.total_points,
      avg_finish: s.ranks.length > 0 ? s.ranks.reduce((a, b) => a + b, 0) / s.ranks.length : 0
    };
  });

  return finalStats;
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

export const removeLeagueMember = async (leagueId: string, userId: string) => {
  // 1. Delete member's picks for this league
  const { error: picksError } = await supabase
    .from('picks')
    .delete()
    .eq('league_id', leagueId)
    .eq('user_id', userId);

  if (picksError) throw picksError;

  // 2. Remove member from the league
  const { error: memberError } = await supabase
    .from('league_members')
    .delete()
    .eq('league_id', leagueId)
    .eq('user_id', userId);

  if (memberError) throw memberError;
};

export const deleteLeague = async (leagueId: string) => {
  // 1. Delete all picks for this league
  const { error: picksError } = await supabase
    .from('picks')
    .delete()
    .eq('league_id', leagueId);

  if (picksError) throw picksError;

  // 2. Delete all members for this league
  const { error: membersError } = await supabase
    .from('league_members')
    .delete()
    .eq('league_id', leagueId);

  if (membersError) throw membersError;

  // 3. Delete the league itself
  const { error: leagueError } = await supabase
    .from('leagues')
    .delete()
    .eq('id', leagueId);

  if (leagueError) throw leagueError;
};

export const fetchUserLeagues = async (userId: string) => {
  const { data, error } = await supabase
    .from('league_members')
    .select('leagues(*)')
    .eq('user_id', userId);

  if (error) throw error;

  const leagues = data.map((d: any) => ({
    ...d.leagues,
    code: d.leagues.invite_code || d.leagues.code // Map invite_code to frontend 'code' property
  }));

  // Enrichment: Get basic stats for each league to show on onboarding cards
  const enriched = await Promise.all(leagues.map(async (l: any) => {
    try {
      const leaderboard = await getLeagueLeaderboard(l.id);
      const userStats = leaderboard.find((s: any) => s.user_id === userId);

      // Get Top 3 for "Standings" preview
      // We need profiles for them
      const top3 = leaderboard.slice(0, 3);
      const top3Ids = top3.map(t => t.user_id);
      const { data: top3Profiles } = await supabase.from('profiles').select('id, initials, color').in('id', top3Ids);

      const top3WithProfiles = top3.map(t => ({
        ...t,
        profile: top3Profiles?.find(p => p.id === t.user_id) || { initials: '??', color: '#cbd5e1' }
      }));

      return {
        ...l,
        userPoints: userStats ? userStats.adjusted_total_points : 0,
        userRank: leaderboard.findIndex((s: any) => s.user_id === userId) + 1,
        totalTeams: leaderboard.length,
        top3: top3WithProfiles
      };
    } catch (e) {
      return l;
    }
  }));

  return enriched;
};

export const addShow = async (show: Partial<Show>) => {
  const { data, error } = await supabase
    .from('shows')
    .insert({
      show_name: show.title,
      "Network/Streamer": show.network,
      type: show.category,
      "Next Episode Date": show.nextEpisodeDate,
      poster_url: show.posterUrl,
      imdb_rating: show.imdbRating,
      hype: show.hype
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

// --- Profile & User Settings ---

export const fetchProfile = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      if (error.code === 'PGRST116' || error.message.includes('not found')) return null;
      console.error("Error fetching profile:", error.message);
      return null;
    }
    return data;
  } catch (e) {
    return null;
  }
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

  // Sync to Auth Metadata to ensure synchronization "from both sides"
  const authUpdates: any = {};
  if (updates.email) authUpdates.email = updates.email;

  // Sync display_name and color to user_metadata
  const metadata: any = {};
  if (updates.display_name) metadata.display_name = updates.display_name;
  if (updates.color) metadata.color = updates.color;
  if (updates.initials) metadata.initials = updates.initials;

  if (Object.keys(metadata).length > 0) {
    authUpdates.data = metadata;
  }

  if (Object.keys(authUpdates).length > 0) {
    const { error: authError } = await supabase.auth.updateUser(authUpdates);
    if (authError) throw authError;
  }
};