import React, { useState } from 'react';
import { Bell, ChevronDown, Tv, LogOut, User, Trophy } from 'lucide-react';

import { UserProfile } from '../types';

interface NavbarProps {
  onNavigateHome: () => void;
  onNavigateLeaderboard: () => void;
  onNavigateAdmin: () => void;
  onNavigateProfile: () => void;
  onLogout: () => void;
  userProfile: UserProfile | null;
}

const Navbar: React.FC<NavbarProps> = ({
  onNavigateHome,
  onNavigateLeaderboard,
  onNavigateAdmin,
  onNavigateProfile,
  onLogout,
  userProfile
}) => {

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <header className="bg-white border-b border-gray-200 pt-4 pb-2 px-6 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        {/* Left: Logo */}
        <div
          className="flex items-center gap-2 cursor-pointer group"
          onClick={onNavigateHome}
        >
          <div className="bg-purple-600 p-1.5 rounded-lg shadow-sm shadow-purple-200 group-hover:bg-purple-700 transition-colors">
            <Tv className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight uppercase group-hover:text-purple-700 transition-colors">
            ShowRunner <span className="text-xs normal-case text-slate-500 font-medium tracking-normal ml-1">Fantasy League</span>
          </h1>
        </div>

        {/* Center: Navigation Links */}
        <nav className="hidden md:flex items-center space-x-6 text-sm font-medium text-slate-600">
          <button onClick={onNavigateHome} className="hover:text-purple-600 transition-colors">Leagues</button>
          <button onClick={onNavigateLeaderboard} className="hover:text-purple-600 transition-colors flex items-center gap-1">
            <Trophy className="w-4 h-4" /> Leaderboard
          </button>
          <button onClick={onNavigateAdmin} className="hover:text-purple-600 transition-colors">Discover</button>
          <button className="hover:text-purple-600 transition-colors">News Feed</button>
          <button className="hover:text-purple-600 transition-colors">How to Play</button>
        </nav>

        {/* Right: Actions & Profile */}
        <div className="flex items-center gap-4">
          <button className="text-slate-500 hover:text-purple-600 transition-colors">
            <Bell className="w-5 h-5" />
          </button>

          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black text-white cursor-pointer transition-all hover:scale-105 active:scale-95 focus:outline-none shadow-lg"
              style={{
                backgroundColor: userProfile?.color || '#a855f7',
                boxShadow: `0 4px 12px ${(userProfile?.color || '#a855f7')}44`
              }}
            >
              {userProfile?.initials || 'ME'}
            </button>

            {isDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setIsDropdownOpen(false)}
                ></div>
                <div className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-2xl py-2 border border-slate-100 z-20 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-4 py-3 border-b border-slate-50">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">My Account</p>
                    <p className="text-sm font-bold text-slate-900 truncate mt-0.5">{userProfile?.display_name || 'Anonymous'}</p>
                  </div>
                  <div className="p-1">
                    <button
                      className="w-full text-left px-3 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-purple-600 rounded-xl flex items-center gap-2 group transition-colors"
                      onClick={() => {
                        setIsDropdownOpen(false);
                        onNavigateProfile();
                      }}
                    >
                      <User className="w-4 h-4 text-slate-400 group-hover:text-purple-500 transition-colors" /> Profile Settings
                    </button>
                    <button
                      onClick={() => {
                        setIsDropdownOpen(false);
                        onLogout();
                      }}
                      className="w-full text-left px-3 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50 rounded-xl flex items-center gap-2 group transition-colors"
                    >
                      <LogOut className="w-4 h-4 text-red-300 group-hover:text-red-500 transition-colors" /> Sign Out
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};

export default Navbar;