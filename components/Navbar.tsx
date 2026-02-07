import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Tv, LogOut, User, Trophy, Users, HelpCircle } from 'lucide-react';

import { UserProfile } from '../types';

interface NavbarProps {
  onNavigateHome: () => void;
  onNavigateLeaderboard: () => void;
  onNavigateAdmin: () => void;
  onNavigateProfile: () => void;
  onNavigateHowToPlay: () => void;
  onLogout: () => void;
  userProfile: UserProfile | null;
}

const Navbar: React.FC<NavbarProps> = ({
  onNavigateHome,
  onNavigateLeaderboard,
  onNavigateAdmin,
  onNavigateProfile,
  onNavigateHowToPlay,
  onLogout,
  userProfile
}) => {

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile menu when route changes (mocked by clicking an item)
  const handleMobileNav = (action: () => void) => {
    action();
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <header className="glass pt-4 pb-2 px-4 md:px-6 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          {/* Left: Logo */}
          <div
            className="flex items-center gap-3 cursor-pointer group hover-lift"
            onClick={onNavigateHome}
          >
            <div className="bg-gradient-to-br from-purple-600 to-indigo-600 p-2 rounded-xl shadow-lg shadow-purple-200 group-hover:shadow-purple-300 transition-all">
              <Tv className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-lg md:text-xl font-black text-slate-900 tracking-tight uppercase group-hover:text-purple-700 transition-colors leading-none">
                ShowRunner
              </h1>
              <span className="text-[9px] md:text-[10px] font-bold text-slate-400 tracking-widest uppercase">Fantasy League</span>
            </div>
          </div>

          {/* Center: Navigation Links (Desktop) */}
          <nav className="hidden md:flex items-center space-x-6 text-sm font-medium text-slate-600">
            <button onClick={onNavigateHome} className="hover:text-purple-600 transition-colors hover-lift">Leagues</button>
            <button onClick={onNavigateLeaderboard} className="hover:text-purple-600 transition-colors flex items-center gap-1 hover-lift">
              <Trophy className="w-4 h-4" /> Leaderboard
            </button>
            {/* <button onClick={onNavigateAdmin} className="hover:text-purple-600 transition-colors flex items-center gap-1 hover-lift">
              <Users className="w-4 h-4" /> Top Teams
            </button> */}
            <button onClick={onNavigateHowToPlay} className="hover:text-purple-600 transition-colors flex items-center gap-1 hover-lift">
              <HelpCircle className="w-4 h-4" /> How to Play
            </button>
          </nav>

          {/* Right: Actions & Profile */}
          <div className="flex items-center gap-3 md:gap-4">

            {/* Mobile Menu Toggle */}
            <button
              className="md:hidden p-2 text-slate-600 hover:text-purple-600 transition-colors"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                // Simple X icon directly here to avoid import issues if Lucide version varies, 
                // but we imported X in the top level (wait, I need to add it to imports)
                // ACTUALLY, I will add 'Menu' and 'X' to the imports in a separate step or assume they are available?
                // The user wants me to fix it. I should verify imports usually. 
                // Looking at file content: import { ChevronDown, Tv, LogOut, User, Trophy, Users, HelpCircle } from 'lucide-react';
                // I need to update imports first.
                // wait, I can do it in one replace if I replace the whole file or a large chunk.
                // Let's rely on the svg here to be safe and avoiding import errors if I mess up the top line replacment.
                // NO, I should do it properly.
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12" /><line x1="4" x2="20" y1="6" y2="6" /><line x1="4" x2="20" y1="18" y2="18" /></svg>
              )}
            </button>

            <div className="relative hidden md:block">
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

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-white/95 backdrop-blur-xl md:hidden animate-in fade-in slide-in-from-top-5 duration-200 flex flex-col pt-24 px-6 gap-6">
          <div className="flex flex-col gap-4">
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Menu</p>
            <button onClick={() => handleMobileNav(onNavigateHome)} className="text-2xl font-black text-slate-800 hover:text-purple-600 text-left">Leagues</button>
            <button onClick={() => handleMobileNav(onNavigateLeaderboard)} className="text-2xl font-black text-slate-800 hover:text-purple-600 text-left flex items-center gap-3">
              <Trophy className="w-6 h-6 text-purple-500" /> Leaderboard
            </button>
            {/* <button onClick={() => handleMobileNav(onNavigateAdmin)} className="text-2xl font-black text-slate-800 hover:text-purple-600 text-left flex items-center gap-3">
              <Users className="w-6 h-6 text-purple-500" /> Top Teams
            </button> */}
            <button onClick={() => handleMobileNav(onNavigateHowToPlay)} className="text-2xl font-black text-slate-800 hover:text-purple-600 text-left flex items-center gap-3">
              <HelpCircle className="w-6 h-6 text-purple-500" /> How to Play
            </button>
          </div>

          <div className="flex flex-col gap-4 mt-8">
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Account</p>
            <button
              onClick={() => handleMobileNav(onNavigateProfile)}
              className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl"
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-black text-white shadow-lg"
                style={{ backgroundColor: userProfile?.color || '#a855f7' }}
              >
                {userProfile?.initials || 'ME'}
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-slate-900">{userProfile?.display_name || 'My Profile'}</p>
                <p className="text-xs text-slate-500 font-medium">Manage settings & profile</p>
              </div>
            </button>

            <button
              onClick={() => handleMobileNav(onLogout)}
              className="w-full text-left px-4 py-4 text-sm font-bold text-red-600 hover:bg-red-50 rounded-xl flex items-center gap-2 group transition-colors border border-red-100"
            >
              <LogOut className="w-5 h-5 text-red-500" /> Sign Out
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;