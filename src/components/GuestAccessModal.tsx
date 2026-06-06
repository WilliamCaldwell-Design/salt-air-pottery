/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Key, Calendar, Clock } from 'lucide-react';
import { GuestInvitation } from '../types';

interface GuestAccessModalProps {
  onClose: () => void;
  onLoginSuccess: (code: string) => void;
}

export default function GuestAccessModal({ onClose, onLoginSuccess }: GuestAccessModalProps) {
  const [accessCode, setAccessCode] = useState<string>('');
  const [error, setError] = useState<string>('');

  const handleAccessSubmit = (e?: React.FormEvent | React.KeyboardEvent) => {
    if (e) e.preventDefault();
    const cleanCode = accessCode.trim().toLowerCase();

    if (!cleanCode) {
      setError('Please enter an access code.');
      return;
    }

    // Retrieve active invitations from localStorage
    const savedInvitesStr = localStorage.getItem('pottery_diary_guest_invitations');
    let invites: GuestInvitation[] = [];
    try {
      if (savedInvitesStr) {
        invites = JSON.parse(savedInvitesStr);
      }
    } catch (err) {
      console.error('Failed to parse guest invitations:', err);
    }

    // Seek matched invitation (case-insensitive)
    const match = invites.find(inv => inv.code.toLowerCase() === cleanCode);

    if (!match) {
      setError('Invalid Access Code. Please verify your code or contact the studio artist.');
      return;
    }

    // Check if invitation is expired
    if (match.expiresAt && Date.now() > match.expiresAt) {
      setError('This access code has expired. Please request a new invitation from the artist.');
      return;
    }

    // Valid invitation! Access granted.
    onLoginSuccess(match.code);
  };

  return (
    <div id="guest_access_modal_backdrop" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
      <div 
        id="guest_access_modal_panel" 
        className="w-full max-w-sm bg-[#FAF8F5] border border-[#DECEBE] rounded-lg shadow-xl overflow-hidden p-6 relative"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-[#EAE4D9] text-[#7E776F] hover:text-[#2C2A29] transition-all cursor-pointer"
        >
          <X className="w-4.5 h-4.5" />
        </button>

        <div className="text-center mb-6">
          <span className="inline-flex p-3 rounded-full bg-[#EAE4D9]/80 text-[#5C5346] mx-auto mb-3">
            <Key className="w-5 h-5" />
          </span>
          <h2 className="text-xl font-serif text-[#2C2A29] font-normal">
            Private Guest Viewing
          </h2>
          <p className="text-xs text-[#7E776F] mt-1 font-mono">
            Enter your active invitation code to bypass curtains closed.
          </p>
        </div>

        <div 
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleAccessSubmit(e);
            }
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider text-[#7E776F] mb-1.5">
              Guest Access Code
            </label>
            <input
              type="text"
              placeholder="e.g. guest-clay-pass"
              value={accessCode}
              onChange={(e) => {
                setAccessCode(e.target.value);
                setError('');
              }}
              className="w-full bg-[#F2EDEA] border border-[#DECEBE] rounded-lg px-3 py-2 text-sm text-[#2C2A29] placeholder-[#A29A90] focus:outline-none focus:border-[#8E8070] text-center tracking-normal font-mono"
              autoFocus
            />
          </div>

          {error && (
            <div className="p-2.5 bg-rose-50 text-rose-700 text-xs rounded border border-rose-200 text-center leading-relaxed font-serif italic">
              {error}
            </div>
          )}

          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="w-1/2 px-4 py-2 text-xs font-medium border border-[#DECEBE] rounded text-[#7E776F] hover:bg-[#EAE4D9]/30 transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => handleAccessSubmit()}
              className="w-1/2 px-4 py-2 text-xs font-medium bg-[#4A433A] text-white rounded hover:bg-[#38322B] transition-all cursor-pointer"
            >
              Enter Gallery
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
