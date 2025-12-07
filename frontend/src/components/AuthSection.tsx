'use client';

/**
 * Auth section component (shown when user is not signed in)
 * Displays login and registration options with translations
 */

import { useTranslation } from '@/src/contexts/TranslationContext';

export default function AuthSection() {
  const { t } = useTranslation();

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <section className="rounded-xl bg-white p-6 shadow">
        <h2 className="text-2xl font-bold text-gray-900">
          {t.auth.title}
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          {t.auth.description}
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-gray-200 p-5">
            <h3 className="text-lg font-semibold text-gray-900">
              {t.auth.haveAccount.title}
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              {t.auth.haveAccount.description}
            </p>
            <a
              href="/login"
              className="mt-4 inline-flex w-full items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-blue-700"
            >
              {t.auth.haveAccount.button}
            </a>
          </div>
          <div className="rounded-lg border border-gray-200 p-5">
            <h3 className="text-lg font-semibold text-gray-900">
              {t.auth.noAccount.title}
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              {t.auth.noAccount.description}
            </p>
            <a
              href="/register"
              className="mt-4 inline-flex w-full items-center justify-center rounded-md border border-blue-600 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50"
            >
              {t.auth.noAccount.button}
            </a>
          </div>
        </div>
      </section>
      <section className="rounded-xl border border-blue-100 bg-blue-50 p-6 text-sm text-blue-900">
        <h3 className="text-lg font-semibold text-blue-900">
          {t.auth.uniqueLink.title}
        </h3>
        <p className="mt-2">
          {t.auth.uniqueLink.description}
        </p>
      </section>
    </div>
  );
}

