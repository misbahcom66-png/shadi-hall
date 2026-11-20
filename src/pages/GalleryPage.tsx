import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, X, Maximize2 } from 'lucide-react';
import { GALLERY_ITEMS, usePageSeo } from '../config/site.ts';
import { SafeImage } from '../components/SafeImage.tsx';

export function GalleryPage() {
  usePageSeo('Gallery', 'Browse photographs of our ballrooms, glass pavilions, floral stages, and banquet settings.');

  const [selectedCategory, setSelectedCategory] = useState('All');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const categories = ['All', ...Array.from(new Set(GALLERY_ITEMS.map((item) => item.category)))];
  const filtered =
    selectedCategory === 'All'
      ? GALLERY_ITEMS
      : GALLERY_ITEMS.filter((item) => item.category === selectedCategory);

  useEffect(() => {
    if (lightboxIndex === null) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxIndex(null);
      if (e.key === 'ArrowRight') {
        setLightboxIndex((idx) => (idx === null ? null : (idx + 1) % filtered.length));
      }
      if (e.key === 'ArrowLeft') {
        setLightboxIndex((idx) =>
          idx === null ? null : (idx - 1 + filtered.length) % filtered.length
        );
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [lightboxIndex, filtered.length]);

  const activeItem = lightboxIndex !== null ? filtered[lightboxIndex] : null;

  return (
    <div className="section-spacing bg-[#F7F8FA] min-h-[70vh]">
      <div className="site-container space-y-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="max-w-xl space-y-2">
            <h1 className="h1-title">Venue &amp; Event Gallery</h1>
            <p className="body-text">
              Explore real layouts, chandelier ballrooms, floral stage setups, and dining presentations.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  setSelectedCategory(cat);
                  setLightboxIndex(null);
                }}
                className={`px-4 py-2 rounded-[10px] text-[14px] font-medium transition-colors cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-[#201853] text-white'
                    : 'bg-white text-[#6B7280] hover:text-[#201853]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((item, idx) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setLightboxIndex(idx)}
              className="group card-surface overflow-hidden text-left cursor-pointer focus-visible:outline-2 focus-visible:outline-[#4A55A2]"
            >
              <div className="relative aspect-[4/3] w-full overflow-hidden">
                <SafeImage
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-[#201853]/0 group-hover:bg-[#201853]/30 transition-colors flex items-center justify-center">
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity w-11 h-11 rounded-[10px] bg-white text-[#201853] flex items-center justify-center shadow-md">
                    <Maximize2 className="w-5 h-5" strokeWidth={1.75} />
                  </span>
                </div>
              </div>
              <div className="p-5">
                <h2 className="h3-title">{item.title}</h2>
                <p className="small-text mt-1">{item.category}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Accessible Lightbox Modal */}
      {activeItem && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={activeItem.title}
          className="fixed inset-0 z-50 bg-[#201853]/90 backdrop-blur-sm flex items-center justify-center p-4 sm:p-8"
          onClick={() => setLightboxIndex(null)}
        >
          <div
            className="relative max-w-5xl w-full bg-white rounded-[16px] overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="aspect-[16/10] w-full bg-black">
              <SafeImage
                src={activeItem.image}
                alt={activeItem.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-5 flex items-center justify-between gap-4 bg-white">
              <div>
                <h3 className="h3-title">{activeItem.title}</h3>
                <p className="small-text">
                  {activeItem.category} &middot; Image {(lightboxIndex ?? 0) + 1} of {filtered.length}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setLightboxIndex((idx) =>
                      idx === null ? null : (idx - 1 + filtered.length) % filtered.length
                    )
                  }
                  aria-label="Previous image"
                  className="w-11 h-11 rounded-[10px] border border-gray-200 flex items-center justify-center text-[#201853] hover:bg-[#F7F8FA] cursor-pointer"
                >
                  <ChevronLeft className="w-5 h-5" strokeWidth={1.75} />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setLightboxIndex((idx) =>
                      idx === null ? null : (idx + 1) % filtered.length
                    )
                  }
                  aria-label="Next image"
                  className="w-11 h-11 rounded-[10px] border border-gray-200 flex items-center justify-center text-[#201853] hover:bg-[#F7F8FA] cursor-pointer"
                >
                  <ChevronRight className="w-5 h-5" strokeWidth={1.75} />
                </button>
                <button
                  type="button"
                  onClick={() => setLightboxIndex(null)}
                  aria-label="Close lightbox"
                  className="w-11 h-11 rounded-[10px] bg-[#201853] text-white flex items-center justify-center hover:bg-[#45459E] cursor-pointer"
                >
                  <X className="w-5 h-5" strokeWidth={1.75} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
