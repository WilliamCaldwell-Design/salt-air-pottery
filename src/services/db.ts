/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Artwork } from '../types';

// Gorgeous, pre-populated Scandinavian-inspired sample ceramics to hook the user immediately.
const INITIAL_ARTWORKS: Artwork[] = [
  {
    id: 'art-1',
    title: 'Tall Oat Ribbed Vase',
    category: 'Vases',
    date: '2026-05-12',
    notes: 'Thrown with highly speckled stoneware clay. Applied a subtle vertical ribbed texture on the exterior using a wooden rib tool while wet on the wheel. Fired to Cone 6 in oxidation. Clean linen white interior glaze with an unglazed raw exterior to accentuate the natural grit of the clay body.',
    images: ['/placeholder1.webp'],
    clayType: 'Speckled Stoneware',
    firingTemp: 'Cone 6 (Oxidation)',
    glaze: 'Linen White (interior only)',
    dimensions: '14 x 14 x 26 cm',
    createdAt: 1715472000000,
  },
  {
    id: 'art-2',
    title: 'Nordic Teacup Duo',
    category: 'Tea Sets',
    date: '2026-05-01',
    notes: 'A pair of minimal, lightweight tea cups styled for comfortable hand-holding (no handles). Thrown thin with a slightly flared rim. Glazed in a matte oat glaze which pool-crystallized around the foot rim.',
    images: ['/placeholder2.webp'],
    clayType: 'Buff Stoneware',
    firingTemp: 'Cone 6 (Oxidation)',
    glaze: 'Matte Oat Silt',
    dimensions: '8 x 8 x 7 cm',
    createdAt: 1714521600000,
  },
  {
    id: 'art-3',
    title: 'Textured Hand-Crafted Fruit Bowl',
    category: 'Bowls',
    date: '2026-04-20',
    notes: 'Coil-built over several days to achieve a slow, organic curvature. Surface textured using slate stones pressed gently into the leather-hard clay, then washed with a black iron oxide stain. The interior has a high-fire transparent glaze to ensure food safety.',
    images: ['/placeholder3.webp'],
    clayType: 'Iron Bark Coarse Clay',
    firingTemp: 'Cone 10 (Reduction)',
    glaze: 'Iron Wash (exterior) & Clear Gloss (interior)',
    dimensions: '28 x 28 x 12 cm',
    createdAt: 1713571200000,
  },
  {
    id: 'art-4',
    title: 'Soot Black Tall Urn',
    category: 'Vases',
    date: '2026-04-05',
    notes: 'Thrown with manganese brown clay. A study of pure geometric silhouette. Sanded down carefully during leather-hard stage to achieve seamless contours, then finished with a heavy satin-matte black glaze.',
    images: ['/placeholder4.webp'],
    clayType: 'Manganese Black Stoneware',
    firingTemp: 'Cone 6 (Oxidation)',
    glaze: 'Satin Soot Black',
    dimensions: '16 x 16 x 32 cm',
    createdAt: 1712275200000,
  },
  {
    id: 'art-5',
    title: 'Dappled Speckle Mug',
    category: 'Mugs',
    date: '2026-03-22',
    notes: 'Glaze experiment with dual dipping. Base coat is raw calcium white, rim dipped in cobalt-rutile blue glaze, creating beautiful speckled, falling crystal streams. Pull handle feels ergonomic with a comfortable thumb rest.',
    images: ['/placeholder5.webp'],
    clayType: 'Speckled Buff Stoneware',
    firingTemp: 'Cone 6 (Oxidation)',
    glaze: 'Calcium White & Falling Sea Frost Rim',
    dimensions: '11 x 9 x 10 cm',
    createdAt: 1711065600000,
  },
  {
    id: 'art-6',
    title: 'Earthy Water-Jug with Loop Handle',
    category: 'Pourers',
    date: '2026-02-15',
    notes: 'Classic pitcher with a contemporary minimalist loop handle. Clean pouring spout shaped with a slight under-groove to prevent drips. Highly functional piece that commands presence on any dining table.',
    images: ['/placeholder6.webp'],
    clayType: 'Grey River Stoneware',
    firingTemp: 'Cone 10 (Reduction)',
    glaze: 'Chalk White Matte Wash',
    dimensions: '15 x 12 x 22 cm',
    createdAt: 1707955200000,
  }
];

const LOCAL_STORAGE_KEY = 'pottery_diary_artworks';

// Base Service Interface to facilitate modular swapping.
export interface PotteryDatabaseProvider {
  getArtworks(): Promise<Artwork[]>;
  saveArtwork(artwork: Omit<Artwork, 'createdAt'> & { createdAt?: number }): Promise<Artwork>;
  deleteArtwork(id: string): Promise<void>;
  updateArtwork(artwork: Artwork): Promise<Artwork>;
}

/**
 * LocalStorage Database Implementation.
 * This runs completely serverless and persists users' edits directly in their browser.
 */
class LocalPotteryDb implements PotteryDatabaseProvider {
  private getStore(): Artwork[] {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(INITIAL_ARTWORKS));
      return INITIAL_ARTWORKS;
    }
    try {
      const stored = JSON.parse(raw) as Artwork[];
      
      const placeholderMap: Record<string, string> = {
        'art-1': '/placeholder1.webp',
        'art-2': '/placeholder2.webp',
        'art-3': '/placeholder3.webp',
        'art-4': '/placeholder4.webp',
        'art-5': '/placeholder5.webp',
        'art-6': '/placeholder6.webp',
      };

      let hasUpdates = false;
      const migrated = stored.map(art => {
        // Force placeholder mapping for the 6 initial items if they aren't updated yet
        if (placeholderMap[art.id]) {
          const targetPlaceholder = placeholderMap[art.id];
          if (!art.images || art.images.length === 0 || !art.images.includes(targetPlaceholder)) {
            hasUpdates = true;
            return { ...art, images: [targetPlaceholder] };
          }
        }
        
        if (art.images && art.images.length > 0) {
          const oldToNewImages: Record<string, string> = {
            'https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?auto=format&fit=crop&w=1200&q=80': '/placeholder1.webp',
            'https://images.unsplash.com/photo-1517256064527-09c53b2d0bc6?auto=format&fit=crop&w=1200&q=80': '/placeholder2.webp',
            'https://images.unsplash.com/photo-1576016770956-debb63d900eb?auto=format&fit=crop&w=1200&q=80': '/placeholder2.webp',
            'https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=1200&q=80': '/placeholder3.webp',
            'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=1200&q=80': '/placeholder3.webp',
            'https://images.unsplash.com/photo-1612195583950-b8fd34c87093?auto=format&fit=crop&w=1200&q=80': '/placeholder4.webp',
            'https://images.unsplash.com/photo-1618220179428-22790b461013?auto=format&fit=crop&w=1200&q=80': '/placeholder4.webp',
            'https://images.unsplash.com/photo-1536304997881-a372c179924b?auto=format&fit=crop&w=1200&q=80': '/placeholder5.webp',
            'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=1200&q=80': '/placeholder5.webp',
            'https://images.unsplash.com/photo-1606293459207-0cbe44fb3f53?auto=format&fit=crop&w=1200&q=80': '/placeholder6.webp',
            'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=1200&q=80': '/placeholder6.webp'
          };
          let imageChanged = false;
          const updatedImages = art.images.map(img => {
            if (oldToNewImages[img]) {
              imageChanged = true;
              return oldToNewImages[img];
            }
            return img;
          });
          if (imageChanged) {
            hasUpdates = true;
            return { ...art, images: updatedImages };
          }
        }
        return art;
      });

      if (hasUpdates) {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(migrated));
        return migrated;
      }
      return stored;
    } catch (e) {
      console.error('Error parsing local storage artwork data:', e);
      return INITIAL_ARTWORKS;
    }
  }

  private saveStore(artworks: Artwork[]): void {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(artworks));
  }

  async getArtworks(): Promise<Artwork[]> {
    // Artificial slight delay to emulate real-world DB connections gracefully
    await new Promise((resolve) => setTimeout(resolve, 350));
    const store = this.getStore();
    // Sort reverse-chronologically by date first, then by createdAt timestamp to guarantee newest creations always at front
    return [...store].sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      if (dateB !== dateA) return dateB - dateA;
      return b.createdAt - a.createdAt;
    });
  }

  async saveArtwork(artworkData: Omit<Artwork, 'createdAt' | 'id'> & { id?: string; createdAt?: number }): Promise<Artwork> {
    await new Promise((resolve) => setTimeout(resolve, 400));
    const store = this.getStore();
    
    const newId = artworkData.id || `art_${Date.now()}`;
    const newArtwork: Artwork = {
      ...artworkData,
      id: newId,
      createdAt: artworkData.createdAt || Date.now(),
    } as Artwork;

    const existingIndex = store.findIndex((a) => a.id === newId);
    if (existingIndex >= 0) {
      store[existingIndex] = newArtwork;
    } else {
      store.push(newArtwork);
    }

    this.saveStore(store);
    return newArtwork;
  }

  async updateArtwork(artwork: Artwork): Promise<Artwork> {
    return this.saveArtwork(artwork);
  }

  async deleteArtwork(id: string): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const store = this.getStore();
    const updated = store.filter((a) => a.id !== id);
    this.saveStore(updated);
  }
}

/**
 * Future Cloud Integration Blueprint (e.g. Firebase or Supabase).
 * The artist can easily switch to this implementation once API credentials are ready.
 * 
 * To switch, the artist simply replaces the default export instance.
 */
class CloudPotteryDb implements PotteryDatabaseProvider {
  async getArtworks(): Promise<Artwork[]> {
    console.warn('Cloud database not configured. Please supply environment variables (Firebase/Supabase).');
    throw new Error('Cloud DB details unspecified.');
  }
  async saveArtwork(artwork: Artwork): Promise<Artwork> {
    throw new Error('Cloud DB details unspecified.');
  }
  async updateArtwork(artwork: Artwork): Promise<Artwork> {
    throw new Error('Cloud DB details unspecified.');
  }
  async deleteArtwork(id: string): Promise<void> {
    throw new Error('Cloud DB details unspecified.');
  }
}

// Default export uses the fully interactive browser SQLite-equivalent (localStorage)
export const db: PotteryDatabaseProvider = new LocalPotteryDb();
