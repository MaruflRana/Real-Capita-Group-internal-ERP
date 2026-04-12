import { redirect } from 'next/navigation';

import { APP_ROUTES } from '../lib/routes';

export default function Page() {
  redirect(APP_ROUTES.dashboard);
}
