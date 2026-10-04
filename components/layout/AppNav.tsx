'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { logout } from '@/lib/authHelpers';
import { domainForPath, isPathActive, navDomains, type NavDomain } from '@/lib/nav';
import { Button } from '../ui/Button';
import { TenantSwitcher } from './TenantSwitcher';

const ACTIVE_BG = '#6A89A7';

export const AppNav: React.FC = () => {
  const pathname = usePathname() ?? '';
  const router = useRouter();
  const activeDomain = domainForPath(pathname);
  const [openId, setOpenId] = useState<string | null>(null);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!navRef.current?.contains(event.target as Node)) {
        setOpenId(null);
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpenId(null);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <header
      ref={navRef}
      className="sticky top-0 z-40 border-b border-gray-800 bg-gray-900 text-white"
    >
      <div className="relative flex h-14 items-center px-6">
        <Link href="/dashboard" className="relative z-10 shrink-0">
          <span className="text-lg font-bold tracking-tight">EcomHub</span>
        </Link>

        <nav
          className="absolute inset-0 flex items-center justify-center gap-1"
          aria-label="Primary"
        >
          {navDomains.map((domain) => (
            <DomainControl
              key={domain.id}
              domain={domain}
              pathname={pathname}
              active={activeDomain?.id === domain.id}
              open={openId === domain.id}
              onToggle={() =>
                setOpenId((prev) => (prev === domain.id ? null : domain.id))
              }
              onClose={() => setOpenId(null)}
            />
          ))}
        </nav>

        <div className="relative z-10 ml-auto flex shrink-0 items-center">
          <TenantSwitcher />
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-gray-300 hover:bg-gray-800 hover:text-white"
          >
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
};

interface DomainControlProps {
  domain: NavDomain;
  pathname: string;
  active: boolean;
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
}

const DomainControl: React.FC<DomainControlProps> = ({
  domain,
  pathname,
  active,
  open,
  onToggle,
  onClose,
}) => {
  if (domain.leaf) {
    return (
      <Link
        href={domain.href}
        className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
          active ? 'text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'
        }`}
        style={active ? { backgroundColor: ACTIVE_BG } : undefined}
      >
        {domain.label}
      </Link>
    );
  }

  const dropdownItems = [
    ...(domain.items ?? []),
    ...(domain.setup ?? []),
  ];

  return (
    <div className="relative">
      <div
        className={`flex items-stretch overflow-hidden rounded-md ${
          active ? 'text-white' : 'text-gray-300'
        }`}
        style={active ? { backgroundColor: ACTIVE_BG } : undefined}
      >
        <Link
          href={domain.href}
          className={`px-3 py-2 text-sm font-medium transition-colors ${
            active ? '' : 'hover:bg-gray-800 hover:text-white'
          }`}
          onClick={onClose}
        >
          {domain.label}
        </Link>
        <button
          type="button"
          aria-expanded={open}
          aria-haspopup="menu"
          aria-label={`${domain.label} menu`}
          onClick={onToggle}
          className={`border-l px-2 transition-colors ${
            active
              ? 'border-white/20 hover:bg-white/10'
              : 'border-transparent hover:bg-gray-800 hover:text-white'
          }`}
        >
          <svg
            className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {open && (
        <div
          role="menu"
          className="absolute left-0 top-full mt-1 min-w-56 rounded-lg border border-gray-700 bg-gray-900 py-1 shadow-xl"
        >
          {dropdownItems.map((item) => {
            const itemActive = isPathActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                role="menuitem"
                onClick={onClose}
                className={`block px-4 py-2 text-sm transition-colors ${
                  itemActive
                    ? 'bg-gray-800 text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};
