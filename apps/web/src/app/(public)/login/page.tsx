import { LoginPage } from '../../../features/auth/login-page';
import { APP_ROUTES } from '../../../lib/routes';

type LoginPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const resolveSearchParam = (
  value: string | string[] | undefined,
): string | null => {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
};

export default async function Page({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const nextRoute = resolveSearchParam(params.next) ?? APP_ROUTES.dashboard;

  return <LoginPage nextRoute={nextRoute} />;
}
