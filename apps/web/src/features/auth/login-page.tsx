'use client';

import { startTransition, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Image from 'next/image';
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

const getAvailableCompanies = (error: unknown): LoginCompanyOption[] => {
  if (!isApiError(error)) {
    return [];
  }

  const details = error.apiError.details as
    | MultiCompanyLoginDetails
    | undefined;

  return Array.isArray(details?.availableCompanies)
    ? details.availableCompanies
    : [];
};

export const LoginPage = ({ nextRoute }: { nextRoute: string }) => {
  const { isSigningIn, sessionError, signIn, status } = useAuth();
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
        setSubmitError('Select the company workspace to continue.');

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
        description="Verifying your company workspace before continuing."
      />
    );
  }

  return (
    <div className="flex w-full flex-col items-center gap-5 sm:gap-6 lg:gap-7">
      <div className="w-full max-w-[600px] px-1 sm:px-0">
        <Image
          alt="Real Capita Group"
          className="h-auto w-full object-contain"
          height={330}
          priority
          sizes="(min-width: 1024px) 600px, calc(100vw - 2rem)"
          src="/brand/real-capita-group-logo.png"
          width={1600}
        />
      </div>

      <div className="grid w-full max-w-6xl gap-6 lg:grid-cols-[1fr_420px]">
        <Card className="hidden overflow-hidden lg:block">
          <CardHeader className="border-b border-border/70 bg-gradient-to-br from-sky-50 via-cyan-50 to-background">
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-primary">
              REAL CAPITA ERP
            </p>
            <CardTitle className="text-3xl">
              Unified Business Operations Workspace
            </CardTitle>
            <CardDescription className="max-w-xl text-base leading-7">
              A centralized ERP environment for financial oversight, project
              and property operations, customer lifecycle tracking, HR,
              payroll, document control, and audit visibility across Real
              Capita Group.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 pt-6 md:grid-cols-2">
            <div className="rounded-3xl border border-border/70 bg-background/80 p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                Financial Control
              </p>
              <p className="mt-3 text-sm leading-6 text-foreground">
                Monitor vouchers, reports, collections, profitability, and
                financial position from one controlled workspace.
              </p>
            </div>
            <div className="rounded-3xl border border-border/70 bg-background/80 p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                Property &amp; Sales Visibility
              </p>
              <p className="mt-3 text-sm leading-6 text-foreground">
                Track projects, units, bookings, contracts, installment
                schedules, and collections through a connected operational
                flow.
              </p>
            </div>
            <div className="rounded-3xl border border-border/70 bg-background/80 p-5 md:col-span-2">
              <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                Operational Accountability
              </p>
              <p className="mt-3 text-sm leading-6 text-foreground">
                Support HR, payroll, documents, audit trails, and role-based
                administration with clearer organizational oversight.
              </p>
            </div>
            <p className="md:col-span-2 rounded-2xl border border-primary/15 bg-primary/5 px-4 py-3 text-sm text-muted-foreground">
              Secure company-aware access for authorized Real Capita ERP users.
            </p>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader>
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-primary">
              SECURE ACCESS
            </p>
            <CardTitle>Sign in to Real Capita ERP</CardTitle>
            <CardDescription>
              Use your authorized account to continue to the company workspace.
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
                    Select the company workspace for this session. Multiple
                    active assignments are available for this account.
                  </p>
                </div>
              ) : null}

              <Button className="w-full" disabled={isSigningIn} type="submit">
                {isSigningIn ? 'Signing in...' : 'Sign in'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
