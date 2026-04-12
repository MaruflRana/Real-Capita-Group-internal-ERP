import { AppProviders } from '../../components/providers/app-providers';
import { AuthGuard } from '../../components/auth/auth-guard';
import { AppShell } from '../../features/shell/app-shell';

export const dynamic = 'force-dynamic';

export default function AuthenticatedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AppProviders>
      <AuthGuard>
        <AppShell>{children}</AppShell>
      </AuthGuard>
    </AppProviders>
  );
}
