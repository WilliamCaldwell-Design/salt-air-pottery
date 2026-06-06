/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Edit3, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Artwork } from '../types';

interface ArtworkCardProps {
  artwork: Artwork;
  isAdmin: boolean;
  thoughtsHidden?: boolean;
  onSelect: (artwork: Artwork) => void;
  onEdit: (artwork: Artwork, e: React.MouseEvent) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
}

export default function ArtworkCard({
  artwork,
  isAdmin,
  thoughtsHidden = false,
  onSelect,
  onEdit,
  onDelete,
}: ArtworkCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(0);

  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (artwork.images.length <= 1) return;
    setCurrentImageIndex((prev) => (prev === 0 ? artwork.images.length - 1 : prev - 1));
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (artwork.images.length <= 1) return;
    setCurrentImageIndex((prev) => (prev === artwork.images.length - 1 ? 0 : prev + 1));
  };

  return (
    <div
      id={`artwork_card_${artwork.id}`}
      onClick={() => onSelect(artwork)}
      className="group flex flex-col bg-[#FAF8F5] border border-[#ECE6E0] rounded-lg overflow-hidden cursor-pointer hover:border-[#D2C5B5] transition-all duration-300 relative shadow-xs"
    >
      {/* Visual Image container with subtle ratio representation */}
      <div className="aspect-h-4 aspect-w-3 relative w-full overflow-hidden bg-[#FAF8F5] border-b border-[#ECE6E0] group/img">
        <img
          src={artwork.images[currentImageIndex] || artwork.images[0]}
          alt={artwork.title}
          loading="lazy"
          className="w-full h-[320px] object-cover object-center transition-all duration-500 scale-100 group-hover:scale-102"
        />

        {/* Carousel overlay controls if multiple images exist */}
        {artwork.images.length > 1 && (
          <>
            {/* Prev button */}
            <button
              onClick={handlePrevImage}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-white/95 hover:bg-white text-[#2C2A29] shadow-md opacity-0 group-hover/img:opacity-100 transition-all duration-200 hover:scale-105 z-10 border border-[#DECEBE]/40 cursor-pointer"
              title="Previous image"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            {/* Next button */}
            <button
              onClick={handleNextImage}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-white/95 hover:bg-white text-[#2C2A29] shadow-md opacity-0 group-hover/img:opacity-100 transition-all duration-200 hover:scale-105 z-10 border border-[#DECEBE]/40 cursor-pointer"
              title="Next image"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>

            {/* Dot indicators */}
            <div className="absolute bottom-3 inset-x-0 flex items-center justify-center gap-1 z-10">
              {artwork.images.map((_, idx) => (
                <button
                  key={idx}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentImageIndex(idx);
                  }}
                  className={`h-1.25 rounded-full transition-all duration-300 ${
                    currentImageIndex === idx ? 'w-3.5 bg-white shadow-xs' : 'w-1.25 bg-white/50 hover:bg-white/80'
                  }`}
                  title={`Go to image ${idx + 1}`}
                />
              ))}
            </div>
          </>
        )}
        
        {/* Category overlay badge top left */}
        <div className="absolute top-4 left-4">
          <span className="bg-[#FAF8F5]/90 backdrop-blur-xs text-[#2C2A29] px-2.5 py-1 rounded text-[10px] font-mono tracking-wider uppercase border border-[#E6DDD8]">
            {artwork.category}
          </span>
        </div>

        {/* Admin tools float bubble */}
        {isAdmin && (
          <div className="absolute top-4 right-4 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <button
              title="Edit entry"
              onClick={(e) => onEdit(artwork, e)}
              className="p-2 rounded bg-white/95 hover:bg-white text-[#2C2A29] border border-[#DECEBE] shadow-xs cursor-pointer hover:scale-105 transition-transform"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
            <button
              title="Delete entry"
              onClick={(e) => onDelete(artwork.id, e)}
              className="p-2 rounded bg-white/95 hover:bg-rose-50 text-rose-600 border border-[#DECEBE] shadow-xs cursor-pointer hover:scale-105 transition-transform"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Gentle shadow overlay from bottom */}
        <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-black/10 to-transparent transition-opacity"></div>
      </div>

      {/* Info block under image */}
      <div className="p-5 flex flex-col flex-1 bg-[#FCFAF7]/40 group-hover:bg-[#FAF8F5] transition-colors">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-serif text-lg text-[#2C2A29] font-normal leading-snug group-hover:text-[#8E8070] transition-colors">
            {artwork.title}
          </h3>
          <span className="font-mono text-[11px] text-[#A29A90] shrink-0 mt-1">
            {artwork.date}
          </span>
        </div>
        
        {(!thoughtsHidden || isAdmin) && (
          <p className="text-xs text-[#6E6A64] mt-2 line-clamp-2 leading-relaxed flex-1 italic">
            {isAdmin && thoughtsHidden && <span className="text-amber-700 not-italic mr-1" title="Hidden from public">🔒 </span>}
            "{artwork.notes}"
          </p>
        )}
        
        {/* Technical properties summary pill line */}
        <div className="flex flex-wrap items-center gap-y-1.5 gap-x-3 mt-4 pt-3 border-t border-[#ECE6E0] font-mono text-[10px] text-[#8E8376]">
          {artwork.clayType && (
            <span className="truncate max-w-[120px]">
              Clay: <strong>{artwork.clayType}</strong>
            </span>
          )}
          {artwork.firingTemp && (
            <span>
              S: <strong>{artwork.firingTemp.split(' ')[0]}</strong>
            </span>
          )}
        </div>
      </div>

    </div>
  );
}
