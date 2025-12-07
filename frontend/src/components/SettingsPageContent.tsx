'use client';

/**
 * Settings page content component with translations
 */

import Link from 'next/link';
import { useTranslation } from '@/src/contexts/TranslationContext';
import Header from './Header';
import SettingsForm from './SettingsForm';

interface SettingsPageContentProps {
  profile: any;
  settingsUrl: string;
  linkToken: string | null;
}

export default function SettingsPageContent({
  profile,
  settingsUrl,
  linkToken,
}: SettingsPageContentProps) {
  const { t } = useTranslation();

  return (
    <>
      <Header linkToken={linkToken} isAuthenticated={true} />
      <main className="mx-auto max-w-3xl px-3 sm:px-4 lg:px-6 py-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">
          {t.pages.settings.title}
        </h1>
        <div className="rounded-lg bg-white p-6 shadow mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">{t.pages.settings.profileSettings}</h2>
          <SettingsForm profile={profile} settingsUrl={settingsUrl} linkToken={linkToken} />
        </div>
        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{t.pages.settings.feedback}</h2>
          <p className="text-sm text-gray-600 mb-4">{t.pages.settings.feedbackDescription}</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href={linkToken ? `/feedback?token=${linkToken}` : '/feedback'}
              className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
            >
              {t.pages.settings.feedbackList}
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}

