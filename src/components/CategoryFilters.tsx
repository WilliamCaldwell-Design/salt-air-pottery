/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { SlidersHorizontal, Search, X } from 'lucide-react';

interface CategoryFiltersProps {
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  uniqueCategories: string[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export default function CategoryFilters({
  selectedCategory,
  setSelectedCategory,
  uniqueCategories,
  searchQuery,
  setSearchQuery,
}: CategoryFiltersProps) {
  const [localSearch, setLocalSearch] = useState<string>(searchQuery);

  // Synchronize local input state if search query is updated from parental side (e.g., cleared)
  useEffect(() => {
    setLocalSearch(searchQuery);
  }, [searchQuery]);

  // Propagate the input value to parental search query state after 280ms of silence
  useEffect(() => {
    const handler = setTimeout(() => {
      if (localSearch !== searchQuery) {
        setSearchQuery(localSearch);
      }
    }, 280);

    return () => clearTimeout(handler);
  }, [localSearch, searchQuery, setSearchQuery]);

  return (
    <div id="filter_row" className="bg-[#F2EDEA] border border-[#E6DDD8] rounded-xl p-5 mb-10 flex flex-col gap-5 md:flex-row md:items-center md:justify-between shadow-xs">
      
      {/* Left: Category filters */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-mono text-[#8E8376] uppercase tracking-wider mr-2 flex items-center gap-1">
          <SlidersHorizontal className="w-3 h-3" />
          Category:
        </span>
        <button
          id="category_all"
          onClick={() => setSelectedCategory('All')}
          className={`px-3 py-1.5 rounded-md text-xs font-medium tracking-wide transition-all ${
            selectedCategory === 'All'
              ? 'bg-[#4A433A] text-[#FAF8F5]'
              : 'bg-[#FAF8F5]/80 hover:bg-[#FAF8F5] text-[#5C554D] border border-[#DECEBE]/50'
          }`}
        >
          All Pieces
        </button>
        
        {uniqueCategories.map((cat) => (
          <button
            key={cat}
            id={`category_${cat.replace(/\s+/g, '_')}`}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium tracking-wide transition-all ${
              selectedCategory.toLowerCase() === cat.toLowerCase()
                ? 'bg-[#4A433A] text-[#FAF8F5]'
                : 'bg-[#FAF8F5]/80 hover:bg-[#FAF8F5] text-[#5C554D] border border-[#DECEBE]/50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Right: Modern search bar with instant local response */}
      <div className="relative max-w-sm w-full md:w-72">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8E8376]" />
        <input
          type="text"
          placeholder="Search clay, glaze, text..."
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          className="w-full bg-[#FAF8F5] border border-[#DECEBE] rounded-lg pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-[#8E8070] text-[#2C2A29] placeholder-[#A29A90] transition-colors"
        />
        {localSearch && (
          <button 
            onClick={() => setLocalSearch('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-neutral-200 text-[#8E8376]"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

    </div>
  );
}
