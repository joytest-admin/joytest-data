'use client';

/**
 * Language notification banner
 * Shows when language is switched to inform user that some data needs reload
 */

import { useTranslation } from '@/src/contexts/TranslationContext';
import { useRouter } from 'next/navigation';

export default function LanguageNotification() {
  const { showLanguageNotification, setShowLanguageNotification, t } = useTranslation();
  const router = useRouter();

  if (!showLanguageNotification) {
    return null;
  }

  const handleReload = () => {
    router.refresh();
    setShowLanguageNotification(false);
  };

  const handleDismiss = () => {
    setShowLanguageNotification(false);
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-blue-50 border-b border-blue-200 shadow-sm">
      <div className="mx-auto max-w-7xl px-3 sm:px-4 lg:px-6 py-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-blue-900 mb-1">
              {t.header.languageSwitched}
            </h3>
            <p className="text-sm text-blue-800">
              {t.header.languageSwitchedMessage}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto">
            <button
              onClick={handleReload}
              className="flex-1 sm:flex-none px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 min-h-[36px]"
            >
              {t.header.reloadPage}
            </button>
            <button
              onClick={handleDismiss}
              className="flex-1 sm:flex-none px-3 py-1.5 text-sm font-medium text-blue-700 bg-transparent rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 min-h-[36px]"
              aria-label={t.header.dismiss}
            >
              {t.header.dismiss}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

