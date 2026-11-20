import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { usePageSeo } from '../config/site.ts';

export function NotFoundPage() {
  usePageSeo('Page Not Found');

  return (
    <div className="section-spacing bg-[#F7F8FA] min-h-[65vh] flex items-center">
      <div className="site-container">
        <div className="card-surface max-w-lg mx-auto p-10 text-center space-y-5">
          <div className="w-14 h-14 rounded-[12px] bg-[#F7F8FA] text-[#201853] mx-auto flex items-center justify-center">
            <Compass className="w-7 h-7" strokeWidth={1.75} />
          </div>
          <div className="space-y-2">
            <h1 className="h1-title text-[#201853] tabular-nums">404</h1>
            <h2 className="h2-title">Page Not Found</h2>
            <p className="body-text">
              The page you are looking for does not exist or may have been moved.
            </p>
          </div>
          <Link to="/" className="btn-primary">
            Return to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
