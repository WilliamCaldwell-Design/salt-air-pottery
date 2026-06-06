/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { Compass, X, Upload, Trash } from 'lucide-react';
import { Artwork } from '../types';

interface ArtworkFormModalProps {
  editingArtwork: Artwork | null;
  uniqueCategories: string[];
  onClose: () => void;
  onSubmit: (payload: Omit<Artwork, 'createdAt'> & { createdAt?: number }) => void;
}

// Client-side high-quality WebP conversion and compression helper
const compressAndConvertToWebP = (fileOrDataUrl: File | string): Promise<string> => {
  return new Promise((resolve) => {
    const src = typeof fileOrDataUrl === 'string' ? fileOrDataUrl : URL.createObjectURL(fileOrDataUrl);
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        // Standardize high resolution to max 1200x1200px (retaining perfect pottery textures, lowering database footprint by ~90%)
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 1200;
        let width = img.width;
        let height = img.height;

        if (width > MAX_WIDTH || height > MAX_HEIGHT) {
          if (width > height) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          } else {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(src);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        
        // Export to WebP format with an optimal 0.82 compression ratio
        const webpDataUrl = canvas.toDataURL('image/webp', 0.82);
        
        if (typeof fileOrDataUrl !== 'string') {
          URL.revokeObjectURL(src);
        }
        resolve(webpDataUrl);
      } catch (err) {
        console.warn('Canvas conversion fallback for cross-origin or load error:', err);
        resolve(src); // Graceful fallback
      }
    };

    img.onerror = () => {
      resolve(src); // Graceful fallback
    };
    img.src = src;
  });
};

export default function ArtworkFormModal({
  editingArtwork,
  uniqueCategories,
  onClose,
  onSubmit,
}: ArtworkFormModalProps) {
  // Enclosing local state for form fields to make the parent state simpler
  const [formTitle, setFormTitle] = useState<string>('');
  const [formCategory, setFormCategory] = useState<string>('');
  const [formDate, setFormDate] = useState<string>('');
  const [formNotes, setFormNotes] = useState<string>('');
  const [formClayType, setFormClayType] = useState<string>('');
  const [formFiringTemp, setFormFiringTemp] = useState<string>('');
  const [formGlaze, setFormGlaze] = useState<string>('');
  const [formDimensions, setFormDimensions] = useState<string>('');
  const [formImages, setFormImages] = useState<string[]>([]);

  // Helpers
  const [dragActive, setDragActive] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [tempImageUrl, setTempImageUrl] = useState<string>('');
  const [pasteError, setPasteError] = useState<string>('');
  const [isConverting, setIsConverting] = useState<boolean>(false);

  // Initial populate or update on editingArtwork change
  useEffect(() => {
    if (editingArtwork) {
      setFormTitle(editingArtwork.title);
      setFormCategory(editingArtwork.category);
      setFormDate(editingArtwork.date);
      setFormNotes(editingArtwork.notes);
      setFormClayType(editingArtwork.clayType || '');
      setFormFiringTemp(editingArtwork.firingTemp || '');
      setFormGlaze(editingArtwork.glaze || '');
      setFormDimensions(editingArtwork.dimensions || '');
      setFormImages([...editingArtwork.images]);
    } else {
      setFormTitle('');
      setFormCategory('');
      setFormDate(new Date().toISOString().split('T')[0]); // Default to today
      setFormNotes('');
      setFormClayType('Speckled Stoneware');
      setFormFiringTemp('Cone 6 (Oxidation)');
      setFormGlaze('');
      setFormDimensions('');
      setFormImages([]);
    }
    setTempImageUrl('');
    setPasteError('');
  }, [editingArtwork]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = async (files: FileList) => {
    const validFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
    if (validFiles.length === 0) return;

    setIsConverting(true);
    try {
      const conversionPromises = validFiles.map(async (file) => {
        // Run conversion through our high-performance WebP helper
        const webpDataUrl = await compressAndConvertToWebP(file);
        return webpDataUrl;
      });

      const webpResults = await Promise.all(conversionPromises);
      setFormImages(prev => [...prev, ...webpResults]);
    } catch (err) {
      console.error('Failed to convert uploaded images to WebP:', err);
      // Fallback: Read using standard FileReader
      validFiles.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            setFormImages(prev => [...prev, reader.result as string]);
          }
        };
        reader.readAsDataURL(file);
      });
    } finally {
      setIsConverting(false);
    }
  };

  const handleAddImageUrl = async () => {
    if (!tempImageUrl.trim()) return;
    if (!tempImageUrl.startsWith('http://') && !tempImageUrl.startsWith('https://') && !tempImageUrl.startsWith('data:image/')) {
      setPasteError('Please enter a valid image URL (starting with http:// or https://)');
      return;
    }
    
    setIsConverting(true);
    setPasteError('');
    try {
      // Attempt conversion to WebP/Base64 directly for maximum speed and offline-readiness
      const optimizedUrl = await compressAndConvertToWebP(tempImageUrl.trim());
      setFormImages(prev => [...prev, optimizedUrl]);
      setTempImageUrl('');
    } catch (err) {
      // Handle fallback directly to pasted URL (such as if CORS blocks canvas read)
      setFormImages(prev => [...prev, tempImageUrl.trim()]);
      setTempImageUrl('');
    } finally {
      setIsConverting(false);
    }
  };

  const removeFormImage = (index: number) => {
    setFormImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formTitle.trim()) {
      alert('Kindly specify an artwork title.');
      return;
    }
    
    if (!formCategory.trim()) {
      alert('Kindly provide a category for sorting.');
      return;
    }

    const finalImages = formImages.length > 0 ? formImages : [
      'https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?auto=format&fit=crop&w=1200&q=80'
    ];

    const artworkPayload: Omit<Artwork, 'createdAt'> & { createdAt?: number } = {
      id: editingArtwork ? editingArtwork.id : `art_${Date.now()}`,
      title: formTitle.trim(),
      category: formCategory.trim(),
      date: formDate,
      notes: formNotes.trim(),
      images: finalImages,
      clayType: formClayType.trim() || undefined,
      firingTemp: formFiringTemp.trim() || undefined,
      glaze: formGlaze.trim() || undefined,
      dimensions: formDimensions.trim() || undefined,
      ...(editingArtwork ? { createdAt: editingArtwork.createdAt } : {})
    };

    onSubmit(artworkPayload);
  };

  return (
    <div id="form_modal_backdrop" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in overflow-y-auto">
      <div 
        id="form_modal_panel" 
        className="w-full max-w-2xl bg-[#FAF8F5] border border-[#DECEBE] rounded-lg shadow-2xl overflow-hidden relative flex flex-col max-h-[90vh] my-4"
      >
        {/* Form Header */}
        <div className="px-6 py-4 bg-[#F2EDEA] border-b border-[#DECEBE] flex items-center justify-between">
          <h2 className="text-lg font-serif text-[#2C2A29] font-normal flex items-center gap-2">
            <Compass className="w-5 h-5 text-[#8E8070]" />
            {editingArtwork ? 'Modify Pot Diary Entry' : 'Log New Creation'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-[#EAE4D9] text-[#7E776F] hover:text-[#2C2A29] transition-all cursor-pointer"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmitForm} className="flex-1 p-6 overflow-y-auto space-y-6">
          
          {/* PRIMARY TITLE & CATEGORY */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-mono uppercase tracking-wider text-[#7E776F] mb-1.5">
                Piece Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Fluted Ochre Teacup"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                className="w-full bg-[#FCFAF7] border border-[#DECEBE] rounded-lg px-3.5 py-2 text-sm text-[#2C2A29] focus:outline-none focus:border-[#8E8070]"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono uppercase tracking-wider text-[#7E776F] mb-1.5">
                Category *
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="e.g. Mugs, Vases, Experiments"
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full bg-[#FCFAF7] border border-[#DECEBE] rounded-lg px-3.5 py-2 text-sm text-[#2C2A29] focus:outline-none focus:border-[#8E8070]"
                />
              </div>
              
              {/* Category Autopopulate suggestion list */}
              {uniqueCategories.length > 0 && (
                <div className="mt-2.5">
                  <span className="text-[9px] font-mono text-[#A29A90] uppercase tracking-wider block mb-1">
                    Select previous or type brand new:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {uniqueCategories.map(cat => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setFormCategory(cat)}
                        className={`px-2 py-0.5 rounded text-[10px] font-mono border transition-all ${
                          formCategory.toLowerCase() === cat.toLowerCase()
                            ? 'bg-[#8E8070] text-[#FAF8F5] border-[#8E8070]'
                            : 'bg-[#F2EDEA] text-[#6E6A64] hover:text-[#2C2A29] border-[#DECEBE]/50 hover:bg-[#EAE4D9]'
                        }`}
                      >
                        + {cat}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* DATE PICKER & DATA SCALEMENT */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-mono uppercase tracking-wider text-[#7E776F] mb-1.5">
                Creation / Firing Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  required
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="w-full bg-[#FCFAF7] border border-[#DECEBE] rounded-lg px-3.5 py-2 text-sm text-[#2C2A29] focus:outline-none focus:border-[#8E8070] font-mono cursor-pointer"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-mono uppercase tracking-wider text-[#7E776F] mb-1.5">
                Dimensions (Metric format)
              </label>
              <input
                type="text"
                placeholder="e.g. 12 x 12 x 20 cm"
                value={formDimensions}
                onChange={(e) => setFormDimensions(e.target.value)}
                className="w-full bg-[#FCFAF7] border border-[#DECEBE] rounded-lg px-3.5 py-2 text-sm text-[#2C2A29] focus:outline-none focus:border-[#8E8070]"
              />
            </div>
          </div>

          {/* CLAY BODY & ATTEMPTS SPEC */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] font-mono uppercase tracking-wider text-[#7E776F] mb-1.5">
                Clay Type
              </label>
              <input
                type="text"
                placeholder="e.g. Speckled Stoneware"
                value={formClayType}
                onChange={(e) => setFormClayType(e.target.value)}
                className="w-full bg-[#FCFAF7] border border-[#DECEBE] rounded-lg px-3.5 py-2 text-sm text-[#2C2A29] focus:outline-none focus:border-[#8E8070]"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono uppercase tracking-wider text-[#7E776F] mb-1.5">
                Firing Cycle / Cone
              </label>
              <input
                type="text"
                placeholder="e.g. Cone 6 Oxidation, Cone 10"
                value={formFiringTemp}
                onChange={(e) => setFormFiringTemp(e.target.value)}
                className="w-full bg-[#FCFAF7] border border-[#DECEBE] rounded-lg px-3.5 py-2 text-sm text-[#2C2A29] focus:outline-none focus:border-[#8E8070]"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono uppercase tracking-wider text-[#7E776F] mb-1.5">
                Glaze Formula
              </label>
              <input
                type="text"
                placeholder="e.g. Matte Oatmeal Speckle"
                value={formGlaze}
                onChange={(e) => setFormGlaze(e.target.value)}
                className="w-full bg-[#FCFAF7] border border-[#DECEBE] rounded-lg px-3.5 py-2 text-sm text-[#2C2A29] focus:outline-none focus:border-[#8E8070]"
              />
            </div>
          </div>

          {/* DIARY BIOGRAPHY NOTES */}
          <div>
            <label className="block text-[10px] font-mono uppercase tracking-wider text-[#7E776F] mb-1.5">
              Artistic thoughts &amp; Firing Diary Notes *
            </label>
            <textarea
              required
              rows={4}
              placeholder="Record wheel speed, ribbed details, glaze dipping sequences, kiln placement, and tactile findings..."
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              className="w-full bg-[#FCFAF7] border border-[#DECEBE] rounded-lg p-3.5 text-sm text-[#2C2A29] focus:outline-none focus:border-[#8E8070] font-sans"
            />
          </div>

          {/* MULTI-PHOTO UPLOAD LABELS */}
          <div>
            <label className="block text-[10px] font-mono uppercase tracking-wider text-[#7E776F] mb-1.5">
              Portfolio Images *
            </label>
            
            {/* Drag and Drop Zone */}
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-6 text-center transition-all flex flex-col items-center justify-center cursor-pointer ${
                dragActive 
                  ? 'border-[#8E8070] bg-[#FAF8F5]' 
                  : 'border-[#DECEBE] bg-[#F2EDEA]/40 hover:bg-[#F2EDEA]/80'
              }`}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                multiple
                accept="image/*"
              />
              <Upload className="w-8 h-8 text-[#8E8376] mb-2.5 stroke-[1.25]" />
              <p className="text-xs font-serif text-[#2C2A29] font-medium">
                Drag and drop your pottery photographs here, or <span className="underline underline-offset-2 hover:text-[#8E8070]">browse files</span>
              </p>
              <p className="text-[10px] font-mono text-[#8E8376] mt-1.5">
                Supports PNG, JPG, WEBP (multiple photographs allowed)
              </p>
            </div>

            {/* Alternate link pasting */}
            <div className="mt-3.5 p-3.5 bg-[#FAF8F5] border border-[#E6DDD8] rounded-lg">
              <span className="text-[10px] font-mono text-[#7E776F] block mb-1">
                Or copy-paste web photo address directly:
              </span>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="https://images.unsplash.com/photo-..."
                  value={tempImageUrl}
                  onChange={(e) => setTempImageUrl(e.target.value)}
                  className="flex-1 bg-[#FCFAF7] border border-[#DECEBE] text-xs px-2.5 py-1.5 rounded-lg text-[#2C2A29] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddImageUrl}
                  className="px-3 py-1.5 bg-[#EAE4D9] hover:bg-[#DED7CE] text-[#5C5346] text-xs font-medium rounded transition-colors"
                >
                  Attach
                </button>
              </div>
              {pasteError && <p className="text-[10px] text-rose-600 mt-1.5">{pasteError}</p>}
            </div>

            {/* WebP Auto Optimization Status Indicator */}
            {isConverting && (
              <div className="mt-3.5 flex items-center justify-center gap-2.5 text-[#5C5346] text-xs font-serif italic bg-[#F2EDEA] border border-[#DECEBE] p-3 rounded-lg animate-pulse">
                <div className="w-3.5 h-3.5 border-2 border-[#8E8070]/25 border-t-[#8E8070] rounded-full animate-spin"></div>
                <span>Optimizing pottery photographs as high-efficiency WebP files...</span>
              </div>
            )}

            {/* Uploaded items visual gallery preview */}
            {formImages.length > 0 && (
              <div className="mt-4">
                <span className="text-[10px] font-mono text-[#8E8376] uppercase tracking-wider block mb-2 font-semibold">
                  Attached photographs ({formImages.length}):
                </span>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                  {formImages.map((src, idx) => (
                    <div key={idx} className="relative group aspect-square rounded overflow-hidden border border-[#DECEBE]">
                      <img src={src} alt="form-preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeFormImage(idx)}
                        className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                      >
                        <Trash className="w-4.5 h-4.5 text-rose-200" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* SAVE FORM SUBMIT */}
          <div className="pt-4 border-t border-[#DECEBE] flex items-center justify-end gap-3.5">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-xs border border-[#DECEBE] rounded-lg text-[#7E776F] hover:bg-[#FAF8F5] transition-all cursor-pointer font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-xs bg-[#4A433A] text-white rounded-lg hover:bg-[#38322B] transition-all cursor-pointer font-medium"
            >
              {editingArtwork ? 'Apply Updates' : 'Commit to Pottery Diary'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
