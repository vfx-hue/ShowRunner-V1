import React, { useState } from 'react';
import { Bell, ChevronDown, Tv, LogOut, User, Trophy } from 'lucide-react';

interface NavbarProps {
  onNavigateHome: () => void;
  onNavigateLeaderboard: () => void;
  onNavigateAdmin: () => void;
  onLogout: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onNavigateHome, onNavigateLeaderboard, onNavigateAdmin, onLogout }) => {
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
              className="w-9 h-9 rounded-full bg-purple-100 border border-purple-200 flex items-center justify-center text-xs font-bold text-purple-700 cursor-pointer hover:bg-purple-200 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              ME
            </button>

            {isDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setIsDropdownOpen(false)}
                ></div>
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg py-1 border border-gray-100 z-20">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">My Account</p>
                  </div>
                  <button
                    className="w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-gray-50 hover:text-purple-600 flex items-center gap-2"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    <User className="w-4 h-4" /> Profile
                  </button>
                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      onLogout();
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" /> Sign Out
                  </button>
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