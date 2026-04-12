import { AppProviders } from '../../components/providers/app-providers';

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AppProviders>
      <div className="min-h-screen bg-admin-canvas">
        <div className="mx-auto flex min-h-screen max-w-7xl items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
          {children}
        </div>
      </div>
    </AppProviders>
  );
}
