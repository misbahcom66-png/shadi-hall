import { Link } from 'react-router-dom';
import { Building2, Mail, MapPin, Phone, Facebook, Instagram, Linkedin } from 'lucide-react';
import { SITE_CONFIG } from '../config/site.ts';

export function Footer() {
  return (
    <footer className="relative mt-16 overflow-hidden bg-transparent">
      {/* Layered curvy waves in indigo (#4A55A2, #45459E) and deep navy (#201853) */}
      <div className="relative w-full h-[120px] sm:h-[150px] md:h-[180px] -mb-px pointer-events-none select-none">
        <svg
          viewBox="0 0 1440 180"
          preserveAspectRatio="none"
          className="w-full h-full block"
          aria-hidden="true"
        >
          {/* Back translucent accent indigo wave */}
          <path
            d="M0,120 C240,30 480,10 760,65 C1040,120 1240,145 1440,55 L1440,180 L0,180 Z"
            fill="#4A55A2"
            fillOpacity="0.45"
          />
          {/* Middle secondary indigo wave */}
          <path
            d="M0,145 C320,60 620,35 920,95 C1180,145 1330,115 1440,80 L1440,180 L0,180 Z"
            fill="#45459E"
            fillOpacity="0.82"
          />
          {/* Foreground solid deep navy wave */}
          <path
            d="M0,110 C220,165 460,160 720,105 C980,50 1220,65 1440,125 L1440,180 L0,180 Z"
            fill="#201853"
          />
        </svg>
      </div>

      {/* Main Navy Footer Body */}
      <div className="bg-[#201853] text-white pt-8 pb-12">
        <div className="site-container">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-white/15">
            {/* Column 1: Brand */}
            <div className="space-y-4">
              <Link to="/" className="inline-flex items-center gap-2.5 text-white font-bold text-[20px]">
                <Building2 className="w-6 h-6 text-white" strokeWidth={1.75} />
                <span>{SITE_CONFIG.businessName}</span>
              </Link>
              <p className="text-[14px] leading-relaxed text-white/80">
                {SITE_CONFIG.description}
              </p>
              <div className="flex items-center gap-3 pt-2">
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Facebook"
                  className="w-10 h-10 rounded-[10px] bg-white/10 hover:bg-[#45459E] flex items-center justify-center text-white transition-colors"
                >
                  <Facebook className="w-5 h-5" strokeWidth={1.75} />
                </a>
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Instagram"
                  className="w-10 h-10 rounded-[10px] bg-white/10 hover:bg-[#45459E] flex items-center justify-center text-white transition-colors"
                >
                  <Instagram className="w-5 h-5" strokeWidth={1.75} />
                </a>
                <a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="LinkedIn"
                  className="w-10 h-10 rounded-[10px] bg-white/10 hover:bg-[#45459E] flex items-center justify-center text-white transition-colors"
                >
                  <Linkedin className="w-5 h-5" strokeWidth={1.75} />
                </a>
              </div>
            </div>

            {/* Column 2: Quick Links */}
            <div className="space-y-4">
              <h3 className="text-[18px] font-semibold text-white">Quick Links</h3>
              <ul className="space-y-2.5 text-[14px] text-white/80">
                <li>
                  <Link to="/" className="hover:text-white transition-colors">
                    Home
                  </Link>
                </li>
                <li>
                  <Link to="/halls" className="hover:text-white transition-colors">
                    All Halls
                  </Link>
                </li>
                <li>
                  <Link to="/pricing" className="hover:text-white transition-colors">
                    Hall Pricing
                  </Link>
                </li>
                <li>
                  <Link to="/gallery" className="hover:text-white transition-colors">
                    Photo Gallery
                  </Link>
                </li>
                <li>
                  <Link to="/about" className="hover:text-white transition-colors">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link to="/contact" className="hover:text-white transition-colors">
                    Contact
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 3: Services */}
            <div className="space-y-4">
              <h3 className="text-[18px] font-semibold text-white">Event Services</h3>
              <ul className="space-y-2.5 text-[14px] text-white/80">
                <li>
                  <Link to="/services/catering" className="hover:text-white transition-colors">
                    Banquet Catering
                  </Link>
                </li>
                <li>
                  <Link to="/services/decoration" className="hover:text-white transition-colors">
                    Floral &amp; Stage Decoration
                  </Link>
                </li>
                <li>
                  <Link to="/services/parking" className="hover:text-white transition-colors">
                    Valet Parking &amp; Security
                  </Link>
                </li>
                <li>
                  <Link to="/services/sound-lighting" className="hover:text-white transition-colors">
                    Sound &amp; Lighting
                  </Link>
                </li>
                <li>
                  <Link to="/book" className="hover:text-white transition-colors">
                    Reserve a Date
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 4: Contact Info */}
            <div className="space-y-4">
              <h3 className="text-[18px] font-semibold text-white">Contact Info</h3>
              <ul className="space-y-3 text-[14px] text-white/80">
                <li className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-white/90 shrink-0 mt-0.5" strokeWidth={1.75} />
                  <span>{SITE_CONFIG.phone}</span>
                </li>
                <li className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-white/90 shrink-0 mt-0.5" strokeWidth={1.75} />
                  <span>{SITE_CONFIG.email}</span>
                </li>
                <li className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-white/90 shrink-0 mt-0.5" strokeWidth={1.75} />
                  <span>{SITE_CONFIG.address}</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[14px] text-white/75">
            <p>
              &copy; {SITE_CONFIG.copyrightYear} {SITE_CONFIG.businessName}. All rights reserved.
            </p>
            <p>{SITE_CONFIG.hours}</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
