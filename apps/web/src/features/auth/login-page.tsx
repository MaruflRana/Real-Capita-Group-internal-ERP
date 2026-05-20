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
    <div className="flex w-full items-center justify-center py-8">
      <Card className="w-full max-w-[520px] overflow-hidden rounded-2xl shadow-md shadow-black/5">
        <CardHeader className="flex flex-col items-center gap-5 pt-8 text-center">
          <div className="w-full max-w-[440px]">
            <Image
              alt="Real Capita Group"
              className="h-auto w-full object-contain"
              height={1545}
              priority
              sizes="(min-width: 520px) 440px, 100vw"
              src="/brand/real-capita-group-logo.png"
              width={7735}
            />
          </div>
          <div className="space-y-1.5">
            <CardTitle className="text-xl">Sign in to Real Capita ERP</CardTitle>
            <CardDescription>
              Use your authorized account to access the company workspace.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-5 pb-6">
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
                placeholder="admin@realcapita.com.bd"
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
        <div className="border-t border-border/50 px-6 py-4 text-center text-xs text-muted-foreground">
          Secure company-aware access for authorized Real Capita ERP users.
        </div>
      </Card>
    </div>
  );
};
