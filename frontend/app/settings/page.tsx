import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import SettingsPageContent from '@/src/components/SettingsPageContent';
import { backendGet } from '@/src/lib/backend-client';
import {
  ApiResponse,
  DoctorProfileResponse,
} from '@/src/types/api.types';

type SearchParams =
  | { token?: string }
  | Promise<{ token?: string }>;

export default async function SettingsPage({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  const resolvedSearchParams =
    typeof (searchParams as Promise<{ token?: string }>)?.then === 'function'
      ? await (searchParams as Promise<{ token?: string }>)
      : ((searchParams as { token?: string }) ?? undefined);

  const cookieStore = await cookies();
  const jwtToken = cookieStore.get('auth_token')?.value || null;
  const linkToken = resolvedSearchParams?.token ?? null;

  if (!jwtToken && !linkToken) {
    redirect('/login');
  }

  let profile: DoctorProfileResponse | null = null;
  try {
    const response = await backendGet<ApiResponse<DoctorProfileResponse>>(
      `/api/auth/profile${linkToken && !jwtToken ? `?token=${linkToken}` : ''}`,
      jwtToken || undefined,
      linkToken && !jwtToken ? { 'x-link-token': linkToken } : {},
    );
    if (response.success && response.data) {
      profile = response.data;
    }
  } catch (error) {
    console.error('Failed to load profile:', error);
  }

  if (!profile) {
    redirect('/');
  }

  const origin =
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

  return (
    <div className="min-h-screen bg-gray-50">
      <SettingsPageContent
        profile={profile}
        settingsUrl={`${origin}/settings${linkToken ? `?token=${linkToken}` : ''}`}
        linkToken={linkToken}
      />
    </div>
  );
}

