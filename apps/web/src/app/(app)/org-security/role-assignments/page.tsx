import { RoleAssignmentsPage } from '../../../../features/org-security/role-assignments-page';

type RoleAssignmentsPageProps = {
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

export default async function Page({
  searchParams,
}: RoleAssignmentsPageProps) {
  const params = await searchParams;
  const initialUserId = resolveSearchParam(params.userId);

  return <RoleAssignmentsPage initialUserId={initialUserId} />;
}
