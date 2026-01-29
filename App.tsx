import React, { useState, useEffect, useMemo } from 'react';
import { Show, Team, ViewState, League, STANDARD_NETWORK_MULTIPLIER } from './types';
import * as api from './services/api';
import { supabase } from './lib/supabase';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import LeagueView from './components/LeagueView';
import Auth from './components/Auth';
import LeagueOnboarding from './components/LeagueOnboarding';
import DraftBoard from './components/DraftBoard';
import LeagueWaitingRoom from './components/LeagueWaitingRoom';
import ShowDetailsModal from './components/ShowDetailsModal';
import Standings from './components/Standings';
import Leaderboard from './components/Leaderboard';
import AdminShowDiscovery from './components/AdminShowDiscovery';
import Profile from './components/Profile';
import { UserProfile } from './types';
import { Loader2, ChevronDown } from 'lucide-react';

const TEAM_COLORS = ["#6366f1", "#8b5cf6", "#ec4899", "#10b981", "#f59e0b", "#3b82f6"];

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);

  const [view, setView] = useState<ViewState>('AUTH');
  const [currentLeague, setCurrentLeague] = useState<League | null>(null);
  const [leagueMemberCount, setLeagueMemberCount] = useState<number>(0);
  const [userLeagues, setUserLeagues] = useState<League[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [shows, setShows] = useState<Show[]>([]);
  const [recentPicks, setRecentPicks] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [joiningLeague, setJoiningLeague] = useState(false);

  // Show Details Modal State
  const [selectedShow, setSelectedShow] = useState<Show | null>(null);

  // Draft Logic State
  const [orderedMemberIds, setOrderedMemberIds] = useState<string[]>([]);

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

  const isMyTurn = session?.user?.id === currentDrafterInfo.id;


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
        api.fetchProfile(session.user.id).then(setUserProfile);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      if (event === 'SIGNED_IN' && session) {
        setView('ONBOARDING');
        api.fetchProfile(session.user.id).then(setUserProfile);
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


  useEffect(() => {
    if (session?.user) {
      api.fetchShowsFromSupabase().then((fetchedShows) => {
        setShows(fetchedShows);

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
                loadLeagueData(target, fetchedShows);
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

  const loadLeagueData = async (league: League, currentShows: Show[] = shows) => {
    setLoadingData(true);
    setCurrentLeague(league);
    localStorage.setItem('active_league_id', league.id);

    try {
      // 1. Check Members Count & Order
      // API now returns sorted IDs
      const memberIds = await api.fetchLeagueMembers(league.id);
      setLeagueMemberCount(memberIds.length);
      setOrderedMemberIds(memberIds);

      // 2. Get Picks
      const picks = await api.fetchLeaguePicks(league.id);

      // 3. Get Targeted Stats (ONLY for shows mentioned in picks)
      // This is the huge optimization to save Egress
      const uniqueShowIds = Array.from(new Set(picks.map((p: any) => p.show_id).filter(Boolean))) as string[];
      const historyData = await api.fetchShowStatsForLeague(uniqueShowIds);

      // 4. Get Adjusted Scores from DB View
      const leagueScores = await api.getLeagueLeaderboard(league.id);

      const isLeagueFull = memberIds.length >= (league.max_members || 4);
      const hasDraftActivity = picks.length > 0;

      const now = new Date();
      const draftTime = league.draft_start_time ? new Date(league.draft_start_time) : new Date();
      const isTimePassed = now >= draftTime;

      if (!isLeagueFull || (!isTimePassed && !hasDraftActivity)) {
        setView('WAITING_ROOM');
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
          const showHistory = historyData.filter(h => h.show_id === p.show_id);

          // Calculate cumulative rating and last points from history
          const multiplier = masterShow?.category === 'streaming' ? 1 : STANDARD_NETWORK_MULTIPLIER;
          const totalViews = showHistory.reduce((sum, entry) => sum + (entry.viewers || 0) * multiplier, 0);
          const lastEntry = showHistory.length > 0 ? showHistory[showHistory.length - 1] : null;

          if (masterShow) {
            return {
              ...masterShow,
              status: 'drafted' as const,
              draftedBy: uid,
              cumulativeRating: totalViews,
              lastPoints: lastEntry ? lastEntry.viewers : 0,
              viewershipHistory: showHistory
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
            draftedBy: uid,
            viewershipHistory: showHistory
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

      // Decide View
      const maxSlots = (league.cable_slots || 3) + (league.streaming_slots || 3);
      const totalPossiblePicks = memberIds.length * maxSlots;

      if (picks.length >= totalPossiblePicks) {
        setView('LEAGUE');
      } else {
        if (view !== 'LEAGUE' && view !== 'LEADERBOARD') {
          setView(picks.length > 0 ? 'DRAFT' : 'DRAFT');
        }
      }

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
        alert(`You have reached the limit for ${show.category === 'cable' ? 'Cable/Broadcast' : 'Streaming'} shows (${limit}).`);
        return;
      }
    }

    try {
      await api.makePick(currentLeague.id, session.user.id, show);
      // Real-time subscription will update UI, but we can do optimistic update or wait
    } catch (e) {
      alert("Failed to draft show.");
    }
  };

  const getAvailableShows = () => {
    const draftedIds = new Set(teams.flatMap(t => t.roster.map(r => r.id)));
    return shows.filter(s => !draftedIds.has(s.id));
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
        onNavigateHome={() => {
          setView('ONBOARDING');
          setCurrentLeague(null);
          localStorage.removeItem('active_league_id');
        }}
        onNavigateLeaderboard={() => setView('LEADERBOARD')}
        onNavigateAdmin={() => setView('ADMIN')}
        onNavigateProfile={() => setView('PROFILE')}
        onLogout={handleLogout}
        userProfile={userProfile}
      />


      {joiningLeague && (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center animate-fade-in">
          <Loader2 className="w-12 h-12 text-purple-600 animate-spin mb-4" />
          <h2 className="text-xl font-bold text-slate-800">Joining League...</h2>
          <p className="text-slate-500">Setting up your team</p>
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

      <main className="flex-1 w-full pb-10">

        {view === 'ONBOARDING' && (
          <LeagueOnboarding
            userId={session.user.id}
            existingLeagues={userLeagues}
            onLeagueSelected={(league) => loadLeagueData(league)}
            isJoining={loadingData}
          />
        )}

        {view === 'LEADERBOARD' && (
          <Leaderboard
            onBack={() => {
              if (currentLeague) {
                // If we were in a league, go back to league view or draft based on state
                // Simple heuristic: if we have a current league loaded, go back to dashboard/league
                setView('LEAGUE');
              } else {
                setView('ONBOARDING');
              }
            }}
          />
        )}

        {view === 'ADMIN' && (
          <AdminShowDiscovery
            onBack={() => {
              if (currentLeague) {
                setView('LEAGUE');
              } else {
                setView('ONBOARDING');
              }
            }}
            existingShows={shows}
          />
        )}

        {view === 'PROFILE' && userProfile && (
          <Profile
            user={userProfile}
            onBack={() => {
              if (currentLeague) {
                setView('LEAGUE');
              } else {
                setView('ONBOARDING');
              }
            }}
            onUpdate={(updated) => {
              setUserProfile(updated);
              // If we are in a league, we should refresh the league data to see updated profile sitewide
              if (currentLeague) {
                loadLeagueData(currentLeague);
              }
            }}
          />
        )}

        {view === 'WAITING_ROOM' && currentLeague && (
          <LeagueWaitingRoom
            league={currentLeague}
            memberCount={leagueMemberCount}
            onEnterDraft={() => {
              loadLeagueData(currentLeague).then(() => setView('DRAFT'));
            }}
            onRefresh={() => loadLeagueData(currentLeague)}
            currentUserId={session.user.id}
          />
        )}

        {view === 'DASHBOARD' && currentLeague && (
          <>
            <div className="flex justify-between items-center max-w-2xl mx-auto mt-8 px-4">
              <span className="text-sm font-bold text-slate-400">League Code: {currentLeague.code}</span>
              <button
                onClick={() => setView('DRAFT')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold shadow-md transition-colors"
              >
                Enter Draft Room
              </button>
            </div>
            <Dashboard
              teams={teams}
              onSelectLeague={() => setView('LEAGUE')}
              recentPicks={recentPicks}
              currentUserId={session.user.id}
            />
          </>
        )}

        {view === 'LEAGUE' && currentLeague && (
          <LeagueView
            teams={teams}
            onBack={() => {
              setView('ONBOARDING');
              setCurrentLeague(null);
              localStorage.removeItem('active_league_id');
            }}
            onUpdateRatings={() => loadLeagueData(currentLeague)}
            loading={loadingData}
            onWaiverWire={() => setView('DRAFT')}
            leagueName={currentLeague.name}
            onShowClick={setSelectedShow}
          />
        )}

        {view === 'DRAFT' && currentLeague && (
          <div className="max-w-[1600px] mx-auto mt-8 px-4">
            <button
              onClick={() => setView('LEAGUE')}
              className="mb-4 text-slate-500 hover:text-slate-900 flex items-center gap-2"
            >
              &larr; Back to Dashboard
            </button>
            <div className="mb-6">
              <h2 className="text-3xl font-extrabold text-slate-900">Live Draft Room</h2>
              <p className="text-slate-500">Pick up available shows for your roster.</p>
            </div>

            <div className="flex flex-col xl:flex-row gap-6 items-start">
              <div className="flex-1 min-w-0">
                <DraftBoard
                  availableShows={getAvailableShows()}
                  currentTeam={getCurrentUserTeam()}
                  onDraft={handleDraftShow}
                  isDrafting={true}
                  onShowClick={setSelectedShow}
                  isMyTurn={isMyTurn}
                  currentDrafterName={currentDrafterInfo.name}
                />
              </div>

              <div className="w-full xl:w-96 shrink-0 flex flex-col gap-4 xl:sticky xl:top-24">
                {/* Control Panel */}
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

                {/* Roster Display */}
                {getViewingTeam() && (
                  <Standings teams={[getViewingTeam()!]} hideChart={true} compact={true} />
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;