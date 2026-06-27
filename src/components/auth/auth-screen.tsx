'use client'

import { useState } from 'react'
import { useAuthStore } from '@/stores/auth-store'
import { useI18n } from '@/lib/i18n'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { BrandLogo } from '@/components/shared/brand-logo'
import { FieldError } from '@/components/shared/field-error'
import { brand } from '@/lib/brand'
import { loginSchema, registerSchema } from '@/lib/validation/auth'
import { apiFieldErrors, focusFirstInvalid, validateFields, type FieldErrors } from '@/lib/form-validation'
import { toast } from 'sonner'
import {
  Ship,
  Users,
  Globe,
  Waves,
  Loader2,
  User,
  Building2,
  ShieldCheck,
  MapPin,
  BriefcaseBusiness,
} from 'lucide-react'
import type { Role } from '@/lib/types'

const demoAccounts = [
  {
    labelKey: 'role.seafarer',
    email: 'seafarer1@maritimenet.com',
    password: 'seafarer123',
    icon: User,
    meta: 'Deck Officer • Manila',
  },
  {
    labelKey: 'role.recruiter',
    email: 'sarah@maersk-recruit.com',
    password: 'recruiter123',
    icon: Building2,
    meta: 'Recruiter • Copenhagen',
  },
  {
    labelKey: 'role.admin',
    email: 'admin@maritimenet.com',
    password: 'admin123',
    icon: Users,
    meta: 'Platform Admin',
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
    <div className="min-h-dvh w-full max-w-full overflow-x-hidden bg-background text-foreground lg:grid lg:h-dvh lg:max-h-dvh lg:grid-cols-[1.05fr_0.95fr] lg:overflow-hidden">
      <section className="brand-hero-gradient relative flex min-h-[36rem] flex-col justify-between overflow-hidden p-6 text-white sm:p-8 lg:h-full lg:min-h-0 lg:p-10 xl:p-14">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-x-0 top-0 h-40 bg-white/[0.04]" />
          <div className="absolute inset-y-0 right-0 w-1/2 bg-[linear-gradient(110deg,transparent,rgba(255,255,255,0.08))]" />
          <Waves className="absolute -bottom-14 right-[-3rem] h-[28rem] w-[28rem] text-white/10" />
          <Waves className="absolute bottom-24 right-16 h-64 w-64 text-white/10" />
        </div>

        <BrandLogo size="lg" tone="light" className="relative z-10" />

        <div className="relative z-10 max-w-2xl py-10 lg:py-0">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-sm font-medium text-white/80 backdrop-blur">
            <ShieldCheck className="size-4" />
            Trusted maritime hiring platform
          </div>
          <h1 className="max-w-xl text-4xl font-bold leading-tight tracking-tight lg:text-5xl xl:text-6xl">
            {t('auth.welcomeTitle')}
          </h1>
          <p className="mt-4 max-w-lg text-base leading-7 text-white/78 xl:mt-6 xl:text-lg xl:leading-8">
            {brand.description}
          </p>

          <div className="mt-6 grid max-w-xl grid-cols-3 gap-3 xl:mt-8">
            <Stat value="12k+" label="Seafarers" />
            <Stat value="80+" label="Countries" />
            <Stat value="500+" label="Jobs" />
          </div>
        </div>

        <div className="auth-feature-list relative z-10 grid max-w-xl gap-3 xl:gap-4">
          <Feature icon={<Ship className="size-5" />} title={t('auth.feature.1.title')} desc={t('auth.feature.1.desc')} />
          <Feature icon={<Globe className="size-5" />} title={t('auth.feature.2.title')} desc={t('auth.feature.2.desc')} />
          <Feature icon={<Users className="size-5" />} title={t('auth.feature.3.title')} desc={t('auth.feature.3.desc')} />
        </div>
      </section>

      <section className="auth-atmosphere brand-surface-gradient flex min-h-dvh justify-center overflow-hidden p-4 sm:p-6 lg:h-full lg:min-h-0 lg:overflow-y-auto lg:overscroll-contain lg:px-8 lg:py-6 xl:px-10">
        <div aria-hidden="true" className="auth-horizon" />

        <div className="relative z-10 flex w-full max-w-lg min-w-0 flex-col self-start pt-2 sm:pt-3 lg:pt-0">
          <div className="mb-4 flex items-center gap-3 lg:hidden">
            <BrandLogo size="md" />
          </div>

          <div className="surface-card mb-3 inline-flex w-fit max-w-full items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium text-muted-foreground backdrop-blur">
            <MapPin className="size-4 shrink-0 text-primary" />
            <span className="truncate">Global maritime careers network</span>
          </div>

          <Tabs value={mode} onValueChange={(v) => setMode(v as 'login' | 'register')}>
            <TabsList className="mb-3 grid h-10 w-full grid-cols-2">
              <TabsTrigger value="login" className="text-sm data-[state=active]:bg-card sm:text-base">
                {t('auth.login')}
              </TabsTrigger>
              <TabsTrigger value="register" className="text-sm data-[state=active]:bg-card sm:text-base">
                {t('auth.register')}
              </TabsTrigger>
            </TabsList>

            <div className="min-h-0">
              <TabsContent value="login">
                <Card className="surface-panel gap-3 border-white/80 py-4 backdrop-blur-xl sm:py-5">
                <CardHeader className="space-y-1 px-4 pb-2 sm:px-5">
                  <CardTitle className="text-xl sm:text-2xl">{t('auth.loginTitle')}</CardTitle>
                  <CardDescription className="text-sm sm:text-base">{t('auth.loginSubtitle')}</CardDescription>
                </CardHeader>
                <CardContent className="px-4 sm:px-5">
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
                        className="h-10 rounded-xl"
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
                        placeholder="••••••••"
                        className="h-10 rounded-xl"
                        aria-invalid={!!loginErrors.password}
                        aria-describedby={loginErrors.password ? 'login-password-error' : undefined}
                      />
                      <FieldError id="login-password-error" code={loginErrors.password} t={t} />
                    </div>

                    {loginFormError && (
                      <div
                        role="alert"
                        aria-live="polite"
                        className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm font-medium text-destructive"
                      >
                        {loginFormError}
                      </div>
                    )}

                    <Button
                      type="submit"
                      className="h-10 w-full rounded-xl text-sm shadow-lg shadow-brand-navy/15 sm:text-base"
                      disabled={loading}
                    >
                      {loading && <Loader2 className="me-2 size-4 animate-spin" />}
                      {t('auth.loginCta')}
                    </Button>
                  </form>

                  <div className="mt-4 border-t border-border/70 pt-3">
                    <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      <BriefcaseBusiness className="size-4" />
                      {t('auth.demoAccounts')}
                    </div>

                    <div className="grid gap-2">
                      {demoAccounts.map((acc) => (
                        <button
                          key={acc.email}
                          type="button"
                          onClick={() => quickLogin(acc.email, acc.password)}
                          className="motion-card-hover group flex cursor-pointer items-center gap-2.5 rounded-xl border bg-card/80 p-2.5 text-start shadow-sm hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                        >
                          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary ring-1 ring-primary/10">
                            <acc.icon className="size-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-semibold">{t(acc.labelKey)}</div>
                            <div className="truncate text-xs text-muted-foreground">{acc.meta}</div>
                            <div className="truncate text-xs text-muted-foreground/75">{acc.email}</div>
                          </div>
                          <span className="shrink-0 text-xs font-semibold text-primary group-hover:text-foreground sm:text-sm">
                            {t('auth.useDemo')}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="register">
                <Card className="surface-panel gap-3 border-white/80 py-4 backdrop-blur-xl sm:py-5">
                <CardHeader className="space-y-1 px-4 pb-2 sm:px-5">
                  <CardTitle className="text-xl sm:text-2xl">{t('auth.registerTitle')}</CardTitle>
                  <CardDescription className="text-sm sm:text-base">{t('auth.registerSubtitle')}</CardDescription>
                </CardHeader>

                <CardContent className="px-4 sm:px-5">
                  <form onSubmit={handleRegister} className="space-y-3" noValidate>
                    <div className="space-y-1.5">
                      <Label>{t('auth.accountType')}</Label>
                      <RadioGroup value={regRole} onValueChange={(v) => setRegRole(v as Role)} className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <Label htmlFor="role-seafarer" className="motion-card-hover flex cursor-pointer items-center gap-2 rounded-xl border bg-card p-2.5 transition has-[:checked]:border-primary has-[:checked]:bg-secondary">
                          <RadioGroupItem id="role-seafarer" value="SEAFARER" />
                          <User className="size-4" />
                          <span className="text-sm font-medium">{t('role.seafarer')}</span>
                        </Label>
                        <Label htmlFor="role-recruiter" className="motion-card-hover flex cursor-pointer items-center gap-2 rounded-xl border bg-card p-2.5 transition has-[:checked]:border-primary has-[:checked]:bg-secondary">
                          <RadioGroupItem id="role-recruiter" value="RECRUITER" />
                          <Building2 className="size-4" />
                          <span className="text-sm font-medium">{t('role.recruiter')}</span>
                        </Label>
                      </RadioGroup>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="reg-name">{t('auth.name')}</Label>
                      <Input id="reg-name" value={regName} onChange={(e) => { setRegName(e.target.value); setRegisterErrors((current) => ({ ...current, name: '' })) }} className="h-10 rounded-xl" aria-invalid={!!registerErrors.name} aria-describedby={registerErrors.name ? 'reg-name-error' : undefined} />
                      <FieldError id="reg-name-error" code={registerErrors.name} t={t} />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="reg-email">{t('auth.email')}</Label>
                      <Input id="reg-email" type="email" value={regEmail} onChange={(e) => { setRegEmail(e.target.value); setRegisterErrors((current) => ({ ...current, email: '' })) }} className="h-10 rounded-xl" aria-invalid={!!registerErrors.email} aria-describedby={registerErrors.email ? 'reg-email-error' : undefined} />
                      <FieldError id="reg-email-error" code={registerErrors.email} t={t} />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="reg-password">{t('auth.password')}</Label>
                      <Input id="reg-password" type="password" value={regPassword} onChange={(e) => { setRegPassword(e.target.value); setRegisterErrors((current) => ({ ...current, password: '' })) }} className="h-10 rounded-xl" aria-invalid={!!registerErrors.password} aria-describedby={registerErrors.password ? 'reg-password-error' : undefined} />
                      <FieldError id="reg-password-error" code={registerErrors.password} t={t} />
                    </div>

                    {regRole === 'RECRUITER' && (
                      <div className="space-y-1.5">
                        <Label htmlFor="reg-company">
                          {t('auth.company')} <span className="text-destructive">*</span>
                        </Label>
                        <Input id="reg-company" value={regCompany} onChange={(e) => { setRegCompany(e.target.value); setRegisterErrors((current) => ({ ...current, company: '' })) }} className="h-10 rounded-xl" aria-invalid={!!registerErrors.company} aria-describedby={registerErrors.company ? 'reg-company-error' : undefined} />
                        <FieldError id="reg-company-error" code={registerErrors.company} t={t} />
                      </div>
                    )}

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label htmlFor="reg-phone">{t('auth.phone')}</Label>
                        <Input id="reg-phone" value={regPhone} onChange={(e) => { setRegPhone(e.target.value); setRegisterErrors((current) => ({ ...current, phone: '' })) }} className="h-10 rounded-xl" aria-invalid={!!registerErrors.phone} aria-describedby={registerErrors.phone ? 'reg-phone-error' : undefined} />
                        <FieldError id="reg-phone-error" code={registerErrors.phone} t={t} />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="reg-city">{t('auth.city')}</Label>
                        <Input id="reg-city" value={regCity} onChange={(e) => { setRegCity(e.target.value); setRegisterErrors((current) => ({ ...current, city: '' })) }} className="h-10 rounded-xl" aria-invalid={!!registerErrors.city} aria-describedby={registerErrors.city ? 'reg-city-error' : undefined} />
                        <FieldError id="reg-city-error" code={registerErrors.city} t={t} />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="reg-country">{t('auth.country')}</Label>
                      <Input id="reg-country" value={regCountry} onChange={(e) => { setRegCountry(e.target.value); setRegisterErrors((current) => ({ ...current, country: '' })) }} className="h-10 rounded-xl" aria-invalid={!!registerErrors.country} aria-describedby={registerErrors.country ? 'reg-country-error' : undefined} />
                      <FieldError id="reg-country-error" code={registerErrors.country} t={t} />
                    </div>

                    <Button type="submit" className="h-10 w-full rounded-xl text-sm sm:text-base" disabled={loading}>
                      {loading && <Loader2 className="me-2 size-4 animate-spin" />}
                      {t('auth.registerCta')}
                    </Button>
                  </form>
                </CardContent>
                </Card>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </section>
    </div>
  )
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-xl border border-white/15 bg-white/10 p-3 backdrop-blur">
      <div className="text-xl font-bold">{value}</div>
      <div className="text-xs text-white/65">{label}</div>
    </div>
  )
}

function Feature({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.06] p-3 backdrop-blur">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-white/15 ring-1 ring-white/20">
        {icon}
      </div>
      <div>
        <div className="font-semibold">{title}</div>
        <div className="text-sm leading-6 text-white/68">{desc}</div>
      </div>
    </div>
  )
}
