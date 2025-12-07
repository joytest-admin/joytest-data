'use client';

/**
 * Navigation component
 * Main navigation menu for admin portal
 */

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import { post } from '@/src/lib/api-client';

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await post('/auth/logout');
      router.push('/login');
      router.refresh();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const navItems = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/doctors', label: 'Správa doktorů' },
    { href: '/tests', label: 'Testy' },
    { href: '/test-types', label: 'Typy testů' },
    { href: '/vaccinations', label: 'Typy vakcín' },
    { href: '/common-symptoms', label: 'Běžné příznaky' },
    { href: '/pathogens', label: 'Patogeny' },
    { href: '/translations', label: 'Překlady' },
    { href: '/feedback', label: 'Zpětná vazba' },
  ];

  return (
    <nav className="bg-white shadow-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link href="/dashboard" className="flex items-center space-x-3">
              <Image
                src="/joymed_logo.webp"
                alt="JOY MED"
                width={120}
                height={40}
                className="h-10 w-auto"
              />
            </Link>
          </div>
          
          <div className="flex items-center space-x-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          <div className="flex items-center">
            <button
              onClick={handleLogout}
              className="rounded-md px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              Odhlásit se
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

