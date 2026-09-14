import { Link, useLocation } from 'react-router-dom';
import { Search, User, Menu, X, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { cn } from '../lib/utils';

export function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { label: 'Home', path: '/' },
    { label: 'Explore', path: '/explore' },
    { label: 'My Realities', path: '/my-realities' },
  ];

  const isActive = (path: string) => {
    if (path === '/' && location.pathname !== '/') return false;
    return location.pathname.startsWith(path);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[var(--color-border-subtle)] bg-[var(--color-background-primary)]/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Logo */}
        <div className="flex items-center gap-2">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--color-surface-secondary)] to-[var(--color-background-tertiary)] border border-[var(--color-border-subtle)] overflow-hidden">
               <div className="absolute inset-0 bg-[var(--color-accent-primary)] opacity-0 group-hover:opacity-20 transition-opacity duration-500"></div>
               {/* Minimal portal/split symbol */}
               <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-[var(--color-text-primary)] relative z-10">
                  <path d="M12 2V22M6 6L18 18M6 18L18 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
               </svg>
            </div>
            <span className="font-semibold tracking-widest text-[var(--color-text-primary)] text-sm">
              AURA REALITY
            </span>
          </Link>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={cn(
                "text-sm font-medium transition-colors hover:text-[var(--color-text-primary)]",
                isActive(link.path) ? "text-[var(--color-text-primary)]" : "text-[var(--color-text-secondary)]"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right side actions */}
        <div className="hidden md:flex items-center gap-4">
          <Link to="/search" aria-label="Search" className="p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors rounded-full hover:bg-[var(--color-surface-secondary)]">
            <Search className="h-4 w-4" />
          </Link>
          <Link 
            to="/upgrade" 
            aria-label="Upgrade to Pro"
            className="flex items-center gap-1.5 rounded-full border border-[var(--color-border-subtle)] bg-[var(--color-surface-primary)] px-3 py-1.5 text-xs font-medium text-[var(--color-accent-tertiary)] transition-colors hover:bg-[var(--color-surface-hover)] hover:border-[var(--color-border-focus)]"
          >
            <Sparkles className="h-3 w-3" />
            Upgrade
          </Link>
          <Link to="/settings" aria-label="Profile and Settings" className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors border border-[var(--color-border-subtle)]">
            <User className="h-4 w-4" />
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <div className="flex md:hidden items-center gap-4">
           <Link to="/search" aria-label="Search" className="p-2 text-[var(--color-text-secondary)]">
            <Search className="h-5 w-5" />
          </Link>
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenuOpen}
            className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[var(--color-border-subtle)] bg-[var(--color-surface-primary)] px-4 py-4 space-y-4">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setMobileMenuOpen(false)}
              className={cn(
                "block text-base font-medium",
                isActive(link.path) ? "text-[var(--color-text-primary)]" : "text-[var(--color-text-secondary)]"
              )}
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-4 border-t border-[var(--color-border-subtle)] flex flex-col gap-4">
            <Link 
              to="/upgrade" 
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 text-[var(--color-accent-tertiary)] text-base font-medium"
            >
              <Sparkles className="h-4 w-4" />
              Upgrade to Pro
            </Link>
            <Link 
              to="/settings"
              onClick={() => setMobileMenuOpen(false)} 
              className="flex items-center gap-2 text-[var(--color-text-secondary)] text-base font-medium"
            >
              <User className="h-4 w-4" />
              Profile & Settings
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
