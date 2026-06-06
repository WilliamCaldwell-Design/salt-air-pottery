/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { X, UserPlus, Copy, Check, Trash2, Clock, CalendarDays, KeyRound, Infinity } from 'lucide-react';
import { GuestInvitation } from '../types';

interface GuestInviteModalProps {
  onClose: () => void;
  onUpdate: () => void;
}

export default function GuestInviteModal({ onClose, onUpdate }: GuestInviteModalProps) {
  const [invitations, setInvitations] = useState<GuestInvitation[]>([]);
  const [newCode, setNewCode] = useState<string>('');
  const [duration, setDuration] = useState<'1' | '7' | 'permanent'>('1');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [error, setError] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Load invitations from localStorage
  const loadInvitations = () => {
    const saved = localStorage.getItem('pottery_diary_guest_invitations');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setInvitations(parsed);
      } catch (err) {
        console.error('Failed to parse guest invitations:', err);
      }
    } else {
      setInvitations([]);
    }
  };

  useEffect(() => {
    loadInvitations();
    generateSuggestedCode();
  }, []);

  const generateSuggestedCode = () => {
    const words = ['clay', 'stoneware', 'kiln', 'glaze', 'studio', 'wheel', 'handmade', 'pottery', 'artist', 'guest'];
    let code = '';
    do {
      const useSingleWord = Math.random() > 0.4;
      const randomWord1 = words[Math.floor(Math.random() * words.length)];
      const randomNum = Math.floor(100 + Math.random() * 900);
      
      if (useSingleWord) {
        code = `salt-${randomWord1}-${randomNum}`;
      } else {
        const randomWord2 = words[Math.floor(Math.random() * words.length)];
        code = `salt-${randomWord1}-${randomWord2}-${randomNum}`;
      }
    } while (code.length > 18);
    
    setNewCode(code);
  };

  const handleCreateInvitation = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    const codeClean = newCode.trim().toLowerCase();
    if (!codeClean) {
      setError('Please specify a valid code.');
      return;
    }

    if (codeClean.length < 4) {
      setError('The code must be at least 4 characters long.');
      return;
    }

    // Ensure it doesn't duplicate existing code
    if (invitations.some(inv => inv.code.toLowerCase() === codeClean)) {
      setError('This guest code already exists. Please choose a unique code.');
      return;
    }

    const now = Date.now();
    let expiresAt: number | null = null;
    if (duration === '1') {
      expiresAt = now + 24 * 60 * 60 * 1000;
    } else if (duration === '7') {
      expiresAt = now + 7 * 24 * 60 * 60 * 1000;
    }

    const newInvite: GuestInvitation = {
      id: String(Math.random().toString(36).substr(2, 9)),
      code: codeClean,
      duration,
      createdAt: now,
      expiresAt,
    };

    const updated = [newInvite, ...invitations];
    localStorage.setItem('pottery_diary_guest_invitations', JSON.stringify(updated));
    setInvitations(updated);
    setSuccessMsg(`Guest invitation "${codeClean}" created successfully!`);
    generateSuggestedCode();
    onUpdate();

    // Fade out success message after 3.5 seconds
    setTimeout(() => {
      setSuccessMsg('');
    }, 3500);
  };

  const handleRevokeInvitation = (id: string, code: string) => {
    if (confirmDeleteId !== id) {
      setConfirmDeleteId(id);
      // Auto cancel visual delete prompt after 4 seconds
      setTimeout(() => {
        setConfirmDeleteId(current => current === id ? null : current);
      }, 4000);
      return;
    }

    const updated = invitations.filter(inv => inv.id !== id);
    localStorage.setItem('pottery_diary_guest_invitations', JSON.stringify(updated));
    setInvitations(updated);
    setConfirmDeleteId(null);

    // If there's an active guest session using this revoked code, clear it immediately
    const cachedGuest = localStorage.getItem('pottery_diary_guest_session');
    if (cachedGuest) {
      try {
        const guestData = JSON.parse(cachedGuest);
        if (guestData.guestCodeUsed?.toLowerCase() === code.toLowerCase()) {
          localStorage.removeItem('pottery_diary_guest_session');
        }
      } catch (err) {
        console.error('Failed to parse guest session during revocation:', err);
      }
    }

    onUpdate();
  };

  const handleCopyCode = (id: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };

  const formatExpires = (inv: GuestInvitation) => {
    if (!inv.expiresAt) {
      return (
        <span className="flex items-center gap-1 text-[#5C5346] font-medium font-serif italic text-xs">
          <Infinity className="w-3.5 h-3.5 text-stone-400" />
          Permanent
        </span>
      );
    }

    const tRemaining = inv.expiresAt - Date.now();
    if (tRemaining <= 0) {
      return <span className="text-red-600 font-mono text-[10px] uppercase">Expired</span>;
    }

    const days = Math.floor(tRemaining / (24 * 60 * 60 * 1000));
    const hours = Math.floor((tRemaining % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));

    if (days > 0) {
      return (
        <span className="text-emerald-700 font-mono text-[10px]">
          Expires in {days}d {hours}h
        </span>
      );
    } else if (hours > 0) {
      return (
        <span className="text-amber-700 font-mono text-[10px]">
          Expires in {hours}h
        </span>
      );
    } else {
      return (
        <span className="text-amber-700 font-mono text-[10px] animate-pulse">
          Expires soon
        </span>
      );
    }
  };

  return (
    <div id="guest_invite_modal_backdrop" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
      <div 
        id="guest_invite_modal_panel" 
        className="w-full max-w-lg bg-[#FAF8F5] border border-[#DECEBE] rounded-lg shadow-xl overflow-hidden p-6 relative max-h-[85vh] flex flex-col"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-[#EAE4D9] text-[#7E776F] hover:text-[#2C2A29] transition-all cursor-pointer z-10"
        >
          <X className="w-4.5 h-4.5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-5 shrink-0">
          <span className="inline-flex p-3 rounded-full bg-[#EAE4D9]/80 text-[#5C5346] mx-auto mb-2">
            <UserPlus className="w-5 h-5" />
          </span>
          <h2 className="text-xl font-serif text-[#2C2A29] font-normal">
            Guest Invitations Manager
          </h2>
          <p className="text-xs text-[#7E776F] mt-1 font-mono">
            Create guest passes for specific guests during closed periods.
          </p>
        </div>

        {/* Modal Body - Scrollable content area */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-6">
          
          {/* Create New Invite Form Card */}
          <form onSubmit={handleCreateInvitation} className="bg-white/50 border border-[#EAE4D9] p-4.5 rounded-xl space-y-4">
            <h3 className="text-xs font-mono uppercase tracking-widest text-[#5C5346] font-semibold flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-[#8E8070]" />
              Issue New Invitation
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-[#7E776F] mb-1">
                  Access Code
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={newCode}
                    onChange={(e) => {
                      setNewCode(e.target.value.replace(/\s+/g, '-').trim());
                      setError('');
                    }}
                    placeholder="Enter pass-code"
                    className="w-full bg-[#FAF8F5] border border-[#DECEBE]/80 rounded px-2.5 py-1.5 text-xs font-mono text-[#2C2A29] placeholder-[#A29A90] focus:outline-none focus:border-[#8E8070]"
                  />
                  <button
                    type="button"
                    onClick={generateSuggestedCode}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] uppercase tracking-wider font-mono text-[#8E8070] hover:text-black font-semibold cursor-pointer"
                  >
                    Regen
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-[#7E776F] mb-1">
                  Access Duration
                </label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(e.target.value as any)}
                  className="w-full bg-[#FAF8F5] border border-[#DECEBE]/80 rounded px-2.5 py-1.5 text-xs text-[#2C2A29] focus:outline-none focus:border-[#8E8070] font-sans"
                >
                  <option value="1">1 Day (Temporary)</option>
                  <option value="7">7 Days (Weekly View)</option>
                  <option value="permanent">Permanent (Continuous)</option>
                </select>
              </div>
            </div>

            {error && (
              <p className="text-xs text-rose-700 font-serif italic text-center p-1 bg-rose-50/70 border border-rose-100 rounded">
                ⚠️ {error}
              </p>
            )}

            {successMsg && (
              <p className="text-xs text-emerald-800 font-serif italic text-center p-1 bg-emerald-50 border border-emerald-100 rounded">
                ✨ {successMsg}
              </p>
            )}

            <button
              type="submit"
              className="w-full py-2 bg-[#4A433A] hover:bg-[#38322B] text-white rounded text-xs font-mono uppercase tracking-wider transition-all duration-300 shadow-xs cursor-pointer"
            >
              Generate Guest Pass
            </button>
          </form>

          {/* List of Issued Keys */}
          <div className="space-y-3">
            <h3 className="text-xs font-mono uppercase tracking-widest text-[#5C5346] font-semibold">
              Active Guest Passes ({invitations.length})
            </h3>

            {invitations.length === 0 ? (
              <div className="text-center py-8 bg-stone-100/30 border border-dashed border-[#DECEBE]/50 rounded-xl">
                <Clock className="w-10 h-10 text-[#A49A8F]/60 mx-auto mb-2" />
                <p className="text-xs font-serif italic text-[#7E776F]">No guest invitations generated yet.</p>
                <p className="text-[10px] text-[#8E8376] font-mono mt-1">Use the generator tool above to issue codes.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                {invitations.map((inv) => (
                  <div 
                    key={inv.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-[#EAE4D9] bg-white transition-all hover:shadow-xs gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs text-[#2C2A29] font-medium select-all truncate">
                          {inv.code}
                        </span>
                        
                        <button
                          type="button"
                          onClick={() => handleCopyCode(inv.id, inv.code)}
                          className="p-1 rounded text-stone-400 hover:text-[#2C2A29] hover:bg-[#F2EDEA] transition-all cursor-pointer shrink-0"
                          title="Copy code to clipboard"
                        >
                          {copiedId === inv.id ? (
                            <Check className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>

                      <div className="flex items-center gap-2 mt-1 text-[10px] text-[#8E8376] font-mono">
                        <span className="flex items-center gap-1">
                          <CalendarDays className="w-3 h-3" />
                          Created: {new Date(inv.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      {formatExpires(inv)}

                      {confirmDeleteId === inv.id ? (
                        <button
                          type="button"
                          onClick={() => handleRevokeInvitation(inv.id, inv.code)}
                          className="bg-red-600 hover:bg-red-700 text-white font-mono text-[10px] uppercase tracking-wider px-2.5 py-1.5 rounded transition-all cursor-pointer font-bold shrink-0 animate-pulse border border-red-700"
                          title="Click again to confirm immediate revocation"
                        >
                          Confirm?
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleRevokeInvitation(inv.id, inv.code)}
                          className="p-1.5 rounded hover:bg-rose-50 text-stone-400 hover:text-rose-700 transition-all cursor-pointer shrink-0"
                          title="Revoke and cancel invitation"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Modal Footer Buttons */}
        <div className="pt-4 border-t border-[#EAE4D9]/80 mt-4 text-right shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-mono uppercase tracking-wider bg-[#F2EDEA] hover:bg-[#EAE4D9]/60 border border-[#DECEBE] rounded text-[#5C5346] hover:text-[#2C2A29] transition-all cursor-pointer"
          >
            Finished
          </button>
        </div>
      </div>
    </div>
  );
}
