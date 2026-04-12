'use client';

import {
  startTransition,
  useEffect,
  useState,
} from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@real-capita/ui';

import { useAuth } from '../../components/providers/auth-provider';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select } from '../../components/ui/select';
import { StateScreen } from '../../components/ui/state-screen';
import { isApiError } from '../../lib/api/client';
import type {
  LoginCompanyOption,
  LoginPayload,
  MultiCompanyLoginDetails,
} from '../../lib/api/types';
import { applyApiFormErrors } from '../../lib/forms';

const loginSchema = z.object({
  email: z.string().email('Enter a valid email address.'),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
  companyId: z.string().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const getAvailableCompanies = (
  error: unknown,
): LoginCompanyOption[] => {
  if (!isApiError(error)) {
    return [];
  }

  const details = error.apiError.details as MultiCompanyLoginDetails | undefined;

  return Array.isArray(details?.availableCompanies)
    ? details.availableCompanies
    : [];
};

export const LoginPage = ({ nextRoute }: { nextRoute: string }) => {
  const {
    isSigningIn,
    sessionError,
    signIn,
    status,
  } = useAuth();
  const router = useRouter();
  const [availableCompanies, setAvailableCompanies] = useState<
    LoginCompanyOption[]
  >([]);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      companyId: '',
    },
  });

  useEffect(() => {
    if (status !== 'authenticated') {
      return;
    }

    startTransition(() => {
      router.replace(nextRoute);
    });
  }, [nextRoute, router, status]);

  const onSubmit = form.handleSubmit(async (values) => {
    setSubmitError(null);
    form.clearErrors();

    try {
      await signIn({
        email: values.email.trim(),
        password: values.password,
        ...(values.companyId ? { companyId: values.companyId } : {}),
      } satisfies LoginPayload);

      startTransition(() => {
        router.replace(nextRoute);
      });
    } catch (error) {
      const companyOptions = getAvailableCompanies(error);

      if (companyOptions.length > 0) {
        setAvailableCompanies(companyOptions);
        setSubmitError('Select the company to open for this session.');

        const [firstCompany] = companyOptions;

        if (!form.getValues('companyId') && firstCompany) {
          form.setValue('companyId', firstCompany.id, {
            shouldDirty: true,
          });
        }
      }

      if (applyApiFormErrors(form.setError, error)) {
        return;
      }

      if (isApiError(error)) {
        setSubmitError(error.apiError.message);
        return;
      }

      setSubmitError('Unable to sign in. Try again.');
    }
  });

  if (status === 'loading') {
    return (
      <StateScreen
        title="Checking session"
        description="A browser session already exists. Verifying its company context."
      />
    );
  }

  return (
    <div className="grid w-full max-w-6xl gap-6 lg:grid-cols-[1fr_420px]">
      <Card className="hidden overflow-hidden lg:block">
        <CardHeader className="border-b border-border/70 bg-gradient-to-br from-sky-50 via-cyan-50 to-background">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-primary">
            Real Capita ERP
          </p>
          <CardTitle className="text-3xl">Org &amp; Security workspace</CardTitle>
          <CardDescription className="max-w-xl text-base leading-7">
            Prompt 12 introduces the first production-grade internal admin
            interface on top of the existing REST API foundations.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 pt-6 md:grid-cols-2">
          <div className="rounded-3xl border border-border/70 bg-background/80 p-5">
            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
              Scope
            </p>
            <p className="mt-3 text-sm leading-6 text-foreground">
              Authentication UX, company-aware session handling, and Org &amp;
              Security administration for companies, locations, departments,
              users, and role assignments.
            </p>
          </div>
          <div className="rounded-3xl border border-border/70 bg-background/80 p-5">
            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
              Boundary
            </p>
            <p className="mt-3 text-sm leading-6 text-foreground">
              The frontend remains a REST-only consumer. All business mutations
              continue to cross the NestJS API boundary.
            </p>
          </div>
          <div className="rounded-3xl border border-border/70 bg-background/80 p-5 md:col-span-2">
            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
              Session model
            </p>
            <p className="mt-3 text-sm leading-6 text-foreground">
              Browser sessions use the existing auth endpoints with automatic
              refresh handling. If the authenticated identity belongs to
              multiple companies, the sign-in flow now prompts for the target
              company context.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader>
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-primary">
            Sign in
          </p>
          <CardTitle>Open the admin shell</CardTitle>
          <CardDescription>
            Use an existing backend identity. The frontend does not keep a
            separate auth system.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {submitError ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              {submitError}
            </div>
          ) : null}

          {sessionError && sessionError.statusCode !== 401 ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
              {sessionError.message}
            </div>
          ) : null}

          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                autoComplete="email"
                id="email"
                placeholder="admin@example.com"
                {...form.register('email')}
              />
              {form.formState.errors.email ? (
                <p className="text-sm text-rose-700">
                  {form.formState.errors.email.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                autoComplete="current-password"
                id="password"
                placeholder="Enter your password"
                type="password"
                {...form.register('password')}
              />
              {form.formState.errors.password ? (
                <p className="text-sm text-rose-700">
                  {form.formState.errors.password.message}
                </p>
              ) : null}
            </div>

            {availableCompanies.length > 0 ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="companyId">Company context</Label>
                  <Badge variant="outline">
                    {availableCompanies.length} options
                  </Badge>
                </div>
                <Select id="companyId" {...form.register('companyId')}>
                  <option value="">Select a company</option>
                  {availableCompanies.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.name} ({company.slug})
                    </option>
                  ))}
                </Select>
                <p className="text-sm text-muted-foreground">
                  The backend requires an explicit company selection for this
                  identity because multiple active assignments are available.
                </p>
              </div>
            ) : null}

            <Button
              className="w-full"
              disabled={isSigningIn}
              type="submit"
            >
              {isSigningIn ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
