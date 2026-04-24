'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  PHASE1_ACCESS_MATRIX,
  type Phase1ModuleKey,
} from '@real-capita/config';
import { buttonVariants, cn } from '@real-capita/ui';

import { useAuth } from '../../components/providers/auth-provider';
import { Badge } from '../../components/ui/badge';
import { StateScreen } from '../../components/ui/state-screen';
import {
  getModuleAccessDescription,
  getModuleRoleLabels,
  getRoleLabels,
  getRouteAccessRequirement,
} from '../../lib/access';
import { APP_ROUTES } from '../../lib/routes';

const AllowedRoleSummary = ({ moduleKey }: { moduleKey: Phase1ModuleKey }) => (
  <div className="space-y-3">
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
        Allowed roles
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        {getModuleRoleLabels(moduleKey).map((label) => (
          <Badge key={label} variant="outline">
            {label}
          </Badge>
        ))}
      </div>
    </div>
  </div>
);

export const RouteAccessBoundary = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const pathname = usePathname();
  const { access, user } = useAuth();

  if (!user) {
    return null;
  }

  const requirement = getRouteAccessRequirement(pathname);

  if (!requirement || access[requirement.moduleKey]) {
    return <>{children}</>;
  }

  const module = PHASE1_ACCESS_MATRIX[requirement.moduleKey];

  return (
    <StateScreen
      title={`${module.label} is not available in this session`}
      description={getModuleAccessDescription(requirement.moduleKey)}
      actions={
        <div className="space-y-4">
          <AllowedRoleSummary moduleKey={requirement.moduleKey} />
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              Active roles
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {getRoleLabels(user.roles).map((role) => (
                <Badge key={role} variant="outline">
                  {role}
                </Badge>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              className={cn(buttonVariants())}
              href={APP_ROUTES.dashboard}
            >
              Return to dashboard
            </Link>
            <Link
              className={cn(buttonVariants({ variant: 'outline' }))}
              href={APP_ROUTES.unauthorized}
            >
              Open access help
            </Link>
          </div>
        </div>
      }
    />
  );
};
