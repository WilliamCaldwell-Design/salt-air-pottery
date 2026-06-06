/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';

interface NotificationToastProps {
  message: string;
  onDismiss: () => void;
}

export default function NotificationToast({ message, onDismiss }: NotificationToastProps) {
  return (
    <div className="fixed top-24 sm:top-28 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-md pointer-events-none">
      <motion.div
        id="publish_notification_bar"
        initial={{ opacity: 0, y: -12, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -12, scale: 0.95 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="pointer-events-auto bg-[#FAF8F5]/95 backdrop-blur-md border border-[#EAE4D9] px-5 py-3.5 rounded-xl text-center text-xs sm:text-sm font-serif italic text-[#5C5346] flex items-center justify-between gap-3 shadow-xl shadow-stone-200/60"
      >
        <div className="flex items-center gap-2.5 w-full justify-center">
          <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block animate-pulse shrink-0 animate-duration-1000"></span>
          <span className="leading-relaxed font-serif text-[#5C5346]">{message}</span>
        </div>
        <button 
          onClick={onDismiss} 
          className="ml-2 font-sans hover:text-[#2C2A29] font-bold text-lg cursor-pointer hover:scale-110 transition-transform p-1 select-none flex items-center justify-center shrink-0 opacity-70 hover:opacity-100"
          title="Dismiss notification"
        >
          &times;
        </button>
      </motion.div>
    </div>
  );
}
