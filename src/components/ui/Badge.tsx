import React from 'react';

type BadgeProps = {
  children: React.ReactNode;
  variant?: 'high' | 'medium' | 'low' | 'neutral' | 'accent';
  className?: string;
};

export function Badge({ children, variant = 'neutral', className = '' }: BadgeProps) {
  const baseStyles = 'inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border';
  
  const variants = {
    high: 'bg-red-950/20 text-red-400 border-red-900/50',
    medium: 'bg-amber-950/20 text-amber-400 border-amber-900/50',
    low: 'bg-emerald-950/20 text-emerald-400 border-emerald-900/50',
    neutral: 'bg-zinc-900 text-zinc-400 border-zinc-800',
    accent: 'bg-blue-950/20 text-blue-400 border-blue-900/50',
  };

  return (
    <span className={`${baseStyles} ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}
