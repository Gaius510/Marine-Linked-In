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
import { brand } from '@/lib/brand'
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

  const [regName, setRegName] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regRole, setRegRole] = useState<Role>('SEAFARER')
  const [regCompany, setRegCompany] = useState('')
  const [regPhone, setRegPhone] = useState('')
  const [regCity, setRegCity] = useState('')
  const [regCountry, setRegCountry] = useState('')

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
    try {
      await login(loginEmail, loginPassword)
      toast.success(t('auth.loginSuccess'))
    } catch (err) {
      const key = (err as Error).message
      toast.error(errorMap[key] || t('common.error'))
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    if (regRole === 'RECRUITER' && !regCompany.trim()) {
      toast.error(t('auth.fillCompany'))
      return
    }

    try {
      await register({
        email: regEmail,
        password: regPassword,
        name: regName,
        role: regRole,
        company: regCompany || undefined,
        phone: regPhone || undefined,
        city: regCity || undefined,
        country: regCountry || undefined,
      })
      toast.success(t('auth.registerSuccess'))
    } catch (err) {
      const key = (err as Error).message
      toast.error(errorMap[key] || t('common.error'))
    }
  }

  function quickLogin(email: string, password: string) {
    setLoginEmail(email)
    setLoginPassword(password)
    setMode('login')
  }

  return (
    <div className="min-h-screen overflow-hidden bg-background text-foreground lg:grid lg:grid-cols-[1.05fr_0.95fr]">
      <section className="brand-hero-gradient relative flex min-h-[44rem] flex-col justify-between overflow-hidden p-8 text-white lg:min-h-screen lg:p-14">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-28 top-28 h-72 w-72 rounded-full bg-brand-seafoam/15 blur-3xl" />
          <div className="absolute bottom-10 right-0 h-96 w-96 rounded-full bg-brand-teal/20 blur-3xl" />
          <Waves className="absolute -bottom-16 right-[-4rem] h-[30rem] w-[30rem] text-white/10" />
          <Waves className="absolute bottom-24 right-16 h-72 w-72 text-white/10" />
        </div>

        <BrandLogo size="lg" tone="light" className="relative z-10" />

        <div className="relative z-10 max-w-2xl py-14 lg:py-0">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-sm text-white/80 backdrop-blur">
            <ShieldCheck className="size-4" />
            Trusted maritime hiring platform
          </div>
          <h1 className="max-w-xl text-4xl font-bold leading-tight tracking-tight lg:text-6xl">
            {t('auth.welcomeTitle')}
          </h1>
          <p className="mt-6 max-w-lg text-lg leading-8 text-white/78">
            {brand.description}
          </p>

          <div className="mt-8 grid max-w-xl grid-cols-3 gap-3">
            <Stat value="12k+" label="Seafarers" />
            <Stat value="80+" label="Countries" />
            <Stat value="500+" label="Jobs" />
          </div>
        </div>

        <div className="relative z-10 grid max-w-xl gap-4">
          <Feature icon={<Ship className="size-5" />} title={t('auth.feature.1.title')} desc={t('auth.feature.1.desc')} />
          <Feature icon={<Globe className="size-5" />} title={t('auth.feature.2.title')} desc={t('auth.feature.2.desc')} />
          <Feature icon={<Users className="size-5" />} title={t('auth.feature.3.title')} desc={t('auth.feature.3.desc')} />
        </div>
      </section>

      <section className="brand-surface-gradient relative flex min-h-screen items-center justify-center p-6 lg:p-12">
        <div className="absolute left-8 top-8 hidden items-center gap-2 rounded-full border bg-card/75 px-4 py-2 text-sm text-muted-foreground shadow-sm backdrop-blur lg:flex">
          <MapPin className="size-4 text-primary" />
          Global maritime careers network
        </div>

        <div className="w-full max-w-lg">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <BrandLogo size="md" />
          </div>

          <Tabs value={mode} onValueChange={(v) => setMode(v as 'login' | 'register')}>
            <TabsList className="mb-8 grid h-12 w-full grid-cols-2 rounded-2xl bg-muted/80 p-1 shadow-inner">
              <TabsTrigger value="login" className="rounded-xl text-base data-[state=active]:bg-card data-[state=active]:shadow">
                {t('auth.login')}
              </TabsTrigger>
              <TabsTrigger value="register" className="rounded-xl text-base data-[state=active]:bg-card data-[state=active]:shadow">
                {t('auth.register')}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <Card className="border-white/80 bg-card/90 shadow-2xl shadow-brand-navy/10 backdrop-blur-xl">
                <CardHeader className="space-y-2 pb-5">
                  <CardTitle className="text-2xl">{t('auth.loginTitle')}</CardTitle>
                  <CardDescription className="text-base">{t('auth.loginSubtitle')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email">{t('auth.email')}</Label>
                      <Input
                        id="login-email"
                        type="email"
                        required
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="h-12 rounded-xl"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="login-password">{t('auth.password')}</Label>
                      <Input
                        id="login-password"
                        type="password"
                        required
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="••••••••"
                        className="h-12 rounded-xl"
                      />
                    </div>

                    <Button
                      type="submit"
                      className="h-12 w-full rounded-xl text-base shadow-lg shadow-brand-navy/15 transition hover:-translate-y-0.5"
                      disabled={loading}
                    >
                      {loading && <Loader2 className="me-2 size-4 animate-spin" />}
                      {t('auth.loginCta')}
                    </Button>
                  </form>

                  <div className="mt-7">
                    <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      <BriefcaseBusiness className="size-4" />
                      {t('auth.demoAccounts')}
                    </div>

                    <div className="grid gap-3">
                      {demoAccounts.map((acc) => (
                        <button
                          key={acc.email}
                          type="button"
                          onClick={() => quickLogin(acc.email, acc.password)}
                          className="group flex items-center gap-3 rounded-2xl border bg-card/80 p-3 text-start shadow-sm transition hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md"
                        >
                          <div className="flex size-11 items-center justify-center rounded-xl bg-secondary text-primary ring-1 ring-primary/10">
                            <acc.icon className="size-5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-semibold">{t(acc.labelKey)}</div>
                            <div className="truncate text-xs text-muted-foreground">{acc.meta}</div>
                            <div className="truncate text-xs text-muted-foreground/75">{acc.email}</div>
                          </div>
                          <span className="text-sm font-semibold text-primary group-hover:text-foreground">
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
              <Card className="border-white/80 bg-card/90 shadow-2xl shadow-brand-navy/10 backdrop-blur-xl">
                <CardHeader>
                  <CardTitle className="text-2xl">{t('auth.registerTitle')}</CardTitle>
                  <CardDescription className="text-base">{t('auth.registerSubtitle')}</CardDescription>
                </CardHeader>

                <CardContent>
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div className="space-y-2">
                      <Label>{t('auth.accountType')}</Label>
                      <RadioGroup value={regRole} onValueChange={(v) => setRegRole(v as Role)} className="grid grid-cols-2 gap-3">
                        <Label htmlFor="role-seafarer" className="flex cursor-pointer items-center gap-2 rounded-xl border bg-card p-3 transition has-[:checked]:border-primary has-[:checked]:bg-secondary">
                          <RadioGroupItem id="role-seafarer" value="SEAFARER" />
                          <User className="size-4" />
                          <span className="text-sm font-medium">{t('role.seafarer')}</span>
                        </Label>
                        <Label htmlFor="role-recruiter" className="flex cursor-pointer items-center gap-2 rounded-xl border bg-card p-3 transition has-[:checked]:border-primary has-[:checked]:bg-secondary">
                          <RadioGroupItem id="role-recruiter" value="RECRUITER" />
                          <Building2 className="size-4" />
                          <span className="text-sm font-medium">{t('role.recruiter')}</span>
                        </Label>
                      </RadioGroup>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="reg-name">{t('auth.name')}</Label>
                      <Input id="reg-name" required value={regName} onChange={(e) => setRegName(e.target.value)} className="h-11 rounded-xl" />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="reg-email">{t('auth.email')}</Label>
                      <Input id="reg-email" type="email" required value={regEmail} onChange={(e) => setRegEmail(e.target.value)} className="h-11 rounded-xl" />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="reg-password">{t('auth.password')}</Label>
                      <Input id="reg-password" type="password" required minLength={6} value={regPassword} onChange={(e) => setRegPassword(e.target.value)} className="h-11 rounded-xl" />
                    </div>

                    {regRole === 'RECRUITER' && (
                      <div className="space-y-2">
                        <Label htmlFor="reg-company">
                          {t('auth.company')} <span className="text-destructive">*</span>
                        </Label>
                        <Input id="reg-company" required value={regCompany} onChange={(e) => setRegCompany(e.target.value)} className="h-11 rounded-xl" />
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="reg-phone">{t('auth.phone')}</Label>
                        <Input id="reg-phone" value={regPhone} onChange={(e) => setRegPhone(e.target.value)} className="h-11 rounded-xl" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="reg-city">{t('auth.city')}</Label>
                        <Input id="reg-city" value={regCity} onChange={(e) => setRegCity(e.target.value)} className="h-11 rounded-xl" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="reg-country">{t('auth.country')}</Label>
                      <Input id="reg-country" value={regCountry} onChange={(e) => setRegCountry(e.target.value)} className="h-11 rounded-xl" />
                    </div>

                    <Button type="submit" className="h-12 w-full rounded-xl text-base" disabled={loading}>
                      {loading && <Loader2 className="me-2 size-4 animate-spin" />}
                      {t('auth.registerCta')}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </div>
  )
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-white/15 bg-white/10 p-3 backdrop-blur">
      <div className="text-xl font-bold">{value}</div>
      <div className="text-xs text-white/65">{label}</div>
    </div>
  )
}

function Feature({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.06] p-3 backdrop-blur">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/20">
        {icon}
      </div>
      <div>
        <div className="font-semibold">{title}</div>
        <div className="text-sm leading-6 text-white/68">{desc}</div>
      </div>
    </div>
  )
}
