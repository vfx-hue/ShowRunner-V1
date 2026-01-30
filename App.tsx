import React, { useState, useEffect, useMemo } from 'react';
import { Show, Team, ViewState, League, STANDARD_NETWORK_MULTIPLIER } from './types';
import * as api from './services/api';
import { supabase } from './lib/supabase';
import Navbar from './components/Navbar';
import LeagueView from './components/LeagueView';
import Auth from './components/Auth';
import LeagueOnboarding from './components/LeagueOnboarding';
import DraftBoard from './components/DraftBoard';
import LeagueWaitingRoom from './components/LeagueWaitingRoom';
import ShowDetailsModal from './components/ShowDetailsModal';
import Standings from './components/Standings';
import Leaderboard from './components/Leaderboard';
import GlobalTeamLeaderboard from './components/GlobalTeamLeaderboard';
import Profile from './components/Profile';
import WaiverTransactionModal from './components/WaiverTransactionModal';
import HowToPlay from './components/HowToPlay';
import { UserProfile } from './types';
import { Loader2, ChevronDown } from 'lucide-react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate,
  useLocation,
  Navigate,
  useParams
} from 'react-router-dom';

const TEAM_COLORS = ["#6366f1", "#8b5cf6", "#ec4899", "#10b981", "#f59e0b", "#3b82f6"];

// Helper for legacy invite redirects
const InviteRedirect: React.FC = () => {
  const { inviteCode } = useParams<{ inviteCode: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    if (inviteCode) {
      console.log("Redirecting legacy invite:", inviteCode);
      localStorage.setItem('pending_league_invite', inviteCode);
      navigate('/', { replace: true });
    }
  }, [inviteCode, navigate]);

  return (
    <div className="h-screen flex items-center justify-center bg-gray-50 text-slate-400">
      Redirecting invite...
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <AppContent />
    </Router>
  );
};

const AppContent: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [session, setSession] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);

  // Deprecated: view state is now handled by URL
  const [view, setViewInternal] = useState<ViewState>('AUTH');

  // Backward compatibility wrapper
  const setView = (v: ViewState) => {
    setViewInternal(v);
    if (v === 'AUTH') navigate('/auth');
    else if (v === 'ONBOARDING') navigate('/');
    else if (v === 'DASHBOARD' && currentLeague) navigate(`/league/${currentLeague.id}/dashboard`);
    else if (v === 'LEAGUE' && currentLeague) navigate(`/league/${currentLeague.id}`);
    else if (v === 'DRAFT' && currentLeague) navigate(`/league/${currentLeague.id}/draft`);
    else if (v === 'WAITING_ROOM' && currentLeague) navigate(`/league/${currentLeague.id}/waiting`);
    else if (v === 'LEADERBOARD') navigate('/leaderboard');
    else if (v === 'GLOBAL_TEAMS') navigate('/global');
    else if (v === 'PROFILE') navigate('/profile');
    else if (v === 'HOW_TO_PLAY') navigate('/how-to-play');
  };
  const [currentLeague, setCurrentLeague] = useState<League | null>(null);
  const [leagueMemberCount, setLeagueMemberCount] = useState<number>(0);
  const [userLeagues, setUserLeagues] = useState<League[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [shows, setShows] = useState<Show[]>([]);
  const [recentPicks, setRecentPicks] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [joiningLeague, setJoiningLeague] = useState(false);
  const [weeklyMovesCount, setWeeklyMovesCount] = useState<number>(0);
  const [lastWaiverAddDate, setLastWaiverAddDate] = useState<string | null>(null);

  // Show Details Modal State
  const [selectedShow, setSelectedShow] = useState<Show | null>(null);

  // Waiver Modal State
  const [showWaiverModal, setShowWaiverModal] = useState(false);
  const [waiverShowToAdd, setWaiverShowToAdd] = useState<Show | null>(null);

  // Draft Logic State
  const [orderedMemberIds, setOrderedMemberIds] = useState<string[]>([]);
  const [periods, setPeriods] = useState<any[]>([]);
  const [selectedPeriodId, setSelectedPeriodId] = useState<string | null>(null);
  const [careerStats, setCareerStats] = useState<Record<string, { total_points: number, avg_finish: number }>>({});

  // Roster View State (Sidebar)
  const [viewingRosterId, setViewingRosterId] = useState<string>("");

  // --- SNAKE DRAFT HELPER ---
  const getManagerAtPick = (pickIndex: number, totalManagers: number, managersArray: string[]) => {
    if (totalManagers === 0) return null;
    const round = Math.ceil(pickIndex / totalManagers);
    const isReversed = round % 2 === 0;
    const positionInRound = (pickIndex - 1) % totalManagers;

    return isReversed
      ? managersArray[totalManagers - 1 - positionInRound]
      : managersArray[positionInRound];
  };

  const currentDrafterInfo = useMemo(() => {
    if (orderedMemberIds.length === 0) return { id: null, name: 'Unknown' };

    // Pick Index starts at 1
    const nextPickIndex = recentPicks.length + 1;
    const drafterId = getManagerAtPick(nextPickIndex, orderedMemberIds.length, orderedMemberIds);

    // Find Team Name
    const team = teams.find(t => t.id === drafterId);
    return {
      id: drafterId,
      name: team ? team.name : 'Loading...'
    };
  }, [recentPicks.length, orderedMemberIds, teams]);

  const isDraftOver = useMemo(() => {
    if (!currentLeague || orderedMemberIds.length === 0) return false;

    // 1. If we've filled all slots, it's over
    const maxSlots = (currentLeague.cable_slots || 3) + (currentLeague.streaming_slots || 3);
    const totalPossiblePicks = orderedMemberIds.length * maxSlots;
    if (recentPicks.length >= totalPossiblePicks) return true;

    // 2. If any pick is explicitly a waiver add, it's over
    if (recentPicks.some(p => p.is_waiver_add)) return true;

    // 3. If it's been more than 12 hours since the draft started, assume it's over/in FA
    if (currentLeague.draft_start_time) {
      const startTime = new Date(currentLeague.draft_start_time).getTime();
      const now = new Date().getTime();
      if (now > startTime + (12 * 60 * 60 * 1000)) return true;
    }

    return false;
  }, [currentLeague, orderedMemberIds, recentPicks]);

  const cooldownExpiresAt = useMemo(() => {
    if (!lastWaiverAddDate || !currentLeague?.waiver_cooldown_days) return null;
    const cooldownMs = (currentLeague.waiver_cooldown_days || 7) * 24 * 60 * 60 * 1000;
    const lastAdd = new Date(lastWaiverAddDate).getTime();
    const expiresAt = lastAdd + cooldownMs;
    const now = new Date().getTime();

    return now < expiresAt ? expiresAt : null;
  }, [lastWaiverAddDate, currentLeague?.waiver_cooldown_days]);

  const picksUntilTurn = useMemo(() => {
    if (isDraftOver || orderedMemberIds.length === 0 || !session?.user?.id) return 0;

    const nextPickIndex = recentPicks.length + 1;
    const myId = session.user.id;
    let lookAhead = 0;
    const maxSlots = (currentLeague?.cable_slots ?? 3) + (currentLeague?.streaming_slots ?? 3);
    const totalPossiblePicks = orderedMemberIds.length * maxSlots;

    while (lookAhead < totalPossiblePicks - recentPicks.length) {
      const drafterId = getManagerAtPick(nextPickIndex + lookAhead, orderedMemberIds.length, orderedMemberIds);
      if (drafterId === myId) return lookAhead;
      lookAhead++;
    }

    return lookAhead;
  }, [recentPicks.length, orderedMemberIds, session?.user?.id, currentLeague, isDraftOver]);

  const isMyTurn = useMemo(() => {
    if (isDraftOver) return true; // Anyone can move in free agency
    return session?.user?.id === currentDrafterInfo.id;
  }, [isDraftOver, session?.user?.id, currentDrafterInfo.id]);



  // 1. Check for invite code in URL on app mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const inviteCode = params.get('league');
    if (inviteCode) {
      console.log("Found invite code in URL:", inviteCode);
      localStorage.setItem('pending_league_invite', inviteCode);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoadingSession(false);
      if (session) {
        setView('ONBOARDING');
        api.fetchProfile(session.user.id).then(async (profile) => {
          if (profile) {
            setUserProfile(profile);
          } else {
            // FALLBACK: Create profile if missing (e.g. trigger didn't run yet)
            console.log("Profile missing, creating fallback...");
            const email = session.user.email || '';
            const displayName = session.user.user_metadata?.display_name || email.split('@')[0];
            const initials = session.user.user_metadata?.initials || displayName.substring(0, 2).toUpperCase();
            const color = session.user.user_metadata?.color || '#8b5cf6';

            const newProfile = {
              id: session.user.id,
              display_name: displayName,
              email: email,
              initials: initials,
              color: color
            };

            await supabase.from('profiles').insert(newProfile);
            setUserProfile(newProfile as any);
          }
        });
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      if (event === 'SIGNED_IN' && session) {
        setView('ONBOARDING');
        api.fetchProfile(session.user.id).then(async (profile) => {
          if (profile) {
            setUserProfile(profile);
          } else {
            // FALLBACK: Create profile if missing
            console.log("Profile missing on auth change, creating fallback...");
            const email = session.user.email || '';
            const displayName = session.user.user_metadata?.display_name || email.split('@')[0];
            const initials = session.user.user_metadata?.initials || displayName.substring(0, 2).toUpperCase();
            const color = session.user.user_metadata?.color || '#8b5cf6';

            const newProfile = {
              id: session.user.id,
              display_name: displayName,
              email: email,
              initials: initials,
              color: color
            };

            await supabase.from('profiles').insert(newProfile);
            setUserProfile(newProfile as any);
          }
        });
      } else if (!session) {
        setView('AUTH');
        setUserProfile(null);
        localStorage.removeItem('active_league_id');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Set default viewing roster
  useEffect(() => {
    if (session?.user?.id && teams.length > 0 && viewingRosterId === "") {
      setViewingRosterId(session.user.id);
    }
  }, [session, teams, viewingRosterId]);

  // --- REAL-TIME SUBSCRIPTION ---
  useEffect(() => {
    if (!currentLeague) return;

    console.log(`Subscribing to realtime updates for league: ${currentLeague.id}`);
    const channel = supabase
      .channel(`league-${currentLeague.id}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'picks', filter: `league_id=eq.${currentLeague.id}` },
        (payload) => {
          console.log("Realtime pick received!", payload.new);
          // 1. Add the new pick to the local list so the UI updates instantly
          setRecentPicks(prev => [payload.new, ...prev]);

          // 2. Refresh the full league data to ensure consistency (rosters, etc)
          // We pass current shows to avoid re-fetching them
          loadLeagueData(currentLeague, shows);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [currentLeague?.id]);

  // --- DEEP LINKING SUPPORT ---
  useEffect(() => {
    // If we have a league ID in the URL but it's not the current league, load it
    const pathParts = location.pathname.split('/');
    const leagueIdx = pathParts.findIndex(p => p === 'league');
    if (leagueIdx !== -1 && pathParts[leagueIdx + 1]) {
      const urlLeagueId = pathParts[leagueIdx + 1];
      if (session?.user && (!currentLeague || currentLeague.id !== urlLeagueId)) {
        console.log("Deep link detected for league:", urlLeagueId);
        api.fetchUserLeagues(session.user.id).then(leagues => {
          const target = leagues.find(l => l.id === urlLeagueId);
          if (target) {
            loadLeagueData(target);
          } else {
            // If they aren't in the league, maybe they are trying to join?
            // For now, just go home
            navigate('/');
          }
        });
      }
    }
  }, [location.pathname, session, currentLeague]);


  useEffect(() => {
    if (session?.user) {
      api.fetchShowsFromSupabase().then((fetchedShows) => {
        const enrichedShows = fetchedShows.map(s => {
          const multiplier = s.category === 'streaming' ? 1 : STANDARD_NETWORK_MULTIPLIER;
          const totalViews = (s.viewershipHistory || []).reduce((sum, v) => sum + (v.viewers || 0) * multiplier, 0);
          const lastEntry = s.viewershipHistory && s.viewershipHistory.length > 0
            ? s.viewershipHistory[s.viewershipHistory.length - 1]
            : null;

          return {
            ...s,
            cumulativeRating: totalViews,
            lastPoints: lastEntry ? lastEntry.viewers : 0
          };
        });
        setShows(enrichedShows);

        api.fetchUserLeagues(session.user.id).then(leagues => {
          setUserLeagues(leagues);

          const pendingInvite = localStorage.getItem('pending_league_invite');
          if (pendingInvite) {
            handleAutoJoin(pendingInvite);
          } else {
            const persistedLeagueId = localStorage.getItem('active_league_id');
            if (persistedLeagueId) {
              const target = leagues.find(l => l.id === persistedLeagueId);
              if (target) {
                loadLeagueData(target, enrichedShows);
              }
            }
          }
        });
      });
    }
  }, [session]);

  const handleAutoJoin = async (code: string) => {
    if (!session?.user) return;
    setJoiningLeague(true);
    try {
      console.log("Attempting to auto-join league:", code);
      const league = await api.joinLeague(session.user.id, code);
      localStorage.removeItem('pending_league_invite');

      const updatedLeagues = await api.fetchUserLeagues(session.user.id);
      setUserLeagues(updatedLeagues);

      await loadLeagueData(league, shows);
    } catch (e: any) {
      console.error("Auto join failed:", e);
      if (e.message && e.message.includes('full')) {
        alert("The league you are trying to join is full.");
      } else {
        alert(`Failed to join league via link: ${e.message}`);
      }
      localStorage.removeItem('pending_league_invite');
    } finally {
      setJoiningLeague(false);
    }
  };

  const loadLeagueData = async (league: League, currentShows: Show[] = shows, periodId?: string) => {
    setLoadingData(true);
    setCurrentLeague(league);
    localStorage.setItem('active_league_id', league.id);

    try {
      // 1. Fetch Periods
      const leaguePeriods = await api.fetchLeaguePeriods(league.id);
      setPeriods(leaguePeriods);

      const activePeriod = periodId
        ? leaguePeriods.find(p => p.id === periodId)
        : (leaguePeriods.find(p => p.status !== 'finished') || leaguePeriods[0]);

      const currentPeriodId = activePeriod?.id || null;
      setSelectedPeriodId(currentPeriodId);

      // 2. Check Members Count & Order
      const memberIds = await api.fetchLeagueMembers(league.id);
      setLeagueMemberCount(memberIds.length);
      setOrderedMemberIds(memberIds);

      // 3. Get Picks for this period
      const picks = await api.fetchLeaguePicks(league.id, currentPeriodId || undefined);

      // 4. Get Adjusted Scores from DB View
      const leagueScores = await api.getLeagueLeaderboard(league.id, currentPeriodId || undefined);

      // 5. Get Career Stats
      const stats = await api.getLeagueCareerStats(league.id);
      setCareerStats(stats);

      const isLeagueFull = memberIds.length >= (league.max_members ?? 4);
      const hasDraftActivity = picks.length > 0;

      const now = new Date();
      const draftTime = league.draft_start_time ? new Date(league.draft_start_time) : new Date();
      const isTimePassed = now >= draftTime;

      if (!isLeagueFull || (!isTimePassed && !hasDraftActivity)) {
        navigate(`/league/${league.id}/waiting`);
        setLoadingData(false);
        return;
      }

      // 5. Prepare Activity Feed & Roster Logic
      const resolvedPicks = picks.map(p => {
        const foundShow = currentShows.find(s => s.id === p.show_id || s.title === p.show_name);
        return {
          ...p,
          show_name: foundShow ? foundShow.title : (p.show_name || 'Unknown Show')
        };
      });

      // Sort recent picks descending for feed
      const sortedPicks = [...resolvedPicks].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setRecentPicks(sortedPicks);

      // 5. Build Teams
      const distinctUserIds = memberIds; // This is now ordered correctly from API
      const profiles = await api.fetchProfiles(distinctUserIds);

      const builtTeams: Team[] = distinctUserIds.map((uid, index) => {
        const userPicks = picks.filter((p: any) => p.user_id === uid);
        const profile = profiles.find((p: any) => p.id === uid);

        const roster: Show[] = userPicks.map((p: any) => {
          const masterShow = currentShows.find(s => s.id === p.show_id || s.title === p.show_name);

          // Calculate cumulative rating and last points from pre-loaded history
          const totalViews = masterShow ? masterShow.cumulativeRating : 0;
          const lastEntry = (masterShow?.viewershipHistory && masterShow.viewershipHistory.length > 0)
            ? masterShow.viewershipHistory[masterShow.viewershipHistory.length - 1]
            : null;

          if (masterShow) {
            return {
              ...masterShow,
              status: 'drafted' as const,
              draftedBy: profile ? profile.display_name : uid,
              cumulativeRating: totalViews,
              lastPoints: lastEntry ? lastEntry.viewers : 0,
              viewershipHistory: masterShow.viewershipHistory
            };
          }

          return {
            id: p.show_id || 'unknown',
            title: p.show_name || 'Unknown',
            network: 'N/A',
            category: 'cable',
            nextEpisodeDate: 'N/A',
            description: 'Not found in database.',
            projectedRating: 0,
            cumulativeRating: totalViews,
            lastPoints: lastEntry ? lastEntry.viewers : 0,
            status: 'drafted' as const,
            draftedBy: profile ? profile.display_name : uid,
            viewershipHistory: []
          };
        });

        // Use DB View for total score
        const stats = leagueScores.find((s: any) => s.user_id === uid);
        // Fallback for demo: if no stats in view (e.g. empty league), calculate manually or use 0
        // We will default to the view, or 0.
        const total = stats ? stats.adjusted_total_points : 0;

        return {
          id: uid as string,
          name: profile ? profile.display_name : (uid === session?.user?.id ? 'My Team' : `Player ${index + 1}`),
          owner: profile ? profile.email : (uid === session?.user?.id ? 'Me' : `User ${index + 1}`),
          initials: profile ? profile.initials : (uid === session?.user?.id ? 'ME' : `P${index + 1}`),
          color: profile ? profile.color : TEAM_COLORS[index % TEAM_COLORS.length],
          roster: roster,
          totalPoints: total
        };
      });

      setTeams(builtTeams);

      // 6. Fetch Waiver Stats
      if (session?.user?.id) {
        const moves = await api.getWeeklyAddCount(league.id, session.user.id);
        const latestAdd = await api.getLatestWaiverAdd(league.id, session.user.id);
        setWeeklyMovesCount(moves);
        setLastWaiverAddDate(latestAdd);
      }

      // 6. Navigation Logic REMOVED from data loading!
      // The UI component calling this should decide where to go if needed.

      // Only on explicit "JOIN" (via onboarding hook) do we want to auto-navigate, 
      // but we will let the Onboarding component handle that based on the promise resolution.

      // We just return the data now or let React state update trigger re-renders.

    } catch (e: any) {
      console.error(e);
      alert(`Error loading league: ${e.message || 'Unknown error'}`);
      localStorage.removeItem('active_league_id');
    } finally {
      setLoadingData(false);
    }
  };

  const handleDraftShow = async (show: Show) => {
    if (!currentLeague || !session?.user) return;

    // Check turn
    if (!isMyTurn) {
      alert("It is not your turn!");
      return;
    }

    // Enforce Roster Limits
    const myTeam = teams.find(t => t.id === session.user.id);
    if (myTeam) {
      const currentCategoryCount = myTeam.roster.filter(s => s.category === show.category).length;
      const limit = show.category === 'cable'
        ? (currentLeague.cable_slots || 3)
        : (currentLeague.streaming_slots || 3);

      if (currentCategoryCount >= limit) {
        if (!isDraftOver) {
          alert(`You have reached the limit for ${show.category === 'cable' ? 'Cable/Broadcast' : 'Streaming'} shows (${limit}).`);
          return;
        }
        // If draft is over (waiver mode), allow proceeding to open the Add/Drop modal
      }
    }

    try {
      const isWaiver = isDraftOver;

      // Enforce Waiver Limits & Cooldown
      if (isWaiver && currentLeague) {
        if (cooldownExpiresAt) {
          alert(`You are currently on waiver cooldown. Next move available in few days.`);
          return;
        }

        const limit = currentLeague.max_adds_per_week || 3;
        if (weeklyMovesCount >= limit) {
          alert(`You have reached your weekly add limit (${limit}).`);
          return;
        }

        // --- OPEN WAIVER MODAL INSTEAD OF DIRECT ADD ---
        // We set the show to add, and open the modal.
        setWaiverShowToAdd(show);
        setShowWaiverModal(true);
        return;
      }

      await api.makePick(currentLeague.id, session.user.id, show, isWaiver);
      // Refresh to update counts - NO NAVIGATION will happen here now
      await loadLeagueData(currentLeague);
    } catch (e) {
      alert("Failed to draft/add show.");
    }
  };

  const handleWaiverConfirm = async (dropShowId: string | null) => {
    if (!currentLeague || !session?.user || !waiverShowToAdd) return;
    try {
      // 1. Drop if selected
      if (dropShowId) {
        await api.dropShow(currentLeague.id, session.user.id, dropShowId);
      }
      // 2. Add
      await api.makePick(currentLeague.id, session.user.id, waiverShowToAdd, true);

      // 3. Refresh
      await loadLeagueData(currentLeague);
    } catch (e) {
      alert("Transaction failed. Please try again.");
      console.error(e);
    }
  };

  const handleDropShow = async (showId: string) => {
    if (!currentLeague || !session?.user) return;
    try {
      await api.dropShow(currentLeague.id, session.user.id, showId);
      await loadLeagueData(currentLeague);
    } catch (e) {
      alert("Failed to drop show.");
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!currentLeague) return;
    try {
      await api.removeLeagueMember(currentLeague.id, userId);
      // Refresh league data to reflect changes
      await loadLeagueData(currentLeague);
    } catch (e) {
      alert("Failed to remove member.");
    }
  };

  const getAvailableShows = () => {
    const draftedIds = new Set(teams.flatMap(t => t.roster.map(r => r.id)));
    let available = shows.filter(s => !draftedIds.has(s.id));

    // Enforcement: If we are in DRAFT view and have a current team, filter by slots
    // ONLY enforce hiding during the live draft. In waiver mode, we show everything because users can DROP to ADD.
    if (view === 'DRAFT' && currentLeague && !isDraftOver) {
      const myTeam = getCurrentUserTeam();
      if (myTeam) {
        const cableCount = myTeam.roster.filter(s => s.category === 'cable').length;
        const streamingCount = myTeam.roster.filter(s => s.category === 'streaming').length;

        const cableLimit = currentLeague.cable_slots || 3;
        const streamingLimit = currentLeague.streaming_slots || 3;

        if (cableCount >= cableLimit) {
          available = available.filter(s => s.category !== 'cable');
        }
        if (streamingCount >= streamingLimit) {
          available = available.filter(s => s.category !== 'streaming');
        }
      }
    }

    return available;
  };

  const getCurrentUserTeam = () => {
    return teams.find(t => t.id === session?.user?.id) || null;
  };

  const getViewingTeam = () => {
    if (!viewingRosterId) return getCurrentUserTeam();
    return teams.find(t => t.id === viewingRosterId) || null;
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setView('AUTH');
    localStorage.removeItem('active_league_id');
  };

  if (loadingSession) return <div className="h-screen flex items-center justify-center bg-gray-50 text-slate-400">Loading...</div>;

  if (!session) return <Auth />;

  return (
    <div className="min-h-screen flex flex-col relative bg-gray-50 text-slate-900">
      <Navbar
        onNavigateHome={() => navigate('/')}
        onNavigateLeaderboard={() => navigate('/leaderboard')}
        onNavigateAdmin={() => navigate('/global')}
        onNavigateProfile={() => navigate('/profile')}
        onNavigateHowToPlay={() => navigate('/how-to-play')}
        onLogout={handleLogout}
        userProfile={userProfile}
      />


      {joiningLeague && (
        <div className="fixed inset-0 glass z-50 flex flex-col items-center justify-center animate-fade-in">
          <div className="bg-white p-12 rounded-[3.5rem] shadow-2xl flex flex-col items-center border-[12px] border-purple-50 animate-bounce-in">
            <Loader2 className="w-16 h-16 text-purple-600 animate-spin mb-6" />
            <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">Setting the Stage</h2>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-2">Initializing Your Network...</p>
          </div>
        </div>
      )}

      {selectedShow && (
        <ShowDetailsModal
          show={selectedShow}
          onClose={() => setSelectedShow(null)}
          onDraft={view === 'DRAFT' ? handleDraftShow : undefined}
          isDraftable={view === 'DRAFT' && getAvailableShows().some(s => s.id === selectedShow.id)}
          isMyTurn={isMyTurn}
          currentDrafterName={currentDrafterInfo.name}
        />
      )}

      {showWaiverModal && waiverShowToAdd && (
        <WaiverTransactionModal
          showToAdd={waiverShowToAdd}
          currentTeam={getCurrentUserTeam()!}
          onConfirm={handleWaiverConfirm}
          onClose={() => {
            setShowWaiverModal(false);
            setWaiverShowToAdd(null);
          }}
          cableSlots={currentLeague?.cable_slots || 3}
          streamingSlots={currentLeague?.streaming_slots || 3}
        />
      )}

      <main className="flex-1 w-full pb-10">
        <Routes>
          <Route path="/auth" element={!session ? <Auth /> : <Navigate to="/" />} />

          <Route path="/" element={
            <LeagueOnboarding
              userId={session.user.id}
              userName={userProfile?.display_name}
              existingLeagues={userLeagues}
              onLeagueSelected={async (league) => {
                await loadLeagueData(league);
                // Decide Navigation HERE, not in loadLeagueData
                // We need to check if we should go to waiting room or main view
                const isLeagueFull = (league.userRank && league.totalTeams) ? league.totalTeams >= (league.max_members ?? 4) : false; // Rough check, improved by using detailed stats if available

                // Simpler check: Just go to the league view. The LeagueView component checks if it should redirect to waiting room?
                // Actually, let's keep it simple: Go to League Home
                // But we must handle the 'Waiting Room' case if the draft hasn't started.
                const now = new Date();
                const draftTime = league.draft_start_time ? new Date(league.draft_start_time) : new Date();
                const isTimePassed = now >= draftTime;

                if (!isTimePassed) {
                  navigate(`/league/${league.id}/waiting`);
                } else {
                  navigate(`/league/${league.id}`);
                }
              }}
              isJoining={loadingData}
            />
          } />

          <Route path="/how-to-play" element={
            <HowToPlay onBack={() => navigate(-1)} />
          } />

          <Route path="/leaderboard" element={
            <Leaderboard onBack={() => navigate(-1)} onShowClick={setSelectedShow} />
          } />

          <Route path="/global" element={
            <GlobalTeamLeaderboard onBack={() => navigate(-1)} />
          } />

          <Route path="/profile" element={
            userProfile ? (
              <Profile
                user={userProfile}
                onBack={() => navigate(-1)}
                onUpdate={(updated) => {
                  setUserProfile(updated);
                  if (currentLeague) loadLeagueData(currentLeague);
                }}
              />
            ) : <Navigate to="/" />
          } />

          <Route path="/league/:leagueId/waiting" element={
            currentLeague ? (
              <LeagueWaitingRoom
                league={currentLeague}
                memberCount={leagueMemberCount}
                onEnterDraft={() => {
                  loadLeagueData(currentLeague).then(() => navigate(`/league/${currentLeague.id}/draft`));
                }}
                onRefresh={() => loadLeagueData(currentLeague)}
                currentUserId={session.user.id}
              />
            ) : <Navigate to="/" />
          } />

          <Route path="/league/:leagueId" element={
            currentLeague ? (
              <LeagueView
                teams={teams}
                periods={periods}
                selectedPeriodId={selectedPeriodId}
                onPeriodChange={(pid) => loadLeagueData(currentLeague!, shows, pid)}
                onBack={() => navigate('/')}
                onUpdateRatings={() => loadLeagueData(currentLeague!, shows, selectedPeriodId || undefined)}
                loading={loadingData}
                onWaiverWire={() => navigate(`/league/${currentLeague.id}/draft`)}
                leagueName={currentLeague.name}
                onShowClick={setSelectedShow}
                currentUserId={session.user.id}
                leagueManagerId={currentLeague.created_by}
                onRemoveMember={handleRemoveMember}
                onDropShow={handleDropShow}
                isDraftOver={isDraftOver}
                cooldownExpiresAt={cooldownExpiresAt}
                careerStats={careerStats}
              />
            ) : <Navigate to="/" />
          } />

          <Route path="/league/:leagueId/draft" element={
            currentLeague ? (
              <div className="max-w-[1600px] mx-auto mt-8 px-4">
                <button
                  onClick={() => navigate(`/league/${currentLeague.id}`)}
                  className="mb-4 text-slate-500 hover:text-slate-900 flex items-center gap-2"
                >
                  &larr; Back to Dashboard
                </button>
                <div className="mb-6">
                  <h2 className="text-3xl font-extrabold text-slate-900">{isDraftOver ? 'Waiver Wire' : 'Live Draft Room'}</h2>
                  <p className="text-slate-500">{isDraftOver ? 'Claim available shows for next week.' : 'Pick up available shows for your roster.'}</p>
                </div>

                <div className="flex flex-col xl:flex-row gap-6 items-start">
                  <div className="flex-1 min-w-0">
                    <DraftBoard
                      availableShows={getAvailableShows()}
                      currentTeam={getCurrentUserTeam()}
                      league={currentLeague}
                      onDraft={handleDraftShow}
                      isDrafting={true}
                      onShowClick={setSelectedShow}
                      isMyTurn={isMyTurn}
                      currentDrafterName={currentDrafterInfo.name}
                      picksUntilTurn={picksUntilTurn}
                      lastPick={recentPicks[0]}
                      addsRemaining={isDraftOver ? (currentLeague.max_adds_per_week || 3) - weeklyMovesCount : undefined}
                      maxAdds={currentLeague.max_adds_per_week}
                      viewMode={isDraftOver ? 'waiver' : 'draft'}
                      cooldownExpiresAt={cooldownExpiresAt}
                    />
                  </div>

                  {!isDraftOver && (
                    <div className="w-full xl:w-96 shrink-0 flex flex-col gap-4 xl:sticky xl:top-24">
                      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Viewing Roster</label>
                        <div className="relative">
                          <select
                            value={viewingRosterId || ''}
                            onChange={(e) => setViewingRosterId(e.target.value)}
                            className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-900 text-sm font-bold rounded-lg pl-3 pr-8 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all cursor-pointer hover:bg-slate-100"
                          >
                            {teams.map(t => (
                              <option key={t.id} value={t.id}>
                                {t.name} {t.id === session?.user?.id ? '(You)' : ''}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        </div>
                      </div>
                      {getViewingTeam() && (
                        <Standings teams={[getViewingTeam()!]} hideChart={true} compact={true} />
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : <Navigate to="/" />
          } />

          {/* Legacy Invite Path Support */}
          <Route path="/:inviteCode" element={<InviteRedirect />} />
        </Routes>
      </main>
    </div>
  );
};

export default App;