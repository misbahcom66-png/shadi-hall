import { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown, Menu, X, Building2, CalendarCheck, LogOut } from 'lucide-react';
import { SITE_CONFIG } from '../config/site.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { useToast } from '../context/ToastContext.tsx';

export function Navbar() {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<'halls' | 'services' | null>(null);
  const [mobileExpanded, setMobileExpanded] = useState<'halls' | 'services' | null>(null);
  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMobileOpen(false);
    setOpenDropdown(null);
  }, [location.pathname]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    showToast('Signed out successfully.', 'info');
    navigate('/');
  };

  const isHallsActive =
    location.pathname.startsWith('/halls') || location.pathname === '/pricing';
  const isServicesActive = location.pathname.startsWith('/services');

  const navLinkClass = (isActive: boolean) =>
    `text-[15px] font-medium whitespace-nowrap shrink-0 py-2 transition-colors border-b-2 ${
      isActive
        ? 'text-[#201853] border-[#201853]'
        : 'text-[#6B7280] border-transparent hover:text-[#201853]'
    }`;

  return (
    <header
      ref={navRef}
      className="sticky top-0 z-40 bg-white/85 backdrop-blur-md border-b border-gray-200/80 shadow-[0_4px_20px_rgba(32,24,83,0.05)]"
    >
      <div className="site-container h-[72px] flex items-center justify-between gap-6">
        {/* Left: Logo */}
        <Link
          to="/"
          className="flex items-center gap-2.5 text-[#201853] font-bold text-[19px] tracking-tight whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-[#4A55A2] rounded-md"
        >
          <Building2 className="w-6 h-6 text-[#201853]" strokeWidth={1.75} />
          <span>{SITE_CONFIG.businessName}</span>
        </Link>

        {/* Center/Right: Desktop Links */}
        <nav aria-label="Main navigation" className="hidden lg:flex items-center gap-7">
          <NavLink to="/" end className={({ isActive }) => navLinkClass(isActive)}>
            Home
          </NavLink>

          {/* Halls Dropdown */}
          <div
            className="relative"
            onMouseEnter={() => setOpenDropdown('halls')}
            onMouseLeave={() => setOpenDropdown(null)}
          >
            <button
              type="button"
              onClick={() => setOpenDropdown((d) => (d === 'halls' ? null : 'halls'))}
              aria-expanded={openDropdown === 'halls'}
              className={`flex items-center gap-1 cursor-pointer ${navLinkClass(isHallsActive)}`}
            >
              <span>Halls</span>
              <ChevronDown className="w-4 h-4" strokeWidth={1.75} />
            </button>
            {openDropdown === 'halls' && (
              <div className="absolute left-0 top-full pt-2 w-52">
                <div className="bg-white rounded-[12px] shadow-[0_12px_32px_rgba(32,24,83,0.12)] border border-gray-100 py-2">
                  <Link
                    to="/halls"
                    className="block px-4 py-2.5 text-[14px] text-[#1F2937] hover:bg-[#F7F8FA] hover:text-[#201853] transition-colors"
                  >
                    All Halls
                  </Link>
                  <Link
                    to="/halls/1"
                    className="block px-4 py-2.5 text-[14px] text-[#1F2937] hover:bg-[#F7F8FA] hover:text-[#201853] transition-colors"
                  >
                    Hall Details
                  </Link>
                  <Link
                    to="/pricing"
                    className="block px-4 py-2.5 text-[14px] text-[#1F2937] hover:bg-[#F7F8FA] hover:text-[#201853] transition-colors"
                  >
                    Pricing
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Services Dropdown */}
          <div
            className="relative"
            onMouseEnter={() => setOpenDropdown('services')}
            onMouseLeave={() => setOpenDropdown(null)}
          >
            <button
              type="button"
              onClick={() => setOpenDropdown((d) => (d === 'services' ? null : 'services'))}
              aria-expanded={openDropdown === 'services'}
              className={`flex items-center gap-1 cursor-pointer ${navLinkClass(isServicesActive)}`}
            >
              <span>Services</span>
              <ChevronDown className="w-4 h-4" strokeWidth={1.75} />
            </button>
            {openDropdown === 'services' && (
              <div className="absolute left-0 top-full pt-2 w-56">
                <div className="bg-white rounded-[12px] shadow-[0_12px_32px_rgba(32,24,83,0.12)] border border-gray-100 py-2">
                  <Link
                    to="/services/catering"
                    className="block px-4 py-2.5 text-[14px] text-[#1F2937] hover:bg-[#F7F8FA] hover:text-[#201853] transition-colors"
                  >
                    Catering
                  </Link>
                  <Link
                    to="/services/decoration"
                    className="block px-4 py-2.5 text-[14px] text-[#1F2937] hover:bg-[#F7F8FA] hover:text-[#201853] transition-colors"
                  >
                    Decoration
                  </Link>
                  <Link
                    to="/services/parking"
                    className="block px-4 py-2.5 text-[14px] text-[#1F2937] hover:bg-[#F7F8FA] hover:text-[#201853] transition-colors"
                  >
                    Parking &amp; Security
                  </Link>
                  <Link
                    to="/services/sound-lighting"
                    className="block px-4 py-2.5 text-[14px] text-[#1F2937] hover:bg-[#F7F8FA] hover:text-[#201853] transition-colors"
                  >
                    Sound &amp; Lighting
                  </Link>
                </div>
              </div>
            )}
          </div>

          <NavLink to="/gallery" className={({ isActive }) => navLinkClass(isActive)}>
            Gallery
          </NavLink>
          <NavLink to="/about" className={({ isActive }) => navLinkClass(isActive)}>
            About
          </NavLink>
          <NavLink to="/contact" className={({ isActive }) => navLinkClass(isActive)}>
            Contact
          </NavLink>

          {user && user.role === 'user' && (
            <NavLink to="/my-bookings" className={({ isActive }) => navLinkClass(isActive)}>
              My Bookings
            </NavLink>
          )}
          {user && user.role === 'admin' && (
            <NavLink to="/admin" className={({ isActive }) => navLinkClass(isActive)}>
              Admin Panel
            </NavLink>
          )}
        </nav>

        {/* Right Action */}
        <div className="hidden lg:flex items-center gap-3 shrink-0">
          {user ? (
            <button type="button" onClick={handleLogout} className="btn-primary">
              <LogOut className="w-4 h-4" strokeWidth={1.75} />
              <span>Logout</span>
            </button>
          ) : (
            <Link to="/login" className="btn-primary">
              Login / Register
            </Link>
          )}
        </div>

        {/* Mobile Hamburger */}
        <button
          type="button"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={mobileOpen}
          className="lg:hidden w-11 h-11 rounded-[10px] flex items-center justify-center text-[#201853] hover:bg-[#F7F8FA] transition-colors cursor-pointer"
        >
          {mobileOpen ? <X className="w-6 h-6" strokeWidth={1.75} /> : <Menu className="w-6 h-6" strokeWidth={1.75} />}
        </button>
      </div>

      {/* Mobile Slide-In Glass Panel */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-x-0 top-[72px] bottom-0 z-50 bg-white/95 backdrop-blur-xl border-t border-gray-200 overflow-y-auto">
          <div className="site-container py-6 flex flex-col gap-2">
            <Link
              to="/"
              className="min-h-[44px] flex items-center px-3 rounded-[10px] text-[16px] font-medium text-[#1F2937] hover:bg-[#F7F8FA]"
            >
              Home
            </Link>

            {/* Mobile Halls Expandable */}
            <div>
              <button
                type="button"
                onClick={() => setMobileExpanded((v) => (v === 'halls' ? null : 'halls'))}
                className="w-full min-h-[44px] flex items-center justify-between px-3 rounded-[10px] text-[16px] font-medium text-[#1F2937] hover:bg-[#F7F8FA] cursor-pointer"
              >
                <span>Halls</span>
                <ChevronDown
                  className={`w-5 h-5 transition-transform ${mobileExpanded === 'halls' ? 'rotate-180' : ''}`}
                  strokeWidth={1.75}
                />
              </button>
              {mobileExpanded === 'halls' && (
                <div className="pl-5 py-1 flex flex-col gap-1">
                  <Link to="/halls" className="min-h-[44px] flex items-center text-[15px] text-[#6B7280] hover:text-[#201853]">
                    All Halls
                  </Link>
                  <Link to="/halls/1" className="min-h-[44px] flex items-center text-[15px] text-[#6B7280] hover:text-[#201853]">
                    Hall Details
                  </Link>
                  <Link to="/pricing" className="min-h-[44px] flex items-center text-[15px] text-[#6B7280] hover:text-[#201853]">
                    Pricing
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile Services Expandable */}
            <div>
              <button
                type="button"
                onClick={() => setMobileExpanded((v) => (v === 'services' ? null : 'services'))}
                className="w-full min-h-[44px] flex items-center justify-between px-3 rounded-[10px] text-[16px] font-medium text-[#1F2937] hover:bg-[#F7F8FA] cursor-pointer"
              >
                <span>Services</span>
                <ChevronDown
                  className={`w-5 h-5 transition-transform ${mobileExpanded === 'services' ? 'rotate-180' : ''}`}
                  strokeWidth={1.75}
                />
              </button>
              {mobileExpanded === 'services' && (
                <div className="pl-5 py-1 flex flex-col gap-1">
                  <Link to="/services/catering" className="min-h-[44px] flex items-center text-[15px] text-[#6B7280] hover:text-[#201853]">
                    Catering
                  </Link>
                  <Link to="/services/decoration" className="min-h-[44px] flex items-center text-[15px] text-[#6B7280] hover:text-[#201853]">
                    Decoration
                  </Link>
                  <Link to="/services/parking" className="min-h-[44px] flex items-center text-[15px] text-[#6B7280] hover:text-[#201853]">
                    Parking &amp; Security
                  </Link>
                  <Link to="/services/sound-lighting" className="min-h-[44px] flex items-center text-[15px] text-[#6B7280] hover:text-[#201853]">
                    Sound &amp; Lighting
                  </Link>
                </div>
              )}
            </div>

            <Link
              to="/gallery"
              className="min-h-[44px] flex items-center px-3 rounded-[10px] text-[16px] font-medium text-[#1F2937] hover:bg-[#F7F8FA]"
            >
              Gallery
            </Link>
            <Link
              to="/about"
              className="min-h-[44px] flex items-center px-3 rounded-[10px] text-[16px] font-medium text-[#1F2937] hover:bg-[#F7F8FA]"
            >
              About
            </Link>
            <Link
              to="/contact"
              className="min-h-[44px] flex items-center px-3 rounded-[10px] text-[16px] font-medium text-[#1F2937] hover:bg-[#F7F8FA]"
            >
              Contact
            </Link>

            {user && user.role === 'user' && (
              <Link
                to="/my-bookings"
                className="min-h-[44px] flex items-center gap-2 px-3 rounded-[10px] text-[16px] font-medium text-[#201853] hover:bg-[#F7F8FA]"
              >
                <CalendarCheck className="w-5 h-5" strokeWidth={1.75} />
                <span>My Bookings</span>
              </Link>
            )}

            <div className="pt-4 border-t border-gray-200 mt-2 flex flex-col gap-3">
              <Link to="/book" className="btn-primary w-full">
                Book Hall
              </Link>
              {user ? (
                <button type="button" onClick={handleLogout} className="btn-primary w-full">
                  Logout ({user.name})
                </button>
              ) : (
                <Link to="/login" className="btn-primary w-full">
                  Login / Register
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
