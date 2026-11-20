import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Building2,
  BadgeDollarSign,
  CalendarCheck,
  Utensils,
  Car,
  Headphones,
  Users,
  Sparkles,
} from 'lucide-react';
import { HERO_SLIDES, TESTIMONIALS, usePageSeo } from '../config/site.ts';
import { apiRequest } from '../lib/api.ts';
import type { Hall } from '../types.ts';
import { SafeImage } from '../components/SafeImage.tsx';
import { useBookHallNavigation } from '../hooks/useBookHallNavigation.ts';

const FEATURES = [
  {
    title: 'Spacious Halls',
    description: 'Grand ballrooms and sunlit pavilions seating from 40 to 800 guests comfortably.',
    icon: Building2,
  },
  {
    title: 'Affordable Pricing',
    description: 'Clear, transparent venue packages with zero hidden fees or surprise charges.',
    icon: BadgeDollarSign,
  },
  {
    title: 'Easy Online Booking',
    description: 'Check live date availability and reserve your event slot online in minutes.',
    icon: CalendarCheck,
  },
  {
    title: 'Catering Included',
    description: 'Flexible in-house banquet menus tailored to regional and contemporary tastes.',
    icon: Utensils,
  },
  {
    title: 'Free Parking',
    description: 'Dedicated on-site guest parking with optional valet and security coordination.',
    icon: Car,
  },
  {
    title: '24/7 Support',
    description: 'Experienced event coordinators available around the clock from inquiry to farewell.',
    icon: Headphones,
  },
];

export function HomePage() {
  usePageSeo(
    'Home',
    'Reserve spacious wedding and event halls with live availability, catering, and transparent pricing.'
  );

  const navigateToBook = useBookHallNavigation();
  const [slideIdx, setSlideIdx] = useState(0);
  const [halls, setHalls] = useState<Hall[]>([]);
  const [loadingHalls, setLoadingHalls] = useState(true);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setSlideIdx((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 5500);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    apiRequest<{ halls: Hall[] }>('/api/halls')
      .then((res) => setHalls(res.halls.slice(0, 3)))
      .catch(() => setHalls([]))
      .finally(() => setLoadingHalls(false));
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (diff > 45) {
      setSlideIdx((prev) => (prev + 1) % HERO_SLIDES.length);
    } else if (diff < -45) {
      setSlideIdx((prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length);
    }
    touchStartX.current = null;
  };

  const currentSlide = HERO_SLIDES[slideIdx];

  return (
    <div>
      {/* 1. Hero Carousel */}
      <section
        className="relative w-full h-[520px] md:h-[600px] overflow-hidden bg-[#201853]"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {HERO_SLIDES.map((slide, idx) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-700 ${
              idx === slideIdx ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
            }`}
          >
            <SafeImage
              src={slide.image}
              alt={slide.headline}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#201853]/85 via-[#201853]/60 to-[#201853]/30" />
          </div>
        ))}

        <div className="relative z-20 site-container h-full flex flex-col justify-center">
          <div className="max-w-2xl space-y-5">
            <h1 className="h1-title text-white">{currentSlide.headline}</h1>
            <p className="text-[16px] md:text-[18px] text-white/90 leading-relaxed max-w-xl">
              {currentSlide.subtext}
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => navigateToBook()}
                className="btn-primary"
              >
                Book Hall
              </button>
            </div>
          </div>
        </div>

        {/* Carousel Arrows */}
        <button
          type="button"
          onClick={() => setSlideIdx((prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length)}
          aria-label="Previous slide"
          className="hidden sm:flex absolute left-5 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-[10px] bg-white/90 hover:bg-white text-[#201853] items-center justify-center shadow-md transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-5 h-5" strokeWidth={1.75} />
        </button>
        <button
          type="button"
          onClick={() => setSlideIdx((prev) => (prev + 1) % HERO_SLIDES.length)}
          aria-label="Next slide"
          className="hidden sm:flex absolute right-5 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-[10px] bg-white/90 hover:bg-white text-[#201853] items-center justify-center shadow-md transition-colors cursor-pointer"
        >
          <ChevronRight className="w-5 h-5" strokeWidth={1.75} />
        </button>

        {/* Carousel Dots */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2.5">
          {HERO_SLIDES.map((slide, idx) => (
            <button
              key={slide.id}
              type="button"
              onClick={() => setSlideIdx(idx)}
              aria-label={`Go to slide ${idx + 1}`}
              className={`h-2.5 rounded-full transition-all cursor-pointer ${
                idx === slideIdx ? 'w-8 bg-white' : 'w-2.5 bg-white/50 hover:bg-white/80'
              }`}
            />
          ))}
        </div>
      </section>

      {/* 2. Features & Benefits */}
      <section className="section-spacing bg-white">
        <div className="site-container space-y-10">
          <div className="max-w-xl space-y-2">
            <h2 className="h2-title">Designed for Effortless Celebrations</h2>
            <p className="body-text">
              Every venue booking includes essential hospitality amenities so you can focus on your guests.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feat) => {
              const Icon = feat.icon;
              return (
                <div key={feat.title} className="card-surface p-6 space-y-3 border border-gray-100">
                  <div className="w-11 h-11 rounded-[10px] bg-[#F7F8FA] text-[#201853] flex items-center justify-center">
                    <Icon className="w-5 h-5" strokeWidth={1.75} />
                  </div>
                  <h3 className="h3-title">{feat.title}</h3>
                  <p className="body-text">{feat.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3. Why Choose Us Numbers */}
      <section className="section-spacing bg-[#F7F8FA]">
        <div className="site-container space-y-10">
          <div className="max-w-xl space-y-2">
            <h2 className="h2-title">Why Families &amp; Planners Choose Us</h2>
            <p className="body-text">
              Trusted across thousands of weddings, receptions, and milestone banquets.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card-surface p-8 text-center space-y-1">
              <div className="text-[40px] font-bold text-[#201853] tabular-nums">1,450+</div>
              <div className="h3-title">Events Hosted</div>
              <p className="small-text">Weddings, galas, and receptions delivered smoothly.</p>
            </div>
            <div className="card-surface p-8 text-center space-y-1">
              <div className="text-[40px] font-bold text-[#201853] tabular-nums">1,200+</div>
              <div className="h3-title">Happy Clients</div>
              <p className="small-text">Consistent hospitality rated by returning families.</p>
            </div>
            <div className="card-surface p-8 text-center space-y-1">
              <div className="text-[40px] font-bold text-[#201853] tabular-nums">800</div>
              <div className="h3-title">Guest Capacity</div>
              <p className="small-text">Flexible floor plans across four distinct halls.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Featured Halls */}
      <section className="section-spacing bg-white">
        <div className="site-container space-y-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="max-w-xl space-y-2">
              <h2 className="h2-title">Featured Event Halls</h2>
              <p className="body-text">
                Explore our signature venues tailored for grand receptions and intimate ceremonies.
              </p>
            </div>
            <Link to="/halls" className="text-[16px] font-medium text-[#45459E] hover:text-[#201853] whitespace-nowrap">
              Browse all halls &rarr;
            </Link>
          </div>

          {loadingHalls ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((n) => (
                <div key={n} className="card-surface h-[380px] animate-pulse bg-[#F7F8FA]" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {halls.map((hall) => (
                <article key={hall.id} className="card-surface overflow-hidden flex flex-col border border-gray-100">
                  <div className="aspect-[16/10] w-full overflow-hidden">
                    <SafeImage
                      src={hall.image_url}
                      alt={hall.name}
                      className="w-full h-full object-cover transition-transform duration-300 hover:scale-[1.03]"
                    />
                  </div>
                  <div className="p-6 flex-1 flex flex-col justify-between gap-5">
                    <div className="space-y-2">
                      <h3 className="h3-title">{hall.name}</h3>
                      <div className="flex items-center gap-3 text-[14px] text-[#6B7280] tabular-nums">
                        <span className="inline-flex items-center gap-1.5">
                          <Users className="w-4 h-4 text-[#45459E]" strokeWidth={1.75} />
                          Up to {hall.capacity} Guests
                        </span>
                        <span aria-hidden="true">&middot;</span>
                        <span className="font-semibold text-[#201853]">
                          ${hall.price.toLocaleString()}
                        </span>
                      </div>
                      <p className="small-text line-clamp-2">{hall.description}</p>
                    </div>
                    <div>
                      <Link to={`/halls/${hall.id}`} className="btn-primary w-full">
                        View Details
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 5. Testimonials */}
      <section className="section-spacing bg-[#F7F8FA]">
        <div className="site-container space-y-10">
          <div className="max-w-xl space-y-2">
            <h2 className="h2-title">Words from Our Guests</h2>
            <p className="body-text">
              Real celebrations hosted across our ballrooms and conservatories.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((item) => (
              <blockquote key={item.name} className="card-surface p-6 flex flex-col justify-between gap-4">
                <p className="body-text text-[#1F2937]">&ldquo;{item.quote}&rdquo;</p>
                <footer className="pt-2 border-t border-gray-100">
                  <div className="text-[16px] font-semibold text-[#201853]">{item.name}</div>
                  <div className="small-text">{item.event}</div>
                </footer>
              </blockquote>
            ))}
          </div>
        </div>
      </section>

      {/* 6. Call-to-Action Strip */}
      <section className="py-14 bg-white">
        <div className="site-container">
          <div className="rounded-[16px] bg-[#F7F8FA] p-8 md:p-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <div className="inline-flex items-center gap-2 text-[14px] font-medium text-[#45459E]">
                <Sparkles className="w-4 h-4" strokeWidth={1.75} />
                <span>Instant Availability Check</span>
              </div>
              <h2 className="h2-title">Ready to Reserve Your Celebration Date?</h2>
              <p className="body-text">
                Select your hall, pick an open date, and customize your event services online.
              </p>
            </div>
            <button type="button" onClick={() => navigateToBook()} className="btn-primary">
              Book Hall
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
