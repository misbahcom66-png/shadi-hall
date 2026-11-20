import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar.tsx';
import { Footer } from './Footer.tsx';

export function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-white text-[#6B7280]">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
