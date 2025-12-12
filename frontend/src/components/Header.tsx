'use client';

/**
 * Header component with unified three-block layout
 * Left: Logo (clickable, navigates to /tests)
 * Center: Main navigation (Nové hlášení, Výsledky testů)
 * Right: Purchase button, Language switcher, User menu
 */

import Link from 'next/link';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { useTranslation } from '@/src/contexts/TranslationContext';
import { apiPost } from '@/src/lib/api-client';
import LanguageSwitcher from './LanguageSwitcher';

interface HeaderProps {
  linkToken: string | null;
  isAuthenticated: boolean;
}

export default function Header({
  linkToken,
  isAuthenticated,
}: HeaderProps) {
  const { t } = useTranslation();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setMobileMenuOpen(false);
      }
    };

    if (userMenuOpen || mobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [userMenuOpen, mobileMenuOpen]);

  // Build URL with token if present
  const buildUrl = (path: string) => {
    return linkToken ? `${path}?token=${linkToken}` : path;
  };

  // Determine active page
  const isHomePage = pathname === '/';
  const isTestsPage = pathname === '/tests';
  const isSettingsPage = pathname === '/settings';
  const isFeedbackPage = pathname === '/feedback';

  // Get user email/name for display (simplified - could be enhanced with profile data)
  const userDisplayName = isAuthenticated ? 'Uživatel' : null;

  // Handle logout - call API and redirect to login page
  const handleLogout = async () => {
    try {
      await apiPost('/auth/logout');
      router.push('/login');
      router.refresh();
    } catch (error) {
      console.error('Logout failed:', error);
      // Even if logout fails, redirect to login page
      router.push('/login');
    }
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="mx-auto px-3 sm:px-4 lg:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Left Block: Logo */}
          <div className="flex items-center flex-shrink-0">
            <Link
              href={buildUrl('/')}
              className="flex items-center hover:opacity-80 transition-opacity"
            >
              <img
                src="/joymed_logo.webp"
                alt="JOY MED"
                className="h-10 sm:h-12 w-auto"
              />
            </Link>
          </div>

          {/* Center Block: Main Navigation - Desktop only */}
          {(isAuthenticated || linkToken) && (
            <nav className="hidden md:flex items-center gap-2 flex-1 justify-center">
              <Link
                href={buildUrl('/')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  isHomePage
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {t.header.newReport}
              </Link>
              <Link
                href={buildUrl('/tests')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  isTestsPage
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {t.header.testResults}
              </Link>
            </nav>
          )}

          {/* Right Block: Purchase, Language, User Menu, Mobile Menu Button */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Mobile Menu Button - Only show on mobile when authenticated */}
            {(isAuthenticated || linkToken) && (
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-md text-gray-700 hover:bg-gray-100 transition-colors"
                aria-label="Menu"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-6 h-6"
                >
                  {mobileMenuOpen ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                    />
                  )}
                </svg>
              </button>
            )}

            {/* Purchase Button - Show on sm and up */}
            <a
              href="https://joymed.cz"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center px-3 sm:px-4 py-2 rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              {t.header.buyTests}
            </a>

            {/* Language Switcher */}
            <LanguageSwitcher />

            {/* User Menu - Show for both password login (isAuthenticated) and token login (linkToken) */}
            {isAuthenticated || linkToken ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                  aria-label="User menu"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-5 h-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  <span className="hidden sm:inline">{userDisplayName}</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-4 h-4"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                    />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                    <div className="py-1">
                      <Link
                        href={buildUrl('/settings')}
                        onClick={() => setUserMenuOpen(false)}
                        className={`block px-4 py-2 text-sm ${
                          isSettingsPage
                            ? 'bg-gray-100 text-gray-900 font-medium'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {t.header.settings}
                      </Link>
                      <Link
                        href={buildUrl('/feedback')}
                        onClick={() => setUserMenuOpen(false)}
                        className={`block px-4 py-2 text-sm ${
                          isFeedbackPage
                            ? 'bg-gray-100 text-gray-900 font-medium'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {t.header.feedback}
                      </Link>
                      {/* Only show logout button for password-authenticated users (not token users) */}
                      {isAuthenticated && (
                        <>
                          <div className="border-t border-gray-200 my-1"></div>
                          <button
                            onClick={() => {
                              setUserMenuOpen(false);
                              handleLogout();
                            }}
                            className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                          >
                            {t.header.logout}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="px-3 sm:px-4 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
              >
                {t.header.login}
              </Link>
            )}
          </div>
        </div>

        {/* Mobile Menu - Dropdown below header */}
        {mobileMenuOpen && (isAuthenticated || linkToken) && (
          <div
            ref={mobileMenuRef}
            className="md:hidden border-t border-gray-200 bg-white"
          >
            <div className="px-3 py-2 space-y-1">
              <Link
                href={buildUrl('/')}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-4 py-3 rounded-md text-base font-medium transition-colors ${
                  isHomePage
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {t.header.newReport}
              </Link>
              <Link
                href={buildUrl('/tests')}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-4 py-3 rounded-md text-base font-medium transition-colors ${
                  isTestsPage
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {t.header.testResults}
              </Link>
              <a
                href="https://joymed.cz"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-3 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100 border border-gray-300"
              >
                {t.header.buyTests}
              </a>
              <div className="border-t border-gray-200 my-2"></div>
              <Link
                href={buildUrl('/settings')}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-4 py-3 rounded-md text-base font-medium ${
                  isSettingsPage
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {t.header.settings}
              </Link>
              <Link
                href={buildUrl('/feedback')}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-4 py-3 rounded-md text-base font-medium ${
                  isFeedbackPage
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {t.header.feedback}
              </Link>
              {isAuthenticated && (
                <>
                  <div className="border-t border-gray-200 my-2"></div>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleLogout();
                    }}
                    className="block w-full text-left px-4 py-3 rounded-md text-base font-medium text-red-600 hover:bg-gray-100"
                  >
                    {t.header.logout}
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
