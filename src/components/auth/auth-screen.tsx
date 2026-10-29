'use client'

import { useState } from 'react'
import { useAuthStore } from '@/stores/auth-store'
import { useI18n } from '@/lib/i18n'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { BrandLogo } from '@/components/shared/brand-logo'
import { FieldError } from '@/components/shared/field-error'
import { loginSchema, registerSchema } from '@/lib/validation/auth'
import { apiFieldErrors, focusFirstInvalid, validateFields, type FieldErrors } from '@/lib/form-validation'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import {
  Loader2,
  User,
  Building2,
} from 'lucide-react'
import type { Role } from '@/lib/types'

const demoAccounts = [
  {
    labelKey: 'role.seafarer',
    email: 'seafarer1@maritimenet.com',
    password: 'seafarer123',
    meta: 'Deck Officer • Manila',
  },
  {
    labelKey: 'role.recruiter',
    email: 'sarah@maersk-recruit.com',
    password: 'recruiter123',
    meta: 'Recruiter • Copenhagen',
  },
]

export function AuthScreen() {
  const { t } = useI18n()
  const { login, register, loading } = useAuthStore()
  const [mode, setMode] = useState<'login' | 'register'>('login')

  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginErrors, setLoginErrors] = useState<FieldErrors>({})
  const [loginFormError, setLoginFormError] = useState<string | null>(null)

  const [regName, setRegName] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regRole, setRegRole] = useState<Role>('SEAFARER')
  const [regCompany, setRegCompany] = useState('')
  const [regPhone, setRegPhone] = useState('')
  const [regCity, setRegCity] = useState('')
  const [regCountry, setRegCountry] = useState('')
  const [registerErrors, setRegisterErrors] = useState<FieldErrors>({})

  const errorMap: Record<string, string> = {
    invalid_credentials: t('auth.invalidCredentials'),
    email_exists: t('auth.emailExists'),
    company_required: t('auth.fillCompany'),
    missing_fields: t('auth.missingFields'),
    short_password: t('auth.shortPassword'),
    admin_registration_disabled: t('auth.adminRegistrationDisabled'),
    invalid_role: t('auth.invalidRole'),
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoginErrors({})
    setLoginFormError(null)
    const payload = { email: loginEmail, password: loginPassword }
    const result = validateFields(loginSchema, payload)
    if (result.errors) {
      setLoginErrors(result.errors)
      focusFirstInvalid(result.errors, { email: 'login-email', password: 'login-password' })
      return
    }
    try {
      await login(result.data.email, result.data.password)
      toast.success(t('auth.loginSuccess'))
    } catch (err) {
      const fields = apiFieldErrors(err)
      if (fields) {
        setLoginErrors(fields)
        focusFirstInvalid(fields, { email: 'login-email', password: 'login-password' })
        return
      }
      const key = (err as Error).message
      if (key === 'invalid_credentials') {
        setLoginFormError(t('auth.invalidCredentials'))
        return
      }
      toast.error(errorMap[key] || t('common.error'))
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setRegisterErrors({})
    const payload = {
      email: regEmail,
      password: regPassword,
      name: regName,
      role: regRole,
      company: regCompany || undefined,
      phone: regPhone || undefined,
      city: regCity || undefined,
      country: regCountry || undefined,
    }
    const result = validateFields(registerSchema, payload)
    if (result.errors) {
      setRegisterErrors(result.errors)
      focusFirstInvalid(result.errors, {
        email: 'reg-email',
        password: 'reg-password',
        name: 'reg-name',
        company: 'reg-company',
        phone: 'reg-phone',
        city: 'reg-city',
        country: 'reg-country',
      })
      return
    }

    try {
      await register({
        ...result.data,
        company: result.data.company ?? undefined,
        phone: result.data.phone ?? undefined,
        city: result.data.city ?? undefined,
        country: result.data.country ?? undefined,
      })
      toast.success(t('auth.registerSuccess'))
    } catch (err) {
      const fields = apiFieldErrors(err)
      if (fields) {
        setRegisterErrors(fields)
        focusFirstInvalid(fields, {
          email: 'reg-email',
          password: 'reg-password',
          name: 'reg-name',
          company: 'reg-company',
          phone: 'reg-phone',
          city: 'reg-city',
          country: 'reg-country',
        })
        return
      }
      const key = (err as Error).message
      if (key === 'company_required') {
        const fields = { company: 'company_required' }
        setRegisterErrors(fields)
        focusFirstInvalid(fields, { company: 'reg-company' })
        return
      }
      toast.error(errorMap[key] || t('common.error'))
    }
  }

  function quickLogin(email: string, password: string) {
    setLoginEmail(email)
    setLoginPassword(password)
    setLoginErrors({})
    setLoginFormError(null)
    setMode('login')
  }

  return (
    <div className="min-h-dvh w-full max-w-full overflow-x-hidden bg-background text-foreground lg:grid lg:h-dvh lg:max-h-dvh lg:grid-cols-[minmax(23rem,0.9fr)_minmax(32rem,1.1fr)] lg:overflow-hidden">
      <aside className="auth-brand-panel relative isolate hidden min-h-0 flex-col overflow-hidden border-e border-white/12 p-10 text-white lg:flex xl:p-12">
        <BrandLogo size="lg" tone="light" unframed className="auth-brand-text relative z-10" />

        <div className="auth-brand-copy relative z-10 mt-[10vh] max-w-sm">
          <p className="text-sm font-medium text-brand-seafoam/90">{t('auth.workspaceLabel')}</p>
          <h1 className="mt-2 max-w-sm text-3xl font-semibold leading-tight text-white xl:text-4xl">{t('auth.welcomeTitle')}</h1>
          <p className="mt-3 max-w-sm text-sm leading-6 text-white/80">{t('auth.welcomeSubtitle')}</p>

          <div className="mt-6 space-y-1.5 text-xs font-medium text-white/78">
            <p>{t('auth.feature.1.title')}</p>
            <p>{t('auth.feature.2.title')}</p>
            <p>{t('auth.feature.3.title')}</p>
          </div>
        </div>

        <p className="auth-brand-text relative z-10 mt-auto max-w-md text-xs leading-5 text-white/75">{t('auth.audience')}</p>
      </aside>

      <main className="auth-form-panel flex min-h-dvh justify-center overflow-hidden bg-background px-4 py-5 sm:px-6 lg:h-full lg:min-h-0 lg:overflow-y-auto lg:overscroll-contain lg:px-10 lg:py-8">
        <div className={cn('flex w-full max-w-[34rem] min-w-0 flex-col', mode === 'login' ? 'self-start lg:self-center lg:pb-[5vh]' : 'self-start')}>
          <div className="auth-mobile-brand relative -mx-4 -mt-5 mb-6 flex min-h-24 items-center justify-between overflow-hidden border-b border-white/15 px-4 py-5 text-white sm:-mx-6 sm:px-6 lg:hidden">
            <BrandLogo size="md" tone="light" unframed className="relative z-10" />
            <span className="relative z-10 text-xs font-medium text-white/80">{t('auth.mobileLabel')}</span>
          </div>

          <div className="mb-5">
            <h1 className="text-2xl font-semibold">{mode === 'login' ? t('auth.loginTitle') : t('auth.registerTitle')}</h1>
            <p className="mt-1.5 max-w-md text-sm leading-5 text-muted-foreground">
              {mode === 'login' ? t('auth.loginSubtitle') : t('auth.registerSubtitle')}
            </p>
          </div>

          <Tabs value={mode} onValueChange={(v) => setMode(v as 'login' | 'register')}>
            <TabsList className="mb-5 h-9 gap-6">
              <TabsTrigger value="login" className="text-sm">
                {t('auth.login')}
              </TabsTrigger>
              <TabsTrigger value="register" className="text-sm">
                {t('auth.register')}
              </TabsTrigger>
            </TabsList>

            <div className="min-h-0">
              <TabsContent value="login">
                <div>
                  <h2 className="sr-only">{t('auth.loginTitle')}</h2>
                  <form onSubmit={handleLogin} className="space-y-3" noValidate>
                    <div className="space-y-1.5">
                      <Label htmlFor="login-email">{t('auth.email')}</Label>
                      <Input
                        id="login-email"
                        type="email"
                        value={loginEmail}
                        onChange={(e) => {
                          setLoginEmail(e.target.value)
                          setLoginErrors((current) => ({ ...current, email: '' }))
                          setLoginFormError(null)
                        }}
                        placeholder="you@example.com"
                        className="h-10"
                        aria-invalid={!!loginErrors.email}
                        aria-describedby={loginErrors.email ? 'login-email-error' : undefined}
                      />
                      <FieldError id="login-email-error" code={loginErrors.email} t={t} />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="login-password">{t('auth.password')}</Label>
                      <Input
                        id="login-password"
                        type="password"
                        value={loginPassword}
                        onChange={(e) => {
                          setLoginPassword(e.target.value)
                          setLoginErrors((current) => ({ ...current, password: '' }))
                          setLoginFormError(null)
                        }}
                        placeholder={t('auth.password')}
                        className="h-10"
                        aria-invalid={!!loginErrors.password}
                        aria-describedby={loginErrors.password ? 'login-password-error' : undefined}
                      />
                      <FieldError id="login-password-error" code={loginErrors.password} t={t} />
                    </div>

                    {loginFormError && (
                      <div
                        role="alert"
                        aria-live="polite"
                        className="border-s-2 border-destructive bg-destructive/5 px-3 py-2 text-sm font-medium text-destructive"
                      >
                        {loginFormError}
                      </div>
                    )}

                    <Button
                      type="submit"
                      className="h-10 w-full text-sm"
                      disabled={loading}
                    >
                      {loading && <Loader2 className="me-2 size-4 animate-spin" />}
                      {t('auth.loginCta')}
                    </Button>
                  </form>

                  <div className="mt-5 border-t border-border/60 pt-3">
                    <div className="mb-1.5 text-xs font-medium text-muted-foreground">{t('auth.demoAccounts')}</div>

                    <div className="space-y-0.5">
                      {demoAccounts.map((acc) => (
                        <div key={acc.email} className="flex min-w-0 items-center gap-3 py-2">
                          <div className="min-w-0 flex-1 text-xs">
                            <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-0.5">
                              <span className="font-medium text-foreground">{t(acc.labelKey)}</span>
                              <span className="truncate text-muted-foreground">{acc.meta}</span>
                            </div>
                            <div className="truncate text-muted-foreground/85">{acc.email}</div>
                          </div>
                          <button
                            type="button"
                            onClick={() => quickLogin(acc.email, acc.password)}
                            className="shrink-0 rounded-sm px-1 py-1 text-xs font-medium text-muted-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            {t('auth.useDemo')}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="register">
                <div>
                  <h2 className="sr-only">{t('auth.registerTitle')}</h2>
                  <form onSubmit={handleRegister} className="space-y-3" noValidate>
                    <div className="space-y-1.5">
                      <Label>{t('auth.accountType')}</Label>
                      <RadioGroup value={regRole} onValueChange={(v) => setRegRole(v as Role)} className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <Label htmlFor="role-seafarer" className="flex cursor-pointer items-center gap-2 rounded-md border bg-card p-2.5 transition-colors has-[:checked]:border-primary has-[:checked]:bg-secondary">
                          <RadioGroupItem id="role-seafarer" value="SEAFARER" />
                          <User className="size-4" />
                          <span className="text-sm font-medium">{t('role.seafarer')}</span>
                        </Label>
                        <Label htmlFor="role-recruiter" className="flex cursor-pointer items-center gap-2 rounded-md border bg-card p-2.5 transition-colors has-[:checked]:border-primary has-[:checked]:bg-secondary">
                          <RadioGroupItem id="role-recruiter" value="RECRUITER" />
                          <Building2 className="size-4" />
                          <span className="text-sm font-medium">{t('role.recruiter')}</span>
                        </Label>
                      </RadioGroup>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="reg-name">{t('auth.name')}</Label>
                      <Input id="reg-name" value={regName} onChange={(e) => { setRegName(e.target.value); setRegisterErrors((current) => ({ ...current, name: '' })) }} className="h-10" aria-invalid={!!registerErrors.name} aria-describedby={registerErrors.name ? 'reg-name-error' : undefined} />
                      <FieldError id="reg-name-error" code={registerErrors.name} t={t} />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="reg-email">{t('auth.email')}</Label>
                      <Input id="reg-email" type="email" value={regEmail} onChange={(e) => { setRegEmail(e.target.value); setRegisterErrors((current) => ({ ...current, email: '' })) }} className="h-10" aria-invalid={!!registerErrors.email} aria-describedby={registerErrors.email ? 'reg-email-error' : undefined} />
                      <FieldError id="reg-email-error" code={registerErrors.email} t={t} />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="reg-password">{t('auth.password')}</Label>
                      <Input id="reg-password" type="password" value={regPassword} onChange={(e) => { setRegPassword(e.target.value); setRegisterErrors((current) => ({ ...current, password: '' })) }} className="h-10" aria-invalid={!!registerErrors.password} aria-describedby={registerErrors.password ? 'reg-password-error' : undefined} />
                      <FieldError id="reg-password-error" code={registerErrors.password} t={t} />
                    </div>

                    {regRole === 'RECRUITER' && (
                      <div className="space-y-1.5">
                        <Label htmlFor="reg-company">
                          {t('auth.company')} <span className="text-destructive">*</span>
                        </Label>
                        <Input id="reg-company" value={regCompany} onChange={(e) => { setRegCompany(e.target.value); setRegisterErrors((current) => ({ ...current, company: '' })) }} className="h-10" aria-invalid={!!registerErrors.company} aria-describedby={registerErrors.company ? 'reg-company-error' : undefined} />
                        <FieldError id="reg-company-error" code={registerErrors.company} t={t} />
                      </div>
                    )}

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label htmlFor="reg-phone">{t('auth.phone')}</Label>
                        <Input id="reg-phone" value={regPhone} onChange={(e) => { setRegPhone(e.target.value); setRegisterErrors((current) => ({ ...current, phone: '' })) }} className="h-10" aria-invalid={!!registerErrors.phone} aria-describedby={registerErrors.phone ? 'reg-phone-error' : undefined} />
                        <FieldError id="reg-phone-error" code={registerErrors.phone} t={t} />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="reg-city">{t('auth.city')}</Label>
                        <Input id="reg-city" value={regCity} onChange={(e) => { setRegCity(e.target.value); setRegisterErrors((current) => ({ ...current, city: '' })) }} className="h-10" aria-invalid={!!registerErrors.city} aria-describedby={registerErrors.city ? 'reg-city-error' : undefined} />
                        <FieldError id="reg-city-error" code={registerErrors.city} t={t} />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="reg-country">{t('auth.country')}</Label>
                      <Input id="reg-country" value={regCountry} onChange={(e) => { setRegCountry(e.target.value); setRegisterErrors((current) => ({ ...current, country: '' })) }} className="h-10" aria-invalid={!!registerErrors.country} aria-describedby={registerErrors.country ? 'reg-country-error' : undefined} />
                      <FieldError id="reg-country-error" code={registerErrors.country} t={t} />
                    </div>

                    <Button type="submit" className="h-10 w-full text-sm" disabled={loading}>
                      {loading && <Loader2 className="me-2 size-4 animate-spin" />}
                      {t('auth.registerCta')}
                    </Button>
                  </form>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </main>
    </div>
  )
}
