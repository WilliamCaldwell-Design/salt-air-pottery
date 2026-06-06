/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Shield, Plus, LogOut } from 'lucide-react';
import { UserSession } from '../types';

interface HeaderProps {
  session: UserSession;
  openCreateModal: () => void;
  handlePublish: () => void;
  handleLogout: () => void;
  setSession: (session: UserSession) => void;
  setPublishNotification: (msg: string | null) => void;
  setShowLoginModal: (show: boolean) => void;
  setLoginError: (err: string) => void;
  onGuestAccessClick: () => void;
  onGuestInviteClick: () => void;
}

export default function Header({
  session,
  openCreateModal,
  handlePublish,
  handleLogout,
  setSession,
  setPublishNotification,
  setShowLoginModal,
  setLoginError,
  onGuestAccessClick,
  onGuestInviteClick,
}: HeaderProps) {
  const [logoFailed, setLogoFailed] = useState<boolean>(false);

  return (
    <header id="main_header" className="sticky top-0 z-40 bg-[#FAF8F5]/65 backdrop-blur-lg border-b border-[#EAE4D9]/80 transition-all px-4 sm:px-8 py-4 sm:py-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        
        {/* Logo Brand Brandmark & Typography */}
        <div className="relative flex items-center justify-center py-2 h-28 w-80 overflow-visible">
          {/* Logo element scaled up and placed absolutely behind the text */}
          <div 
            id="brand_logo_emblem_bg"
            className="absolute left-[45%] top-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 pointer-events-none overflow-hidden select-none flex items-center justify-center transition-all"
          >
            {!logoFailed ? (
              <img
                src="/logo.png"
                alt=""
                onError={() => setLogoFailed(true)}
                referrerPolicy="no-referrer"
                className="w-full h-full object-contain"
                style={{ filter: 'sepia(0.8) hue-rotate(15deg) saturate(125%) brightness(1.4) contrast(0.75) opacity(0.14)' }}
              />
            ) : (
              <svg 
                className="w-full h-full text-[#DECEBE] stroke-[1px] opacity-15" 
                viewBox="0 0 24 24" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path 
                  d="M6 3c0 0 2 1 6 1s6-1 6-1v2c0 1.5-1 3-3 4.5V17c0 2 2 3 2 4H7s2-1 2-4v-7.5C7 8 6 6.5 6 5V3z" 
                  stroke="currentColor" 
                  strokeWidth="1.25" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
                <circle cx="12" cy="11" r="1.5" fill="currentColor" opacity="0.3" />
              </svg>
            )}
          </div>

          {/* Typography layered cleanly on top, centered symmetrically */}
          <div className="relative z-10 flex flex-col items-center justify-center text-center">
            <h1 className="text-4xl sm:text-5xl font-serif text-[#2C2A29] font-light leading-none select-none tracking-tight">
              Salt Air
            </h1>
            <p className="text-[12px] sm:text-[13px] tracking-[0.42em] mr-[-0.42em] text-black font-bold uppercase mt-1 font-mono leading-none select-none">
              Pottery
            </p>
          </div>
        </div>

        {/* Practical Navigation Buttons / Auth controls */}
        <div className="flex items-center gap-3 self-end md:self-center">
          {session.isAdmin ? (
            <div className="flex flex-wrap items-center gap-3">
              <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#EAE4D9]/80 text-xs font-medium text-[#5C5346] border border-[#DECEBE]">
                <Shield className="w-3.5 h-3.5" />
                Artist Mode
              </span>

              <button
                id="btn_invite_guest_header"
                onClick={onGuestInviteClick}
                className="inline-flex items-center gap-1.5 bg-white border border-[#DECEBE] hover:border-[#8E8070] text-[#4A433A] px-3.5 py-2 rounded text-sm hover:bg-[#FAF8F5] transition-all duration-200 font-medium cursor-pointer"
                title="Manage Guest Invitation Access Codes"
              >
                ✉️ Invite Guest
              </button>
              
              <button
                id="btn_add_artwork_header"
                onClick={openCreateModal}
                className="inline-flex items-center gap-1 bg-[#4A433A] text-[#FAF8F5] px-4 py-2 rounded text-sm hover:bg-[#38322B] transition-all duration-200 shadow-sm font-medium cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Add New Art
              </button>

              <button
                id="btn_publish"
                onClick={handlePublish}
                className="inline-flex items-center gap-1.5 bg-[#8E8070] text-white px-4 py-2 rounded text-sm hover:bg-[#7E7061] transition-all duration-200 shadow-sm font-medium cursor-pointer"
                title="Logs changes and returns to guest view."
              >
                Publish
              </button>

              <button
                id="btn_logout"
                onClick={handleLogout}
                title="Logout from Artist Session"
                className="p-2 rounded hover:bg-[#EAE4D9] text-[#7E776F] hover:text-[#2C2A29] transition-all cursor-pointer"
              >
                <LogOut className="w-4.5 h-4.5" />
              </button>
            </div>
          ) : session.isGuest ? (
            <div className="flex items-center gap-3 animate-fade-in">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-xs font-medium text-emerald-800 border border-emerald-200/60 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
                🔑 Guest Code Active
              </span>
              <button
                id="btn_logout_guest"
                onClick={handleLogout}
                title="Exit Premium Guest Session"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-[#EAE4D9] bg-[#FAF8F5] hover:bg-[#EAE4D9]/40 text-xs font-medium text-[#7E776F] hover:text-[#2C2A29] transition-all cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                Exit Guest
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              <button
                id="btn_header_guest_access"
                onClick={onGuestAccessClick}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-[#8E8070] bg-[#FAF8F5] text-xs font-medium text-[#8E8070] hover:text-[#2C2A29] hover:bg-[#EAE4D9]/20 transition-all cursor-pointer"
                title="Enter closed studio preview password"
              >
                🔑 Guest Access
              </button>


              <button
                id="btn_toggle_login"
                onClick={() => {
                  setLoginError('');
                  setShowLoginModal(true);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded border border-[#EAE4D9] bg-[#FAF8F5] text-xs font-medium text-[#7E776F] hover:text-[#2C2A29] hover:bg-[#EAE4D9]/40 transition-all cursor-pointer"
              >
                <Shield className="w-3.5 h-3.5" />
                Artist Access
              </button>
            </div>
          )}
        </div>

      </div>
    </header>
  );
}
