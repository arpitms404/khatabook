import React from 'react';

interface Props {
  name: string;
  url?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const Avatar: React.FC<Props> = ({ name, url, size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-9 h-9 text-sm',
    lg: 'w-12 h-12 text-base font-semibold',
    xl: 'w-16 h-16 text-xl font-bold',
  };

  const getInitials = (str: string) => {
    const parts = str.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return str.slice(0, 2).toUpperCase();
  };

  // Generate deterministic pastel background based on name
  const getBgColor = (str: string) => {
    const colors = [
      'bg-blue-600 text-white',
      'bg-indigo-600 text-white',
      'bg-violet-600 text-white',
      'bg-emerald-600 text-white',
      'bg-amber-600 text-white',
      'bg-teal-600 text-white',
      'bg-rose-600 text-white',
    ];
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  if (url) {
    return (
      <img
        src={url}
        alt={name}
        referrerPolicy="no-referrer"
        className={`rounded-full object-cover shrink-0 ${sizeClasses[size]} ${className}`}
        onError={(e) => {
          // If image fails to load, replace with styled initials fallback
          (e.target as HTMLElement).style.display = 'none';
        }}
      />
    );
  }

  return (
    <div
      className={`rounded-full flex items-center justify-center font-medium shrink-0 ${getBgColor(
        name
      )} ${sizeClasses[size]} ${className}`}
      title={name}
    >
      {getInitials(name)}
    </div>
  );
};
