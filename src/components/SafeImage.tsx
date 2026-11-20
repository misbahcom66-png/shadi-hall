import { useState } from 'react';
import { Building2 } from 'lucide-react';

interface SafeImageProps {
  src: string;
  alt: string;
  className?: string;
}

export function SafeImage({ src, alt, className = '' }: SafeImageProps) {
  const [failed, setFailed] = useState(false);

  if (failed || !src) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-[#F7F8FA] via-[#EDEFF7] to-[#E2E5F3] text-[#201853] p-6 text-center ${className}`}
      >
        <Building2 className="w-10 h-10 mb-2 opacity-60" strokeWidth={1.75} />
        <span className="text-[14px] font-medium text-[#45459E]">{alt}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
