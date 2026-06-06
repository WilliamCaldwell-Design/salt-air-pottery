/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Artwork {
  id: string;
  title: string;
  category: string;
  date: string; // YYYY-MM-DD
  notes: string;
  images: string[]; // URLs or base64 data strings
  clayType?: string;
  firingTemp?: string; // e.g. "Cone 6", "Cone 10"
  glaze?: string;
  dimensions?: string; // e.g. "12 x 12 x 20 cm"
  createdAt: number; // timestamp for exact chronological ordering
}

export interface UserSession {
  isAdmin: boolean;
  username?: string;
  isGuest?: boolean;
  guestCodeUsed?: string;
}

export interface GuestInvitation {
  id: string;
  code: string;
  duration: '1' | '7' | 'permanent';
  createdAt: number;
  expiresAt: number | null;
}
