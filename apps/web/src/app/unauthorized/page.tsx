import Link from 'next/link';
import { buttonVariants, cn } from '@real-capita/ui';

import { StateScreen } from '../../components/ui/state-screen';
import { APP_ROUTES } from '../../lib/routes';

export default function UnauthorizedPage() {
  return (
    <StateScreen
      title="Access not available"
      description="The request was authenticated, but the active company-scoped session does not include the role access required for this workspace. If the session itself is missing, return to sign in instead."
      actions={
        <div className="flex flex-wrap gap-3">
          <Link
            className={cn(buttonVariants())}
            href={APP_ROUTES.dashboard}
          >
            Return to dashboard
          </Link>
          <Link
            className={cn(buttonVariants({ variant: 'outline' }))}
            href={APP_ROUTES.login}
          >
            Go to sign in
          </Link>
        </div>
      }
    />
  );
}
