import { useEffect } from 'react';

// Replace these placeholder values in one place to rebrand the entire website
export const SITE_CONFIG = {
  businessName: 'Aurelia Grand Hall',
  shortTagline: 'Timeless Spaces for Weddings, Galas & Milestone Celebrations',
  description:
    'Elegant wedding and banquet venues designed with grand architecture, tailored catering, and effortless online booking.',
  phone: '+1 (555) 234-8900',
  email: 'concierge@aureliahall.com',
  address: '450 Grand Boulevard, Suite 100, Metropolis, NY 10018',
  hours: 'Monday – Sunday: 9:00 AM – 10:00 PM',
  copyrightYear: new Date().getFullYear(),
};

export const HERO_SLIDES = [
  {
    id: 1,
    image: '/src/assets/images/hall_royal_ballroom_1794825122864.jpg',
    headline: 'Timeless Venues for Unforgettable Celebrations',
    subtext: 'Reserve grand crystal ballrooms and sunlit garden pavilions with instant online date availability.',
  },
  {
    id: 2,
    image: '/src/assets/images/hall_emerald_pavilion_1794825122560.jpg',
    headline: 'Architectural Elegance Tailored to Every Guest',
    subtext: 'Spacious contemporary halls overlooking illuminated gardens for weddings, galas, and receptions.',
  },
  {
    id: 3,
    image: '/src/assets/images/hall_garden_courtyard_1794825123834.jpg',
    headline: 'Daylight Sanctuaries & Bespoke Ceremonies',
    subtext: 'Thoughtfully curated spaces with full-service floral styling, dining, and dedicated event coordinators.',
  },
  {
    id: 4,
    image: '/src/assets/images/hall_imperial_suite_1794825124776.jpg',
    headline: 'Intimate Heritage Dining & Private Gatherings',
    subtext: 'Warm candlelit hospitality and flexible seating plans from 40 to 800 guests.',
  },
];

export const GALLERY_ITEMS = [
  {
    id: 1,
    title: 'The Royal Grand Ballroom',
    category: 'Ballroom',
    image: '/src/assets/images/hall_royal_ballroom_1794825122864.jpg',
  },
  {
    id: 2,
    title: 'The Sapphire Glass Pavilion',
    category: 'Evening Reception',
    image: '/src/assets/images/hall_emerald_pavilion_1794825122560.jpg',
  },
  {
    id: 3,
    title: 'The Garden Conservatory',
    category: 'Ceremony',
    image: '/src/assets/images/hall_garden_courtyard_1794825123834.jpg',
  },
  {
    id: 4,
    title: 'The Imperial Heritage Suite',
    category: 'Private Dining',
    image: '/src/assets/images/hall_imperial_suite_1794825124776.jpg',
  },
  {
    id: 5,
    title: 'Signature Banquet Table Setting',
    category: 'Catering',
    image: '/src/assets/images/service_catering_banquet_1794825124313.jpg',
  },
  {
    id: 6,
    title: 'Ivory Floral Stage & Drapery',
    category: 'Decoration',
    image: '/src/assets/images/service_floral_decor_1794825125083.jpg',
  },
];

export const TEAM_MEMBERS = [
  {
    name: 'Eleanor Vance',
    role: 'Managing Director',
    bio: 'Over 15 years orchestrating grand weddings and international hospitality experiences.',
  },
  {
    name: 'Julian Mercer',
    role: 'Executive Culinary Chef',
    bio: 'Leads our in-house banquet kitchen with seasonal regional and contemporary menus.',
  },
  {
    name: 'Nadia Patel',
    role: 'Head of Design & Decor',
    bio: 'Specializes in architectural lighting, floral stage installations, and bespoke layouts.',
  },
];

export const TESTIMONIALS = [
  {
    name: 'Claire & Thomas Bennett',
    event: 'Wedding Reception · 520 Guests',
    quote:
      'Booking our reception online took minutes, and the coordinators handled every detail from stage lighting to plated dinner service without a single hitch.',
  },
  {
    name: 'Dr. Omar & Hannah Siddiqui',
    event: 'Ceremony & Dinner · 310 Guests',
    quote:
      'The Garden Conservatory looked breathtaking in daylight, and the transparent pricing meant there were zero surprises on our final invoice.',
  },
  {
    name: 'Rachel Lin, Meridian Group',
    event: 'Annual Gala · 400 Guests',
    quote:
      'Spacious valet parking, crystal-clear acoustics, and attentive staff made our corporate awards banquet effortless from arrival to farewell.',
  },
];

export function usePageSeo(title: string, description?: string) {
  useEffect(() => {
    document.title = `${title} | ${SITE_CONFIG.businessName}`;
    if (description) {
      const meta = document.querySelector('meta[name="description"]');
      if (meta) {
        meta.setAttribute('content', description);
      }
    }
  }, [title, description]);
}
