import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { ToastProvider } from './context/ToastContext.tsx';
import { AuthProvider } from './context/AuthContext.tsx';
import { PublicLayout } from './components/PublicLayout.tsx';
import { HomePage } from './pages/HomePage.tsx';
import { HallsPage } from './pages/HallsPage.tsx';
import { HallDetailsPage } from './pages/HallDetailsPage.tsx';
import { PricingPage } from './pages/PricingPage.tsx';
import { ServicesPage } from './pages/ServicesPage.tsx';
import { GalleryPage } from './pages/GalleryPage.tsx';
import { AboutPage } from './pages/AboutPage.tsx';
import { ContactPage } from './pages/ContactPage.tsx';
import { LoginPage } from './pages/LoginPage.tsx';
import { RegisterPage } from './pages/RegisterPage.tsx';
import { BookHallPage } from './pages/BookHallPage.tsx';
import { MyBookingsPage } from './pages/MyBookingsPage.tsx';
import { AdminLoginPage } from './pages/admin/AdminLoginPage.tsx';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage.tsx';
import { NotFoundPage } from './pages/NotFoundPage.tsx';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <ScrollToTop />
          <Routes>
            {/* Public Multi-Page Routes */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/halls" element={<HallsPage />} />
              <Route path="/halls/:id" element={<HallDetailsPage />} />
              <Route path="/pricing" element={<PricingPage />} />
              <Route path="/services" element={<ServicesPage />} />
              <Route path="/services/:category" element={<ServicesPage />} />
              <Route path="/gallery" element={<GalleryPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/book" element={<BookHallPage />} />
              <Route path="/my-bookings" element={<MyBookingsPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>

            {/* Separate Admin Portal Routes (Not linked in public navbar) */}
            <Route path="/admin/login" element={<AdminLoginPage />} />
            <Route path="/admin/*" element={<AdminDashboardPage />} />
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
