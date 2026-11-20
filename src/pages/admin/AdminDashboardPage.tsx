import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarCheck,
  Building2,
  Users,
  Sparkles,
  Mail,
  Settings,
  LogOut,
  Menu,
  X,
  Search,
  CheckCircle2,
  Hourglass,
  XCircle,
  Trash2,
  Plus,
  Edit3,
  Upload,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useToast } from '../../context/ToastContext.tsx';
import { apiRequest } from '../../lib/api.ts';
import type { ActivityLog, Booking, ContactMessage, CustomerSummary, Hall, ServiceItem } from '../../types.ts';
import { SafeImage } from '../../components/SafeImage.tsx';
import { SITE_CONFIG, usePageSeo } from '../../config/site.ts';

type AdminTab = 'dashboard' | 'bookings' | 'halls' | 'customers' | 'services' | 'messages' | 'settings';

interface OverviewResponse {
  stats: {
    totalBookings: number;
    pendingBookings: number;
    confirmedRevenue: number;
    totalHalls: number;
    unreadMessages: number;
  };
  chartData: Array<{ month: string; bookings: number; revenue: number }>;
  recentBookings: Booking[];
  recentLogs: ActivityLog[];
}

interface SiteSettings {
  businessName: string;
  tagline: string;
  email: string;
  phone: string;
  address: string;
  openingHours: string;
}

function BookingStatusCell({ status }: { status: Booking['status'] }) {
  if (status === 'confirmed') {
    return (
      <span className="inline-flex items-center gap-1.5 text-[14px] font-medium text-emerald-700">
        <CheckCircle2 className="w-4 h-4" strokeWidth={1.75} />
        <span>Confirmed</span>
      </span>
    );
  }
  if (status === 'cancelled') {
    return (
      <span className="inline-flex items-center gap-1.5 text-[14px] font-medium text-red-700">
        <XCircle className="w-4 h-4" strokeWidth={1.75} />
        <span>Cancelled</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-[14px] font-medium text-amber-700">
      <Hourglass className="w-4 h-4" strokeWidth={1.75} />
      <span>Pending</span>
    </span>
  );
}

export function AdminDashboardPage() {
  usePageSeo('Admin Dashboard', 'Secure management console for bookings, halls, services, and customers.');
  const { user, loading: authLoading, logout, refreshUser } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Data states
  const [overview, setOverview] = useState<OverviewResponse | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [halls, setHalls] = useState<Hall[]>([]);
  const [customers, setCustomers] = useState<CustomerSummary[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [settings, setSettings] = useState<SiteSettings>({
    businessName: SITE_CONFIG.businessName,
    tagline: SITE_CONFIG.shortTagline,
    email: SITE_CONFIG.email,
    phone: SITE_CONFIG.phone,
    address: SITE_CONFIG.address,
    openingHours: SITE_CONFIG.hours,
  });

  // Bookings filter states
  const [bookingSearch, setBookingSearch] = useState('');
  const [bookingStatusFilter, setBookingStatusFilter] = useState<'all' | 'pending' | 'confirmed' | 'cancelled'>('all');

  // Hall modal/form state
  const [editingHall, setEditingHall] = useState<Hall | null>(null);
  const [showHallForm, setShowHallForm] = useState(false);
  const [hallForm, setHallForm] = useState({
    name: '',
    description: '',
    capacity: 200,
    price: 2500,
    image_url: '/src/assets/images/hall_royal_ballroom_1794825122864.jpg',
    amenities: '',
    status: 'active' as 'active' | 'maintenance',
  });
  const [uploadingImage, setUploadingImage] = useState(false);

  // Service form state
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [editingService, setEditingService] = useState<ServiceItem | null>(null);
  const [serviceForm, setServiceForm] = useState({
    name: '',
    description: '',
    price: 500,
    icon: 'utensils',
    category: 'catering',
  });

  // 2FA setup state
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [totpSecret, setTotpSecret] = useState('');
  const [totpVerifyCode, setTotpVerifyCode] = useState('');

  const loadAll = async () => {
    try {
      const [ov, bk, hl, cu, sv, msg, lg, st] = await Promise.all([
        apiRequest<OverviewResponse>('/api/admin/overview'),
        apiRequest<{ bookings: Booking[] }>('/api/admin/bookings'),
        apiRequest<{ halls: Hall[] }>('/api/admin/halls'),
        apiRequest<{ customers: CustomerSummary[] }>('/api/admin/customers'),
        apiRequest<{ services: ServiceItem[] }>('/api/services'),
        apiRequest<{ messages: ContactMessage[] }>('/api/admin/messages'),
        apiRequest<{ logs: ActivityLog[] }>('/api/admin/activity-logs'),
        apiRequest<{ settings: SiteSettings }>('/api/admin/settings'),
      ]);
      setOverview(ov);
      setBookings(bk.bookings);
      setHalls(hl.halls);
      setCustomers(cu.customers);
      setServices(sv.services);
      setMessages(msg.messages);
      setLogs(lg.logs);
      setSettings(st.settings);
    } catch (err) {
      if ((err as { status?: number }).status === 401 || (err as { status?: number }).status === 403) {
        navigate('/admin/login', { replace: true });
      }
    }
  };

  useEffect(() => {
    if (user && user.role === 'admin') {
      void loadAll();
    }
  }, [user]);

  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      const matchesStatus = bookingStatusFilter === 'all' || b.status === bookingStatusFilter;
      const q = bookingSearch.toLowerCase();
      const matchesSearch =
        !q ||
        b.user_name.toLowerCase().includes(q) ||
        b.hall_name.toLowerCase().includes(q) ||
        b.event_type.toLowerCase().includes(q) ||
        String(b.id) === q;
      return matchesStatus && matchesSearch;
    });
  }, [bookings, bookingSearch, bookingStatusFilter]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#F7F8FA] flex items-center justify-center">
        <div className="card-surface p-8 text-[#201853] font-medium">Loading Admin Console...</div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return <Navigate to="/admin/login" replace />;
  }

  const handleLogout = async () => {
    await logout();
    showToast('Signed out of Admin Portal.', 'info');
    navigate('/admin/login', { replace: true });
  };

  // Booking Actions
  const handleBookingStatus = async (id: number, status: 'confirmed' | 'cancelled') => {
    try {
      await apiRequest(`/api/admin/bookings/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      showToast(`Booking #${id} updated to ${status}.`, 'success');
      await loadAll();
    } catch (err) {
      showToast((err as Error).message, 'error');
    }
  };

  const handleDeleteBooking = async (id: number) => {
    try {
      await apiRequest(`/api/admin/bookings/${id}`, { method: 'DELETE' });
      showToast(`Booking #${id} deleted.`, 'info');
      await loadAll();
    } catch (err) {
      showToast((err as Error).message, 'error');
    }
  };

  // Hall Actions
  const openAddHall = () => {
    setEditingHall(null);
    setHallForm({
      name: '',
      description: '',
      capacity: 250,
      price: 2500,
      image_url: '/src/assets/images/hall_royal_ballroom_1794825122864.jpg',
      amenities: 'Climate Control, Sound System, Bridal Suite',
      status: 'active',
    });
    setShowHallForm(true);
  };

  const openEditHall = (h: Hall) => {
    setEditingHall(h);
    setHallForm({
      name: h.name,
      description: h.description,
      capacity: h.capacity,
      price: h.price,
      image_url: h.image_url,
      amenities: h.amenities,
      status: h.status,
    });
    setShowHallForm(true);
  };

  const handleHallImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error('Failed to read image file.'));
        reader.readAsDataURL(file);
      });
      const res = await apiRequest<{ imageUrl: string }>('/api/admin/halls/upload-image', {
        method: 'POST',
        body: JSON.stringify({ dataUrl, hallId: editingHall?.id }),
      });
      setHallForm((prev) => ({ ...prev, image_url: res.imageUrl }));
      showToast('Image uploaded successfully.', 'success');
    } catch (err) {
      showToast((err as Error).message, 'error');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSaveHall = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingHall) {
        await apiRequest(`/api/admin/halls/${editingHall.id}`, {
          method: 'PUT',
          body: JSON.stringify(hallForm),
        });
        showToast('Hall updated.', 'success');
      } else {
        await apiRequest('/api/admin/halls', {
          method: 'POST',
          body: JSON.stringify(hallForm),
        });
        showToast('New hall added.', 'success');
      }
      setShowHallForm(false);
      await loadAll();
    } catch (err) {
      showToast((err as Error).message, 'error');
    }
  };

  const handleDeleteHall = async (id: number) => {
    try {
      await apiRequest(`/api/admin/halls/${id}`, { method: 'DELETE' });
      showToast('Hall deleted.', 'info');
      await loadAll();
    } catch (err) {
      showToast((err as Error).message, 'error');
    }
  };

  // Service Actions
  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingService) {
        await apiRequest(`/api/admin/services/${editingService.id}`, {
          method: 'PUT',
          body: JSON.stringify(serviceForm),
        });
        showToast('Service updated.', 'success');
      } else {
        await apiRequest('/api/admin/services', {
          method: 'POST',
          body: JSON.stringify(serviceForm),
        });
        showToast('Service created.', 'success');
      }
      setShowServiceForm(false);
      await loadAll();
    } catch (err) {
      showToast((err as Error).message, 'error');
    }
  };

  const handleDeleteService = async (id: number) => {
    try {
      await apiRequest(`/api/admin/services/${id}`, { method: 'DELETE' });
      showToast('Service removed.', 'info');
      await loadAll();
    } catch (err) {
      showToast((err as Error).message, 'error');
    }
  };

  // Messages Actions
  const handleToggleMessageRead = async (msg: ContactMessage) => {
    try {
      await apiRequest(`/api/admin/messages/${msg.id}/read`, {
        method: 'PATCH',
        body: JSON.stringify({ is_read: !msg.is_read }),
      });
      await loadAll();
    } catch (err) {
      showToast((err as Error).message, 'error');
    }
  };

  const handleDeleteMessage = async (id: number) => {
    try {
      await apiRequest(`/api/admin/messages/${id}`, { method: 'DELETE' });
      showToast('Message deleted.', 'info');
      await loadAll();
    } catch (err) {
      showToast((err as Error).message, 'error');
    }
  };

  // Settings & 2FA Actions
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/api/admin/settings', {
        method: 'PUT',
        body: JSON.stringify(settings),
      });
      showToast('Business settings saved.', 'success');
      await loadAll();
    } catch (err) {
      showToast((err as Error).message, 'error');
    }
  };

  const handleSetup2FA = async () => {
    try {
      const res = await apiRequest<{ secret: string; qrCodeDataUrl: string }>('/api/auth/2fa/setup', {
        method: 'POST',
      });
      setTotpSecret(res.secret);
      setQrCodeDataUrl(res.qrCodeDataUrl);
    } catch (err) {
      showToast((err as Error).message, 'error');
    }
  };

  const handleEnable2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/api/auth/2fa/enable', {
        method: 'POST',
        body: JSON.stringify({ code: totpVerifyCode }),
      });
      setQrCodeDataUrl('');
      setTotpSecret('');
      setTotpVerifyCode('');
      await refreshUser();
      await loadAll();
      showToast('Two-Factor Authentication enabled.', 'success');
    } catch (err) {
      showToast((err as Error).message, 'error');
    }
  };

  const handleDisable2FA = async () => {
    try {
      await apiRequest('/api/auth/2fa/disable', { method: 'POST' });
      await refreshUser();
      await loadAll();
      showToast('Two-Factor Authentication disabled.', 'info');
    } catch (err) {
      showToast((err as Error).message, 'error');
    }
  };

  const NAV_ITEMS: Array<{ id: AdminTab; label: string; icon: typeof LayoutDashboard }> = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'bookings', label: 'Bookings', icon: CalendarCheck },
    { id: 'halls', label: 'Halls', icon: Building2 },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'services', label: 'Services', icon: Sparkles },
    { id: 'messages', label: 'Messages', icon: Mail },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const maxChartBookings = Math.max(1, ...(overview?.chartData.map((d) => d.bookings) || [1]));

  return (
    <div className="min-h-screen bg-[#F7F8FA] flex">
      {/* Mobile Sidebar Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-[#201853]/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Left Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-[260px] bg-white border-r border-gray-200 flex flex-col justify-between transition-transform duration-200 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="p-6 space-y-8 overflow-y-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 font-bold text-[18px] text-[#201853]">
              <Building2 className="w-6 h-6" strokeWidth={1.75} />
              <span>Admin Panel</span>
            </div>
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              aria-label="Close sidebar"
              className="lg:hidden p-2 text-[#6B7280] cursor-pointer"
            >
              <X className="w-5 h-5" strokeWidth={1.75} />
            </button>
          </div>

          <nav aria-label="Admin sidebar" className="space-y-1.5">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full min-h-[44px] px-4 rounded-[10px] flex items-center justify-between text-[15px] font-medium transition-colors cursor-pointer ${
                    active
                      ? 'bg-[#201853] text-white'
                      : 'text-[#6B7280] hover:bg-[#F7F8FA] hover:text-[#201853]'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <Icon className="w-5 h-5" strokeWidth={1.75} />
                    <span>{item.label}</span>
                  </span>
                  {item.id === 'messages' && (overview?.stats.unreadMessages || 0) > 0 && (
                    <span className="text-[12px] font-semibold tabular-nums">
                      {overview?.stats.unreadMessages}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6 border-t border-gray-100 space-y-3">
          <Link
            to="/"
            className="flex items-center gap-2 text-[14px] font-medium text-[#45459E] hover:text-[#201853] py-1"
          >
            <ExternalLink className="w-4 h-4" strokeWidth={1.75} />
            <span>View Public Website</span>
          </Link>
          <button type="button" onClick={handleLogout} className="btn-primary w-full">
            <LogOut className="w-4 h-4" strokeWidth={1.75} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 h-[72px] bg-white border-b border-gray-200 px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open sidebar"
              className="lg:hidden w-11 h-11 rounded-[10px] flex items-center justify-center text-[#201853] hover:bg-[#F7F8FA] cursor-pointer"
            >
              <Menu className="w-6 h-6" strokeWidth={1.75} />
            </button>
            <h1 className="h3-title capitalize">{activeTab}</h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:block text-right">
              <div className="text-[14px] font-semibold text-[#1F2937]">{user.name}</div>
              <div className="text-[12px] text-[#6B7280]">{user.email}</div>
            </div>
            <button type="button" onClick={handleLogout} className="btn-primary">
              Logout
            </button>
          </div>
        </header>

        <main className="flex-1 p-6 md:p-8 max-w-[1200px] w-full mx-auto space-y-8">
          {/* 1. OVERVIEW TAB */}
          {activeTab === 'dashboard' && overview && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="card-surface p-6 space-y-1">
                  <div className="small-text">Total Bookings</div>
                  <div className="text-[32px] font-bold text-[#201853] tabular-nums">
                    {overview.stats.totalBookings}
                  </div>
                </div>
                <div className="card-surface p-6 space-y-1">
                  <div className="small-text">Pending Approval</div>
                  <div className="text-[32px] font-bold text-[#45459E] tabular-nums">
                    {overview.stats.pendingBookings}
                  </div>
                </div>
                <div className="card-surface p-6 space-y-1">
                  <div className="small-text">Confirmed Revenue</div>
                  <div className="text-[32px] font-bold text-[#201853] tabular-nums">
                    ${overview.stats.confirmedRevenue.toLocaleString()}
                  </div>
                </div>
                <div className="card-surface p-6 space-y-1">
                  <div className="small-text">Active Halls</div>
                  <div className="text-[32px] font-bold text-[#201853] tabular-nums">
                    {overview.stats.totalHalls}
                  </div>
                </div>
              </div>

              {/* Bookings Chart */}
              <div className="card-surface p-6 md:p-8 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="h3-title">Bookings Overview by Month</h2>
                    <p className="small-text">Scheduled reservations and revenue trend</p>
                  </div>
                </div>

                <div className="grid grid-cols-6 gap-4 items-end h-52 pt-4">
                  {overview.chartData.map((d) => {
                    const heightPct = Math.max(12, Math.round((d.bookings / maxChartBookings) * 100));
                    return (
                      <div key={d.month} className="flex flex-col items-center justify-end h-full gap-2">
                        <div className="text-[12px] font-semibold text-[#201853] tabular-nums">
                          {d.bookings}
                        </div>
                        <div className="w-full max-w-[48px] bg-[#F7F8FA] rounded-t-[10px] h-36 flex items-end overflow-hidden">
                          <div
                            style={{ height: `${heightPct}%` }}
                            className="w-full bg-[#45459E] rounded-t-[10px] transition-all duration-300"
                            title={`${d.month}: ${d.bookings} booking(s), $${d.revenue.toLocaleString()}`}
                          />
                        </div>
                        <div className="text-[13px] font-medium text-[#6B7280]">{d.month}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Recent Bookings */}
              <div className="card-surface p-6 md:p-8 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="h3-title">Recent Reservations</h2>
                  <button
                    type="button"
                    onClick={() => setActiveTab('bookings')}
                    className="text-[14px] font-medium text-[#45459E] hover:text-[#201853] cursor-pointer"
                  >
                    Manage all &rarr;
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-gray-200 text-[13px] text-[#6B7280]">
                        <th className="py-3 pr-4 font-semibold">ID</th>
                        <th className="py-3 pr-4 font-semibold">Customer</th>
                        <th className="py-3 pr-4 font-semibold">Hall</th>
                        <th className="py-3 pr-4 font-semibold">Event Date</th>
                        <th className="py-3 pr-4 font-semibold">Status</th>
                        <th className="py-3 text-right font-semibold">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-[14px]">
                      {overview.recentBookings.map((b) => (
                        <tr key={b.id}>
                          <td className="py-3 pr-4 tabular-nums font-medium text-[#1F2937]">#{b.id}</td>
                          <td className="py-3 pr-4 text-[#1F2937]">{b.user_name}</td>
                          <td className="py-3 pr-4 text-[#6B7280]">{b.hall_name}</td>
                          <td className="py-3 pr-4 tabular-nums text-[#6B7280]">{b.event_date}</td>
                          <td className="py-3 pr-4">
                            <BookingStatusCell status={b.status} />
                          </td>
                          <td className="py-3 text-right font-semibold text-[#201853] tabular-nums">
                            ${b.total_price.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 2. BOOKINGS TAB */}
          {activeTab === 'bookings' && (
            <div className="space-y-6">
              <div className="card-surface p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="relative flex-1 max-w-sm">
                  <Search
                    className="w-4 h-4 text-[#6B7280] absolute left-3.5 top-1/2 -translate-y-1/2"
                    strokeWidth={1.75}
                  />
                  <input
                    type="search"
                    value={bookingSearch}
                    onChange={(e) => setBookingSearch(e.target.value)}
                    placeholder="Search by guest, hall, or ID..."
                    className="input-field pl-10"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  {(['all', 'pending', 'confirmed', 'cancelled'] as const).map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setBookingStatusFilter(status)}
                      className={`px-4 py-2 rounded-[10px] text-[14px] font-medium capitalize cursor-pointer ${
                        bookingStatusFilter === status
                          ? 'bg-[#201853] text-white'
                          : 'bg-[#F7F8FA] text-[#6B7280] hover:text-[#201853]'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              <div className="card-surface overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 text-[13px] text-[#6B7280]">
                      <th className="py-4 px-5 font-semibold">ID</th>
                      <th className="py-4 px-5 font-semibold">Customer</th>
                      <th className="py-4 px-5 font-semibold">Hall &amp; Event</th>
                      <th className="py-4 px-5 font-semibold">Date &amp; Time</th>
                      <th className="py-4 px-5 font-semibold">Total</th>
                      <th className="py-4 px-5 font-semibold">Status</th>
                      <th className="py-4 px-5 text-right font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-[14px]">
                    {filteredBookings.map((b) => (
                      <tr key={b.id} className="hover:bg-[#F7F8FA]/60">
                        <td className="py-4 px-5 tabular-nums font-semibold text-[#201853]">#{b.id}</td>
                        <td className="py-4 px-5">
                          <div className="font-medium text-[#1F2937]">{b.user_name}</div>
                          <div className="text-[12px] text-[#6B7280]">{b.user_email}</div>
                        </td>
                        <td className="py-4 px-5">
                          <div className="font-medium text-[#1F2937]">{b.hall_name}</div>
                          <div className="text-[12px] text-[#6B7280]">
                            {b.event_type} &middot; {b.guests} guests
                          </div>
                        </td>
                        <td className="py-4 px-5 tabular-nums text-[#6B7280]">
                          <div>{b.event_date}</div>
                          <div className="text-[12px]">
                            {b.start_time} – {b.end_time}
                          </div>
                        </td>
                        <td className="py-4 px-5 tabular-nums font-semibold text-[#201853]">
                          ${b.total_price.toLocaleString()}
                        </td>
                        <td className="py-4 px-5">
                          <BookingStatusCell status={b.status} />
                        </td>
                        <td className="py-4 px-5 text-right whitespace-nowrap space-x-2">
                          {b.status === 'pending' && (
                            <button
                              type="button"
                              onClick={() => handleBookingStatus(b.id, 'confirmed')}
                              className="text-[13px] font-semibold text-emerald-700 hover:underline px-2 py-1 cursor-pointer"
                            >
                              Approve
                            </button>
                          )}
                          {b.status !== 'cancelled' && (
                            <button
                              type="button"
                              onClick={() => handleBookingStatus(b.id, 'cancelled')}
                              className="text-[13px] font-semibold text-amber-700 hover:underline px-2 py-1 cursor-pointer"
                            >
                              Cancel
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDeleteBooking(b.id)}
                            aria-label={`Delete booking ${b.id}`}
                            className="text-red-600 hover:text-red-800 p-1.5 inline-flex items-center cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" strokeWidth={1.75} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 3. HALLS TAB */}
          {activeTab === 'halls' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="h2-title">Manage Event Halls</h2>
                <button type="button" onClick={openAddHall} className="btn-primary">
                  <Plus className="w-4 h-4" strokeWidth={1.75} />
                  <span>Add Hall</span>
                </button>
              </div>

              {showHallForm && (
                <form onSubmit={handleSaveHall} className="card-surface p-6 md:p-8 space-y-5">
                  <div className="flex items-center justify-between">
                    <h3 className="h3-title">{editingHall ? `Edit ${editingHall.name}` : 'Create New Hall'}</h3>
                    <button
                      type="button"
                      onClick={() => setShowHallForm(false)}
                      className="text-[14px] text-[#6B7280] hover:text-[#1F2937] cursor-pointer"
                    >
                      Close
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label className="block text-[14px] font-medium text-[#1F2937]">Hall Name</label>
                      <input
                        type="text"
                        required
                        value={hallForm.name}
                        onChange={(e) => setHallForm((f) => ({ ...f, name: e.target.value }))}
                        className="input-field"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-[14px] font-medium text-[#1F2937]">Status</label>
                      <select
                        value={hallForm.status}
                        onChange={(e) =>
                          setHallForm((f) => ({ ...f, status: e.target.value as 'active' | 'maintenance' }))
                        }
                        className="input-field"
                      >
                        <option value="active">Active</option>
                        <option value="maintenance">Maintenance</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-[14px] font-medium text-[#1F2937]">Guest Capacity</label>
                      <input
                        type="number"
                        min={10}
                        required
                        value={hallForm.capacity}
                        onChange={(e) => setHallForm((f) => ({ ...f, capacity: Number(e.target.value) }))}
                        className="input-field tabular-nums"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-[14px] font-medium text-[#1F2937]">Rental Price ($)</label>
                      <input
                        type="number"
                        min={100}
                        required
                        value={hallForm.price}
                        onChange={(e) => setHallForm((f) => ({ ...f, price: Number(e.target.value) }))}
                        className="input-field tabular-nums"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[14px] font-medium text-[#1F2937]">Description</label>
                    <textarea
                      rows={3}
                      required
                      value={hallForm.description}
                      onChange={(e) => setHallForm((f) => ({ ...f, description: e.target.value }))}
                      className="input-field py-3"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[14px] font-medium text-[#1F2937]">
                      Amenities (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={hallForm.amenities}
                      onChange={(e) => setHallForm((f) => ({ ...f, amenities: e.target.value }))}
                      className="input-field"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-end">
                    <div className="space-y-1.5">
                      <label className="block text-[14px] font-medium text-[#1F2937]">Main Image URL</label>
                      <input
                        type="text"
                        required
                        value={hallForm.image_url}
                        onChange={(e) => setHallForm((f) => ({ ...f, image_url: e.target.value }))}
                        className="input-field"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-[14px] font-medium text-[#1F2937]">
                        Or Upload Image File
                      </label>
                      <label className="input-field flex items-center gap-2 cursor-pointer text-[14px] text-[#45459E]">
                        <Upload className="w-4 h-4" strokeWidth={1.75} />
                        <span>{uploadingImage ? 'Uploading...' : 'Choose PNG / JPG / WebP'}</span>
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          onChange={handleHallImageFile}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>

                  <button type="submit" className="btn-primary">
                    {editingHall ? 'Save Changes' : 'Create Hall'}
                  </button>
                </form>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {halls.map((h) => (
                  <div key={h.id} className="card-surface overflow-hidden flex flex-col">
                    <div className="aspect-[16/9]">
                      <SafeImage src={h.image_url} alt={h.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="p-6 flex-1 flex flex-col justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="h3-title">{h.name}</h3>
                          <span className="text-[13px] font-medium capitalize text-[#45459E]">{h.status}</span>
                        </div>
                        <div className="small-text tabular-nums">
                          {h.capacity} Guests &middot; ${h.price.toLocaleString()}
                        </div>
                        <p className="small-text line-clamp-2 pt-1">{h.description}</p>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                        <button
                          type="button"
                          onClick={() => openEditHall(h)}
                          className="inline-flex items-center gap-1.5 text-[14px] font-medium text-[#201853] hover:text-[#45459E] cursor-pointer"
                        >
                          <Edit3 className="w-4 h-4" strokeWidth={1.75} />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteHall(h.id)}
                          className="inline-flex items-center gap-1.5 text-[14px] font-medium text-red-600 hover:text-red-800 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" strokeWidth={1.75} />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. CUSTOMERS TAB */}
          {activeTab === 'customers' && (
            <div className="card-surface overflow-x-auto">
              <div className="p-6 border-b border-gray-100">
                <h2 className="h3-title">Registered Customers</h2>
              </div>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 text-[13px] text-[#6B7280]">
                    <th className="py-4 px-6 font-semibold">Name</th>
                    <th className="py-4 px-6 font-semibold">Email</th>
                    <th className="py-4 px-6 font-semibold">Phone</th>
                    <th className="py-4 px-6 text-right font-semibold">Bookings</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-[14px]">
                  {customers.map((c) => (
                    <tr key={c.id}>
                      <td className="py-4 px-6 font-medium text-[#1F2937]">{c.name}</td>
                      <td className="py-4 px-6 text-[#6B7280]">{c.email}</td>
                      <td className="py-4 px-6 text-[#6B7280]">{c.phone || '—'}</td>
                      <td className="py-4 px-6 text-right font-semibold text-[#201853] tabular-nums">
                        {c.booking_count}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 5. SERVICES TAB */}
          {activeTab === 'services' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="h2-title">Extra Event Services</h2>
                <button
                  type="button"
                  onClick={() => {
                    setEditingService(null);
                    setServiceForm({ name: '', description: '', price: 500, icon: 'utensils', category: 'catering' });
                    setShowServiceForm(true);
                  }}
                  className="btn-primary"
                >
                  <Plus className="w-4 h-4" strokeWidth={1.75} />
                  <span>Add Service</span>
                </button>
              </div>

              {showServiceForm && (
                <form onSubmit={handleSaveService} className="card-surface p-6 space-y-4">
                  <h3 className="h3-title">{editingService ? 'Edit Service' : 'New Service'}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input
                      type="text"
                      required
                      placeholder="Service name"
                      value={serviceForm.name}
                      onChange={(e) => setServiceForm((s) => ({ ...s, name: e.target.value }))}
                      className="input-field"
                    />
                    <input
                      type="number"
                      required
                      min={0}
                      placeholder="Price"
                      value={serviceForm.price}
                      onChange={(e) => setServiceForm((s) => ({ ...s, price: Number(e.target.value) }))}
                      className="input-field tabular-nums"
                    />
                    <select
                      value={serviceForm.category}
                      onChange={(e) => setServiceForm((s) => ({ ...s, category: e.target.value }))}
                      className="input-field"
                    >
                      <option value="catering">Catering</option>
                      <option value="decoration">Decoration</option>
                      <option value="parking">Parking &amp; Security</option>
                      <option value="sound-lighting">Sound &amp; Lighting</option>
                    </select>
                  </div>
                  <textarea
                    rows={2}
                    required
                    placeholder="Service description"
                    value={serviceForm.description}
                    onChange={(e) => setServiceForm((s) => ({ ...s, description: e.target.value }))}
                    className="input-field py-2.5"
                  />
                  <div className="flex items-center gap-4">
                    <button type="submit" className="btn-primary">
                      Save Service
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowServiceForm(false)}
                      className="text-[14px] text-[#6B7280] cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {services.map((svc) => (
                  <div key={svc.id} className="card-surface p-6 flex flex-col justify-between gap-4">
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="h3-title">{svc.name}</h3>
                        <span className="text-[18px] font-bold text-[#201853] tabular-nums">
                          ${svc.price.toLocaleString()}
                        </span>
                      </div>
                      <p className="small-text mt-2">{svc.description}</p>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingService(svc);
                          setServiceForm({
                            name: svc.name,
                            description: svc.description,
                            price: svc.price,
                            icon: svc.icon,
                            category: svc.category,
                          });
                          setShowServiceForm(true);
                        }}
                        className="text-[14px] font-medium text-[#201853] hover:text-[#45459E] cursor-pointer"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteService(svc.id)}
                        className="text-[14px] font-medium text-red-600 hover:text-red-800 cursor-pointer"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 6. MESSAGES TAB */}
          {activeTab === 'messages' && (
            <div className="space-y-4">
              <h2 className="h2-title">Contact Inquiries</h2>
              {messages.length === 0 ? (
                <div className="card-surface p-8 text-center body-text">No contact messages yet.</div>
              ) : (
                messages.map((m) => (
                  <div key={m.id} className="card-surface p-6 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <h3 className="h3-title">{m.name}</h3>
                        <p className="small-text">
                          {m.email} &middot; {new Date(m.created_at).toLocaleDateString()} &middot;{' '}
                          <span className={m.is_read ? 'text-[#6B7280]' : 'font-semibold text-[#201853]'}>
                            {m.is_read ? 'Read' : 'Unread'}
                          </span>
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => handleToggleMessageRead(m)}
                          className="text-[14px] font-medium text-[#45459E] hover:text-[#201853] cursor-pointer"
                        >
                          {m.is_read ? 'Mark Unread' : 'Mark Read'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteMessage(m.id)}
                          className="text-red-600 hover:text-red-800 p-1.5 cursor-pointer"
                          aria-label="Delete message"
                        >
                          <Trash2 className="w-4 h-4" strokeWidth={1.75} />
                        </button>
                      </div>
                    </div>
                    <p className="body-text text-[#1F2937]">{m.message}</p>
                  </div>
                ))
              )}
            </div>
          )}

          {/* 7. SETTINGS TAB */}
          {activeTab === 'settings' && (
            <div className="space-y-8">
              {/* Two-Factor Authentication */}
              <div className="card-surface p-6 md:p-8 space-y-5">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="w-6 h-6 text-[#201853] shrink-0 mt-0.5" strokeWidth={1.75} />
                  <div>
                    <h2 className="h3-title">Administrator Two-Factor Authentication (TOTP)</h2>
                    <p className="small-text">
                      Status:{' '}
                      <strong className="text-[#201853]">
                        {user.totp_enabled ? 'Enabled' : 'Disabled'}
                      </strong>
                    </p>
                  </div>
                </div>

                {user.totp_enabled ? (
                  <button type="button" onClick={handleDisable2FA} className="btn-primary">
                    Disable 2FA
                  </button>
                ) : (
                  <div className="space-y-4">
                    {!qrCodeDataUrl ? (
                      <button type="button" onClick={handleSetup2FA} className="btn-primary">
                        Generate 2FA QR Code
                      </button>
                    ) : (
                      <form onSubmit={handleEnable2FA} className="space-y-4 max-w-sm">
                        <img
                          src={qrCodeDataUrl}
                          alt="TOTP 2FA QR Code"
                          className="w-44 h-44 border border-gray-200 rounded-[12px] p-2 bg-white"
                        />
                        <p className="small-text">
                          Manual Secret: <code className="font-mono text-[#201853]">{totpSecret}</code>
                        </p>
                        <input
                          type="text"
                          inputMode="numeric"
                          maxLength={6}
                          required
                          placeholder="Enter 6-digit code to confirm"
                          value={totpVerifyCode}
                          onChange={(e) => setTotpVerifyCode(e.target.value)}
                          className="input-field tabular-nums"
                        />
                        <button type="submit" className="btn-primary">
                          Verify &amp; Activate 2FA
                        </button>
                      </form>
                    )}
                  </div>
                )}
              </div>

              {/* Business Settings */}
              <form onSubmit={handleSaveSettings} className="card-surface p-6 md:p-8 space-y-5">
                <h2 className="h3-title">Venue Business Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-[14px] font-medium text-[#1F2937]">Business Name</label>
                    <input
                      type="text"
                      value={settings.businessName}
                      onChange={(e) => setSettings((s) => ({ ...s, businessName: e.target.value }))}
                      className="input-field"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[14px] font-medium text-[#1F2937]">Contact Email</label>
                    <input
                      type="email"
                      value={settings.email}
                      onChange={(e) => setSettings((s) => ({ ...s, email: e.target.value }))}
                      className="input-field"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[14px] font-medium text-[#1F2937]">Phone</label>
                    <input
                      type="text"
                      value={settings.phone}
                      onChange={(e) => setSettings((s) => ({ ...s, phone: e.target.value }))}
                      className="input-field"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[14px] font-medium text-[#1F2937]">Opening Hours</label>
                    <input
                      type="text"
                      value={settings.openingHours}
                      onChange={(e) => setSettings((s) => ({ ...s, openingHours: e.target.value }))}
                      className="input-field"
                    />
                  </div>
                  <div className="md:col-span-2 space-y-1.5">
                    <label className="block text-[14px] font-medium text-[#1F2937]">Address</label>
                    <input
                      type="text"
                      value={settings.address}
                      onChange={(e) => setSettings((s) => ({ ...s, address: e.target.value }))}
                      className="input-field"
                    />
                  </div>
                </div>
                <button type="submit" className="btn-primary">
                  Save Settings
                </button>
              </form>

              {/* Admin Activity Logs */}
              <div className="card-surface overflow-x-auto">
                <div className="p-6 border-b border-gray-100">
                  <h2 className="h3-title">Security &amp; Activity Logs</h2>
                </div>
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 text-[13px] text-[#6B7280]">
                      <th className="py-3 px-6 font-semibold">Timestamp</th>
                      <th className="py-3 px-6 font-semibold">Admin</th>
                      <th className="py-3 px-6 font-semibold">Action</th>
                      <th className="py-3 px-6 font-semibold">IP Address</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-[14px]">
                    {logs.map((log) => (
                      <tr key={log.id}>
                        <td className="py-3 px-6 tabular-nums text-[#6B7280] whitespace-nowrap">
                          {new Date(log.created_at).toLocaleString()}
                        </td>
                        <td className="py-3 px-6 font-medium text-[#1F2937]">{log.admin_name}</td>
                        <td className="py-3 px-6 text-[#1F2937]">{log.action}</td>
                        <td className="py-3 px-6 tabular-nums text-[#6B7280]">{log.ip_address}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
