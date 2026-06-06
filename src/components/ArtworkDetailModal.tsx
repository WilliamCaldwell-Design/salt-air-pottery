/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Calendar, Edit3, Trash2, ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import { Artwork } from '../types';

interface ArtworkDetailModalProps {
  artwork: Artwork;
  isAdmin: boolean;
  thoughtsHidden?: boolean;
  onClose: () => void;
  onEdit: (artwork: Artwork, e: React.MouseEvent) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
}

export default function ArtworkDetailModal({
  artwork,
  isAdmin,
  thoughtsHidden = false,
  onClose,
  onEdit,
  onDelete,
}: ArtworkDetailModalProps) {
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);

  return (
    <div id="detail_modal_backdrop" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in overflow-y-auto">
      <div 
        id="detail_modal_panel" 
        className="w-full max-w-4xl bg-[#FAF8F5] border border-[#DECEBE] rounded-lg shadow-2xl overflow-hidden relative flex flex-col md:flex-row my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Floating button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/80 hover:bg-white text-[#2C2A29] shadow-md transition-all cursor-pointer border border-[#DECEBE]/40"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Left: Image Viewer Gallery */}
        <div className="w-full md:w-3/5 bg-[#F2EDEA] relative min-h-[300px] md:min-h-[500px] flex flex-col justify-between border-r border-[#ECE6E0]">
          
          {/* Main Image */}
          <div className="flex-1 flex items-center justify-center p-6 relative">
            <img
              src={artwork.images[activeImageIndex]}
              alt={artwork.title}
              className="max-h-[350px] md:max-h-[480px] w-auto object-contain rounded shadow-xs"
            />

            {/* Left/Right controls if multiple images exist */}
            {artwork.images.length > 1 && (
              <>
                <button
                  onClick={() => setActiveImageIndex(prev => prev === 0 ? artwork.images.length - 1 : prev - 1)}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-[#FAF8F5]/80 hover:bg-[#FAF8F5] text-[#2C2A29] hover:scale-105 shadow-sm transition-all cursor-pointer"
                >
                  <ChevronLeft className="w-4.5 h-4.5" />
                </button>
                <button
                  onClick={() => setActiveImageIndex(prev => prev === artwork.images.length - 1 ? 0 : prev + 1)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-[#FAF8F5]/80 hover:bg-[#FAF8F5] text-[#2C2A29] hover:scale-105 shadow-sm transition-all cursor-pointer"
                >
                  <ChevronRight className="w-4.5 h-4.5" />
                </button>
              </>
            )}
          </div>

          {/* Thumbnails Row if multiple images */}
          {artwork.images.length > 1 && (
            <div className="p-4 bg-[#FAF8F5]/50 border-t border-[#ECE6E0] flex items-center justify-center gap-2 overflow-x-auto">
              {artwork.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`w-12 h-12 rounded overflow-hidden border-2 transition-all ${
                    activeImageIndex === idx ? 'border-[#8E8070] scale-105 shadow-xs' : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="thumbnail" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Fine details & notes card catalog style */}
        <div className="w-full md:w-2/5 p-6 sm:p-8 flex flex-col justify-between max-h-[600px] overflow-y-auto w-full">
          <div>
            
            {/* Meta details with right padding to avoid close button overlap */}
            <div className="flex items-center gap-2 mb-3 pr-12">
              <span className="bg-[#4A433A] text-[#FAF8F5] text-[10px] font-mono uppercase tracking-widest px-2.5 py-0.5 rounded-sm">
                {artwork.category}
              </span>
              <span className="text-xs font-mono text-[#A29A90] ml-auto flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {artwork.date}
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-serif text-[#2C2A29] font-normal tracking-tight mb-4 pr-12">
              {artwork.title}
            </h2>

            <hr className="border-[#ECE6E0] mb-6" />

            {/* Main diary descriptions & thoughts */}
            {(!thoughtsHidden || isAdmin) && (
              <div className="space-y-3">
                <h4 className="text-sm sm:text-base font-mono uppercase tracking-wider text-[#7E776F] flex items-center gap-2 mb-2 font-semibold">
                  <FileText className="w-4 h-4 text-[#8E8070]" />
                  Thoughts
                  {isAdmin && thoughtsHidden && (
                    <span className="ml-2 text-[10px] sm:text-[11px] font-mono font-normal tracking-wide lowercase bg-[#FCFAF7] border border-amber-200 text-amber-700 px-2 py-0.5 rounded flex items-center gap-1 select-none shrink-0 normal-case">
                      🔒 Hidden from Public
                    </span>
                  )}
                </h4>
                <p className="text-sm sm:text-base text-[#5C554D] leading-relaxed italic font-serif">
                  "{artwork.notes}"
                </p>
              </div>
            )}

            {/* Technical Pottery Specifications */}
            {(artwork.clayType?.trim() || artwork.firingTemp?.trim() || artwork.glaze?.trim() || artwork.dimensions?.trim()) && (
              <div className="mt-8 pt-6 border-t border-[#ECE6E0] space-y-4">
                <h4 className="text-xs font-mono uppercase tracking-widest text-[#7E776F] font-semibold">
                  Specs &amp; Process
                </h4>
                <div className="grid grid-cols-2 gap-x-4 gap-y-3 bg-[#FCFAF7] p-4 border border-[#ECE6E0]/60 rounded-md">
                  {artwork.clayType?.trim() && (
                    <div>
                      <span className="block text-[9px] font-mono uppercase tracking-wider text-[#9E958A] mb-0.5">
                        Clay Type
                      </span>
                      <span className="text-xs sm:text-sm text-[#4A433A] font-medium">
                        {artwork.clayType}
                      </span>
                    </div>
                  )}
                  {artwork.firingTemp?.trim() && (
                    <div>
                      <span className="block text-[9px] font-mono uppercase tracking-wider text-[#9E958A] mb-0.5">
                        Firing Cycle / Cone
                      </span>
                      <span className="text-xs sm:text-sm text-[#4A433A] font-medium">
                        {artwork.firingTemp}
                      </span>
                    </div>
                  )}
                  {artwork.glaze?.trim() && (
                    <div>
                      <span className="block text-[9px] font-mono uppercase tracking-wider text-[#9E958A] mb-0.5">
                        Glaze Formula
                      </span>
                      <span className="text-xs sm:text-sm text-[#4A433A] font-medium">
                        {artwork.glaze}
                      </span>
                    </div>
                  )}
                  {artwork.dimensions?.trim() && (
                    <div>
                      <span className="block text-[9px] font-mono uppercase tracking-wider text-[#9E958A] mb-0.5">
                        Dimensions
                      </span>
                      <span className="text-xs sm:text-sm text-[#4A433A] font-mono font-medium">
                        {artwork.dimensions}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>

          {/* Admin specific prompt on bottom of details */}
          {isAdmin && (
            <div className="pt-8 mt-5 border-t border-[#ECE6E0] flex gap-3">
              <button
                onClick={(e) => onEdit(artwork, e)}
                className="flex-1 inline-flex items-center justify-center gap-1.5 bg-[#4A433A] text-white py-2 rounded text-xs font-medium hover:bg-[#38322B] transition-all cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                Edit Artwork Ledger
              </button>
              <button
                onClick={(e) => onDelete(artwork.id, e)}
                className="px-3 py-2 rounded border border-rose-200 text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
                title="Delete permanently"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
