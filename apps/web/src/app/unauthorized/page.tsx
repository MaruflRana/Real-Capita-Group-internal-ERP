import Link from 'next/link';
import { buttonVariants, cn } from '@real-capita/ui';

import { StateScreen } from '../../components/ui/state-screen';
import { APP_ROUTES } from '../../lib/routes';

export default function UnauthorizedPage() {
  return (
    <StateScreen
      title="Access not available"
      description="This session does not currently have the role scope required for the requested admin surface."
      actions={
        <Link
          className={cn(buttonVariants())}
          href={APP_ROUTES.dashboard}
        >
          Return to dashboard
        </Link>
      }
    />
  );
}
