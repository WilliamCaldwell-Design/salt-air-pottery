/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Camera, Plus } from 'lucide-react';
import { db } from './services/db';
import { Artwork, UserSession } from './types';
import { AnimatePresence } from 'motion/react';

// Importing decomposed subcomponents
import Header from './components/Header';
import NotificationToast from './components/NotificationToast';
import CategoryFilters from './components/CategoryFilters';
import ArtworkCard from './components/ArtworkCard';
import ArtworkDetailModal from './components/ArtworkDetailModal';
import ArtworkFormModal from './components/ArtworkFormModal';
import LoginModal from './components/LoginModal';
import GuestAccessModal from './components/GuestAccessModal';
import GuestInviteModal from './components/GuestInviteModal';

export default function App() {
  // Artworks state loaded from database service
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // Search and Category Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  
  // High-performance loading system: Limit initial renders to prevent browser/network lag
  const [visibleCount, setVisibleCount] = useState<number>(12);
  
  // Reset visible count back to the initial page size when filters change
  useEffect(() => {
    setVisibleCount(12);
  }, [searchQuery, selectedCategory]);
  
  // Auth state
  const [session, setSession] = useState<UserSession>({ isAdmin: false });
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);
  const [showGuestAccessModal, setShowGuestAccessModal] = useState<boolean>(false);
  const [showGuestInviteModal, setShowGuestInviteModal] = useState<boolean>(false);
  
  // Modal states
  const [selectedArtwork, setSelectedArtwork] = useState<Artwork | null>(null);
  const [showFormModal, setShowFormModal] = useState<boolean>(false);
  const [editingArtwork, setEditingArtwork] = useState<Artwork | null>(null);
  
  // Developer and Publish notifications state
  const [publishNotification, setPublishNotification] = useState<string | null>(null);

  // Curtains closed state (persisted in localStorage and synchronized with server)
  const [curtainsClosed, setCurtainsClosed] = useState<boolean>(() => {
    return localStorage.getItem('pottery_diary_curtains_closed') === 'true';
  });
  
  // Thoughts hidden state (persisted in localStorage and synchronized with server)
  const [thoughtsHidden, setThoughtsHidden] = useState<boolean>(() => {
    return localStorage.getItem('pottery_diary_thoughts_hidden') === 'true';
  });

  const [logoFailed, setLogoFailed] = useState<boolean>(false);

  // Environment check to decide if we are in development mode (not the published site)
  const isDevEnvironment = useMemo(() => {
    return (
      (import.meta as any).env?.DEV ||
      window.location.hostname.includes('-dev-') ||
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1'
    );
  }, []);

  // Fetch global settings from backend Express store
  const loadGlobalSettings = async () => {
    try {
      const res = await fetch('/api/public-settings');
      if (res.ok) {
        const data = await res.json();
        if (typeof data.curtainsClosed === 'boolean' && data.curtainsClosed !== curtainsClosed) {
          setCurtainsClosed(data.curtainsClosed);
          localStorage.setItem('pottery_diary_curtains_closed', String(data.curtainsClosed));
        }
        if (typeof data.thoughtsHidden === 'boolean' && data.thoughtsHidden !== thoughtsHidden) {
          setThoughtsHidden(data.thoughtsHidden);
          localStorage.setItem('pottery_diary_thoughts_hidden', String(data.thoughtsHidden));
        }
      }
    } catch (err) {
      console.warn('[Sync] Could not automatically pull global settings from backend:', err);
    }

    try {
      const resInv = await fetch('/api/guest-invitations');
      if (resInv.ok) {
        const dataInv = await resInv.json();
        if (Array.isArray(dataInv)) {
          localStorage.setItem('pottery_diary_guest_invitations', JSON.stringify(dataInv));
        }
      }
    } catch (err) {
      console.warn('[Sync] Could not automatically pull guest invitations from backend:', err);
    }
  };

  const handleToggleCurtains = async () => {
    const nextVal = !curtainsClosed;
    setCurtainsClosed(nextVal);
    localStorage.setItem('pottery_diary_curtains_closed', String(nextVal));
    
    try {
      await fetch('/api/public-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ curtainsClosed: nextVal })
      });
    } catch (err) {
      console.error('[Sync] Failed to post curtains state to server:', err);
    }

    if (nextVal) {
      setPublishNotification('The curtains have been closed. Guests will now see the studio landing page.');
    } else {
      setPublishNotification('The curtains are now drawn. The full gallery is open to all visitors.');
    }
    setTimeout(() => setPublishNotification(null), 5000);
  };

  const handleToggleThoughts = async () => {
    const nextVal = !thoughtsHidden;
    setThoughtsHidden(nextVal);
    localStorage.setItem('pottery_diary_thoughts_hidden', String(nextVal));

    try {
      await fetch('/api/public-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ thoughtsHidden: nextVal })
      });
    } catch (err) {
      console.error('[Sync] Failed to post thoughts state to server:', err);
    }

    if (nextVal) {
      setPublishNotification('Your thoughts and notes on works have been hidden from public view.');
    } else {
      setPublishNotification('Your thoughts and notes are now visible to all visitors.');
    }
    setTimeout(() => setPublishNotification(null), 5000);
  };

  const verifySession = () => {
    const cachedAdmin = localStorage.getItem('pottery_diary_admin');
    if (cachedAdmin === 'true') {
      setSession(prev => prev.isAdmin ? prev : { isAdmin: true, username: 'Studio Artist' });
      return;
    }

    const cachedGuest = localStorage.getItem('pottery_diary_guest_session');
    if (cachedGuest) {
      try {
        const guestData = JSON.parse(cachedGuest);
        const savedInvitesStr = localStorage.getItem('pottery_diary_guest_invitations');
        let isValidGuest = false;
        if (savedInvitesStr) {
          const invites = JSON.parse(savedInvitesStr);
          const match = invites.find((inv: any) => inv.code.toLowerCase() === guestData.guestCodeUsed?.toLowerCase());
          if (match && (!match.expiresAt || Date.now() < match.expiresAt)) {
            isValidGuest = true;
          }
        }
        if (isValidGuest) {
          setSession(prev => (prev.isGuest && prev.guestCodeUsed === guestData.guestCodeUsed) ? prev : { isAdmin: false, isGuest: true, guestCodeUsed: guestData.guestCodeUsed });
        } else {
          localStorage.removeItem('pottery_diary_guest_session');
          setSession(prev => {
            if (prev.isGuest) {
              setPublishNotification('Your Guest Pass has expired or has been revoked by the artist.');
              setTimeout(() => setPublishNotification(null), 6000);
            }
            return { isAdmin: false };
          });
        }
      } catch (err) {
        console.error('Failed to parse guest session:', err);
      }
    } else {
      setSession(prev => {
        if (prev.isGuest) {
          return { isAdmin: false };
        }
        return prev;
      });
    }
  };

  // Persist session admin state in local storage for a smooth experience which persists reloads
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('dev') === 'true' || params.get('developer') === 'true' || params.get('admin') === 'true') {
      setSession({ isAdmin: true, username: 'Studio Artist' });
      localStorage.setItem('pottery_diary_admin', 'true');
      setPublishNotification('Success: Logged in via Developer Quick Link!');
      setTimeout(() => setPublishNotification(null), 6000);
      window.history.replaceState({}, '', window.location.pathname);
    } else {
      verifySession();
    }
    loadArtworks();
    loadGlobalSettings();

    const interval = setInterval(() => {
      verifySession();
      loadGlobalSettings();
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Fetch artworks from service
  const loadArtworks = async () => {
    setIsLoading(true);
    try {
      const data = await db.getArtworks();
      setArtworks(data);
    } catch (e) {
      console.error('Failed to load artworks timeline:', e);
    } finally {
      setIsLoading(false);
    }
  };

  // Extract unique categories dynamically based on actual artworks in state
  const uniqueCategories = useMemo(() => {
    const list = artworks.map((a) => a.category).filter(Boolean);
    const unique = Array.from(new Set(list));
    return unique.sort();
  }, [artworks]);

  const handleLogout = () => {
    setSession({ isAdmin: false });
    localStorage.removeItem('pottery_diary_admin');
    localStorage.removeItem('pottery_diary_guest_session');
    setSelectedArtwork(null); // Close active inspect panels to stay neat
  };

  const handlePublish = () => {
    setPublishNotification('All changes successfully published to Guest View! Transited to Guest Mode.');
    handleLogout();
    setTimeout(() => {
      setPublishNotification(null);
    }, 6000);
  };

  // Open modal in Create mode
  const openCreateModal = () => {
    setEditingArtwork(null);
    setShowFormModal(true);
  };

  // Open modal in Edit mode
  const openEditModal = (artwork: Artwork, e?: React.MouseEvent) => {
    if (e) e.stopPropagation(); // Avoid triggering details modal
    setEditingArtwork(artwork);
    setSelectedArtwork(null);
    setShowFormModal(true);
  };

  // Delete artwork handler
  const handleDeleteArtwork = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this pottery diary entry? This action is permanent.')) {
      try {
        await db.deleteArtwork(id);
        await loadArtworks();
        if (selectedArtwork?.id === id) {
          setSelectedArtwork(null);
        }
      } catch (err) {
        console.error('Failed to delete element:', err);
      }
    }
  };

  // Form submission: Saves new or updates existing art diary entries
  const handleFormSubmit = async (payload: Omit<Artwork, 'createdAt'> & { createdAt?: number }) => {
    try {
      setIsLoading(true);
      const artworkPayload = {
        ...payload,
        createdAt: payload.createdAt || Date.now(),
      };
      await db.saveArtwork(artworkPayload as Artwork);
      setShowFormModal(false);
      setEditingArtwork(null);
      await loadArtworks();
    } catch (err) {
      console.error('Error recording entry to diary:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter and Search calculations
  const filteredArtworks = useMemo(() => {
    return artworks.filter(art => {
      const categoryMatch = selectedCategory === 'All' || art.category.toLowerCase() === selectedCategory.toLowerCase();
      const query = searchQuery.toLowerCase().trim();
      if (!query) return categoryMatch;
      
      const textMatch = 
        art.title.toLowerCase().includes(query) ||
        art.category.toLowerCase().includes(query) ||
        art.notes.toLowerCase().includes(query) ||
        (art.clayType && art.clayType.toLowerCase().includes(query)) ||
        (art.glaze && art.glaze.toLowerCase().includes(query)) ||
        (art.firingTemp && art.firingTemp.toLowerCase().includes(query));
        
      return categoryMatch && textMatch;
    });
  }, [artworks, selectedCategory, searchQuery]);

  // Keyboard accessibility
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedArtwork(null);
        setShowLoginModal(false);
        setShowFormModal(false);
        setShowGuestAccessModal(false);
        setShowGuestInviteModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const isBypassed = session.isAdmin || session.isGuest;

  if (curtainsClosed && !isBypassed) {
    return (
      <div id="app_root" className="min-h-screen bg-[#FAF8F5] text-[#2C2A29] font-sans selection:bg-[#EAE4D9] flex flex-col justify-between">
        {/* Dynamic Notification Toast Bar */}
        <AnimatePresence>
          {publishNotification && (
            <NotificationToast
              message={publishNotification}
              onDismiss={() => setPublishNotification(null)}
            />
          )}
        </AnimatePresence>

        {/* Classy Curtains Closed centered panel */}
        <div id="curtains_closed_view" className="flex-1 flex flex-col items-center justify-center px-4 py-16 sm:py-24 text-center select-none relative overflow-hidden">
          {/* Brand Logo Centered with Overlap */}
          <div className="relative flex items-center justify-center h-48 w-full max-w-xs sm:max-w-sm mx-auto mb-10 select-none overflow-visible">
            {/* Emblem logo (even larger & overlapping from background style) */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 sm:w-80 sm:h-80 pointer-events-none flex items-center justify-center transition-all">
              {!logoFailed ? (
                <img
                  src="/logo.png"
                  alt=""
                  onError={() => setLogoFailed(true)}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-contain"
                  style={{ filter: 'sepia(0.8) hue-rotate(15deg) saturate(125%) brightness(1.4) contrast(0.75) opacity(0.18)' }}
                />
              ) : (
                <svg 
                  className="w-56 h-56 text-[#DECEBE] stroke-[1px] opacity-25" 
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
            <div className="relative z-10 flex flex-col items-center justify-center text-center w-full">
              <h1 className="text-4xl sm:text-5xl font-serif text-[#2C2A29] font-light leading-none select-none tracking-tight">
                Salt Air
              </h1>
              <p className="text-[12px] sm:text-[13px] tracking-[0.42em] mr-[-0.42em] text-black font-bold uppercase mt-1 font-mono leading-none select-none">
                Pottery
              </p>
            </div>
          </div>

          {/* Classy message card */}
          <div className="max-w-md w-full mx-auto space-y-6 relative z-10 bg-white/45 backdrop-blur-md p-8 rounded-xl border border-[#EAE4D9]/60 shadow-xs">
            <div className="space-y-3">
              <div className="flex items-center justify-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#8E8070] animate-pulse"></span>
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#8E8376]">Studio Status</span>
              </div>
              <h2 className="text-lg font-serif italic text-[#5C5346]">Curtains Closed</h2>
              <p className="text-sm text-[#7E776F] font-light leading-relaxed">
                Public viewings are not open at the moment. Please visit again later to see what we've created.
              </p>
            </div>

            <div className="pt-6 border-t border-[#EAE4D9]/60 flex flex-wrap items-center justify-center gap-3">
              <button
                id="btn_curtain_guest_access"
                onClick={() => setShowGuestAccessModal(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded border border-[#8E8070] bg-[#8E8070] hover:bg-[#7E7061] text-xs font-mono tracking-wider uppercase text-white shadow-xs transition-all duration-300 transform active:scale-95 cursor-pointer font-medium"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
                Guest Access
              </button>

              <button
                id="btn_curtain_artist_login"
                onClick={() => setShowLoginModal(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded border border-[#EAE4D9] bg-white hover:bg-[#FAF8F5] text-xs font-mono tracking-wider uppercase text-[#4A433A] hover:text-black shadow-xs transition-all duration-300 transform active:scale-95 cursor-pointer"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                Artist Access
              </button>
            </div>
          </div>
        </div>

        {/* Simple minimal footer */}
        <footer className="py-6 text-center border-t border-[#EAE4D9]/40 bg-[#F2EDEA]/30 text-[10px] font-mono text-[#A49A8F] tracking-widest uppercase">
          © {new Date().getFullYear()} Salt Air Pottery
        </footer>

        {/* Developer Action Toggle Button */}
        {isDevEnvironment && (
          <button
            id="dev_toggle_curtains_fixed"
            onClick={() => {
              setCurtainsClosed(false);
              localStorage.setItem('pottery_diary_curtains_closed', 'false');
            }}
            className="fixed bottom-4 right-4 z-50 bg-amber-600 hover:bg-amber-700 text-white font-mono text-xs px-4 py-2.5 rounded-full shadow-lg border border-amber-800 flex items-center gap-1.5 transition-all select-none hover:scale-[1.03] active:scale-[0.97] cursor-pointer"
            title="Developer Only: Draw back curtains to view settings"
          >
            <span>🛠️ Dev: Open Curtains</span>
          </button>
        )}

        {/* 🔐 SUBTLE ARTIST LOGIN PASSCODE MODAL */}
        {showLoginModal && (
          <LoginModal
            onClose={() => setShowLoginModal(false)}
            onLoginSuccess={(username) => {
              setSession({ isAdmin: true, username });
              localStorage.setItem('pottery_diary_admin', 'true');
              setShowLoginModal(false);
            }}
            isAdmin={session.isAdmin}
          />
        )}

        {/* 🔑 GUEST ACCESS CODE MODAL */}
        {showGuestAccessModal && (
          <GuestAccessModal
            onClose={() => setShowGuestAccessModal(false)}
            onLoginSuccess={(code) => {
              const guestSess = { isGuest: true, guestCodeUsed: code };
              setSession({ isAdmin: false, isGuest: true, guestCodeUsed: code });
              localStorage.setItem('pottery_diary_guest_session', JSON.stringify(guestSess));
              setShowGuestAccessModal(false);
              setPublishNotification('Welcome, Guest! Access code successfully validated.');
              setTimeout(() => setPublishNotification(null), 5000);
            }}
          />
        )}
      </div>
    );
  }

  return (
    <div id="app_root" className="min-h-screen bg-[#FAF8F5] text-[#2C2A29] font-sans selection:bg-[#EAE4D9]">
      
      {/* HEADER SECTION */}
      <Header
        session={session}
        openCreateModal={openCreateModal}
        handlePublish={handlePublish}
        handleLogout={handleLogout}
        setSession={setSession}
        setPublishNotification={setPublishNotification}
        setShowLoginModal={setShowLoginModal}
        setLoginError={() => {}}
        onGuestAccessClick={() => setShowGuestAccessModal(true)}
        onGuestInviteClick={() => setShowGuestInviteModal(true)}
      />

      {/* CURTAINS CLOSED WARNING FOR LOGGED IN ARTIST */}
      {curtainsClosed && session.isAdmin && (
        <div 
          id="curtains_closed_admin_warning"
          className="bg-[#FAF8F5] border-b border-[#DECEBE] text-[#A4433A] text-center text-xs sm:text-sm font-serif italic py-3 px-4 flex flex-wrap items-center justify-center gap-3 select-none shadow-xs animate-fade-in"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse shrink-0"></span>
          <span>Curtains are currently closed. Visitors only see the landing page.</span>
          <button
            onClick={handleToggleCurtains}
            className="bg-[#4A433A] text-white hover:bg-[#38322B] font-mono text-[10px] uppercase tracking-wider px-3 py-1 rounded shadow-xs transition-all cursor-pointer"
          >
            Open Curtains
          </button>
        </div>
      )}

      {/* THOUGHTS HIDDEN WARNING FOR LOGGED IN ARTIST */}
      {thoughtsHidden && session.isAdmin && (
        <div 
          id="thoughts_hidden_admin_warning"
          className="bg-[#FAF8F5] border-b border-[#DECEBE] text-[#8E8070] text-center text-xs sm:text-sm font-serif italic py-3 px-4 flex flex-wrap items-center justify-center gap-3 select-none shadow-xs animate-fade-in"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-[#8E8070] animate-pulse shrink-0"></span>
          <span>Artistic thoughts & firing diary notes are currently hidden from public view. Only you can see them.</span>
          <button
            onClick={handleToggleThoughts}
            className="bg-[#4A433A] text-white hover:bg-[#38322B] font-mono text-[10px] uppercase tracking-wider px-3 py-1 rounded shadow-xs transition-all cursor-pointer"
          >
            Show Thoughts
          </button>
        </div>
      )}

      {/* DYNAMIC NOTIFICATION TOAST BAR */}
      <AnimatePresence>
        {publishNotification && (
          <NotificationToast
            message={publishNotification}
            onDismiss={() => setPublishNotification(null)}
          />
        )}
      </AnimatePresence>

      {/* DASHBOARD GRID FILTERS & CONTROLS */}
      <main id="diary_dashboard" className="max-w-7xl mx-auto px-4 sm:px-8 pt-8 sm:pt-12 pb-20">
        
        {/* Dynamic Filtering category pills & search bar */}
        <CategoryFilters
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          uniqueCategories={uniqueCategories}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />

        {/* LOADING INDICATOR */}
        {isLoading ? (
          <div className="py-24 text-center flex flex-col items-center justify-center gap-3">
            <div className="w-10 h-10 border-4 border-[#8E8070]/30 border-t-[#8E8070] rounded-full animate-spin"></div>
            <p className="text-sm font-mono text-[#8E8376]">Loading diary entries...</p>
          </div>
        ) : filteredArtworks.length === 0 ? (
          /* EMPTY STATE */
          <div className="bg-[#F2EDEA]/50 border border-dashed border-[#DECEBE] rounded-xl py-20 text-center px-4">
            <Camera className="w-12 h-12 text-[#A49A8F] mx-auto mb-4 stroke-[1.25]" />
            <p className="text-lg font-serif italic text-[#5C554D]">No works match your criteria</p>
            <p className="text-xs font-mono text-[#8E8376] mt-2">
              {searchQuery ? 'Try matching generic elements or clearing terms.' : 'Create a diary entry to get started.'}
            </p>
            {session.isAdmin && (
              <button
                onClick={openCreateModal}
                className="mt-6 inline-flex items-center gap-1.5 bg-[#4A433A] text-white px-4 py-2 rounded text-xs tracking-wider uppercase font-medium hover:bg-[#38322B] transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Log First Artwork
              </button>
            )}
          </div>
        ) : (
          /* MULTI-GRID GALLERY PORTFOLIO */
          <div className="space-y-12">
            <div id="pottery_grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12 animate-fade-in">
              {filteredArtworks.slice(0, visibleCount).map((art) => (
                <ArtworkCard
                  key={art.id}
                  artwork={art}
                  isAdmin={session.isAdmin}
                  thoughtsHidden={thoughtsHidden}
                  onSelect={setSelectedArtwork}
                  onEdit={openEditModal}
                  onDelete={(id, e) => handleDeleteArtwork(id, e)}
                />
              ))}
            </div>

            {/* HIGH-PERFORMANCE PROGRESSIVE PAGINATION SYSTEM */}
            {filteredArtworks.length > visibleCount && (
              <div className="flex flex-col items-center justify-center pt-4 pb-8 border-t border-[#ECE6E0]/60 select-none">
                <button
                  onClick={() => setVisibleCount((prev) => prev + 12)}
                  className="group inline-flex items-center gap-2.5 bg-white border border-[#DECEBE] hover:border-[#8E8070] text-[#4A433A] px-6 py-3 rounded-lg text-xs font-mono uppercase tracking-widest transition-all shadow-xs hover:shadow-sm cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                >
                  <span>Display More Creations</span>
                  <span className="text-[#8E8376] font-normal group-hover:text-[#4A433A] transition-colors">
                    ({filteredArtworks.length - visibleCount} remaining)
                  </span>
                </button>
                <p className="text-[10px] text-[#A49A8F] font-mono uppercase tracking-wider mt-3">
                  Showing {visibleCount} of {filteredArtworks.length} items
                </p>
              </div>
            )}
          </div>
        )}

      </main>

      {/* FOOTER SECTION */}
      <footer id="main_footer" className="bg-[#F2EDEA] border-t border-[#DECEBE] py-12 px-4 sm:px-8 mt-12 text-[#6E6A64]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex flex-col gap-1">
            <p className="text-sm font-serif font-light text-[#2C2A29]">
              Salt Air Pottery Portfolio
            </p>
            <p className="text-xs text-[#8E8376] font-mono">
              For the simple pleasure of creating things that bring us joy.
            </p>
          </div>
          
          <div className="flex items-center gap-4 text-xs font-mono flex-wrap md:justify-end">
            <span>© {new Date().getFullYear()} Artist Diary</span>
            <span className="text-[#DECEBE]">&bull;</span>
            {session.isAdmin && (
              <>
                <button
                  id="footer_btn_invite_guest"
                  onClick={() => setShowGuestInviteModal(true)}
                  className="font-medium text-[#5C5346] hover:text-black underline underline-offset-4 cursor-pointer flex items-center gap-1.5"
                  title="Generate and manage guest passes"
                >
                  ✉️ Invite Guest
                </button>
                <span className="text-[#DECEBE]">&bull;</span>
                <button
                  id="footer_btn_toggle_curtains"
                  onClick={handleToggleCurtains}
                  className="font-medium text-[#A4433A] hover:text-red-800 underline underline-offset-4 cursor-pointer flex items-center gap-1.5"
                  title={curtainsClosed ? "Show full studio website to everyone" : "Hide entire catalog from visitors"}
                >
                  {curtainsClosed ? '🔓 Open Curtains' : '🔒 Close Curtains'}
                </button>
                <span className="text-[#DECEBE]">&bull;</span>
                <button
                  id="footer_btn_toggle_thoughts"
                  onClick={handleToggleThoughts}
                  className="font-medium text-[#8E8070] hover:text-stone-800 underline underline-offset-4 cursor-pointer flex items-center gap-1.5"
                  title={thoughtsHidden ? "Show thoughts & notes to public" : "Hide notes & thoughts sections from public"}
                >
                  {thoughtsHidden ? '🔓 Show Thoughts' : '🔒 Hide Thoughts'}
                </button>
                <span className="text-[#DECEBE]">&bull;</span>
              </>
            )}
            <button 
              onClick={() => {
                setShowLoginModal(true);
              }}
              className="hover:text-[#2C2A29] underline underline-offset-4 cursor-pointer"
            >
              {session.isAdmin ? 'Manage' : 'Artist Login'}
            </button>
          </div>
        </div>
      </footer>

      {/* ======================================= */}
      {/* 🔐 SUBTLE ARTIST LOGIN PASSCODE MODAL */}
      {/* ======================================= */}
      {showLoginModal && (
        <LoginModal
          onClose={() => setShowLoginModal(false)}
          onLoginSuccess={(username) => {
            setSession({ isAdmin: true, username });
            localStorage.setItem('pottery_diary_admin', 'true');
            setShowLoginModal(false);
          }}
          isAdmin={session.isAdmin}
        />
      )}

      {/* ======================================= */}
      {/* ✉️ ADMIN GUEST INVITATION MANAGEMENT MODAL */}
      {/* ======================================= */}
      {showGuestInviteModal && (
        <GuestInviteModal
          onClose={() => setShowGuestInviteModal(false)}
          onUpdate={() => {
            verifySession();
          }}
        />
      )}

      {/* ======================================= */}
      {/* 🔑 GUEST GALLERY ACCESS PASSCODE MODAL */}
      {/* ======================================= */}
      {showGuestAccessModal && (
        <GuestAccessModal
          onClose={() => setShowGuestAccessModal(false)}
          onLoginSuccess={(code) => {
            const guestSess = { isGuest: true, guestCodeUsed: code };
            setSession({ isAdmin: false, isGuest: true, guestCodeUsed: code });
            localStorage.setItem('pottery_diary_guest_session', JSON.stringify(guestSess));
            setShowGuestAccessModal(false);
            setPublishNotification('Welcome, Guest! Access code successfully validated.');
            setTimeout(() => setPublishNotification(null), 5000);
          }}
        />
      )}

      {/* ======================================= */}
      {/* 🖼️ PUBLIC & ADMIN ARTWORK DETAILS MODAL */}
      {/* ======================================= */}
      {selectedArtwork && (
        <ArtworkDetailModal
          artwork={selectedArtwork}
          isAdmin={session.isAdmin}
          thoughtsHidden={thoughtsHidden}
          onClose={() => setSelectedArtwork(null)}
          onEdit={openEditModal}
          onDelete={(id, e) => handleDeleteArtwork(id, e)}
        />
      )}

      {/* ======================================= */}
      {/* 📝 ADMIN ADD / EDIT ARTWORK MODAL */}
      {/* ======================================= */}
      {showFormModal && (
        <ArtworkFormModal
          editingArtwork={editingArtwork}
          uniqueCategories={uniqueCategories}
          onClose={() => {
            setShowFormModal(false);
            setEditingArtwork(null);
          }}
          onSubmit={handleFormSubmit}
        />
      )}

      {/* Developer Action Toggle Buttons */}
      {isDevEnvironment && (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2.5 items-end">
          <button
            id="dev_toggle_thoughts_fixed"
            onClick={handleToggleThoughts}
            className="bg-stone-650 hover:bg-stone-750 text-white font-mono text-xs px-4 py-2.5 rounded-full shadow-lg border border-stone-800 flex items-center gap-1.5 transition-all select-none hover:scale-[1.03] active:scale-[0.97] cursor-pointer"
            title="Developer Only: Toggle Hide Thoughts setting"
          >
            <span>🛠️ Dev: {thoughtsHidden ? '🔓 Show Thoughts' : '🔒 Hide Thoughts'} (Preview)</span>
          </button>
          
          <button
            id="dev_toggle_curtains_fixed"
            onClick={handleToggleCurtains}
            className="fixed-custom-dev-avoid bg-amber-600 hover:bg-amber-700 text-white font-mono text-xs px-4 py-2.5 rounded-full shadow-lg border border-amber-800 flex items-center gap-1.5 transition-all select-none hover:scale-[1.03] active:scale-[0.97] cursor-pointer"
            title="Developer Only: Toggle Close Curtains setting"
          >
            <span>🛠️ Dev: {curtainsClosed ? '🔓 Open Curtains' : '🔒 Close Curtains'} (Preview)</span>
          </button>
        </div>
      )}

    </div>
  );
}
