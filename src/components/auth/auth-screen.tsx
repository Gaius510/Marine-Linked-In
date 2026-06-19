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
import { toast } from 'sonner'
import { Anchor, Ship, Users, Globe, Waves, Loader2, User, Building2 } from 'lucide-react'
import type { Role } from '@/lib/types'

const demoAccounts = [
  { labelKey: 'role.seafarer', email: 'seafarer1@maritimenet.com', password: 'seafarer123', icon: User },
  { labelKey: 'role.recruiter', email: 'sarah@maersk-recruit.com', password: 'recruiter123', icon: Building2 },
  { labelKey: 'role.admin', email: 'admin@maritimenet.com', password: 'admin123', icon: Users },
]

export function AuthScreen() {
  const { t } = useI18n()
  const { login, register, loading } = useAuthStore()
  const [mode, setMode] = useState<'login' | 'register'>('login')

  // login state
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')

  // register state
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
    missing_fields: t('common.error'),
    short_password: t('common.error'),
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    try {
      await login(loginEmail, loginPassword)
      toast.success(t('common.success'))
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
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left brand panel */}
      <div className="maritime-gradient text-white lg:w-1/2 p-8 lg:p-14 flex flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <Waves className="absolute -bottom-10 -right-10 w-96 h-96" />
        </div>
        <div className="relative z-10 flex items-center gap-3">
          <div className="size-11 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center ring-1 ring-white/20">
            <Anchor className="size-6" />
          </div>
          <div>
            <div className="text-xl font-bold tracking-tight">{t('brand.name')}</div>
            <div className="text-xs text-white/70">{t('brand.tagline')}</div>
          </div>
        </div>

        <div className="relative z-10 my-10 lg:my-0">
          <h1 className="text-3xl lg:text-4xl font-bold leading-tight mb-4">{t('auth.welcomeTitle')}</h1>
          <p className="text-white/80 text-base lg:text-lg max-w-md">{t('auth.welcomeSubtitle')}</p>
        </div>

        <div className="relative z-10 grid gap-4 max-w-md">
          <Feature icon={<Ship className="size-5" />} title={t('auth.feature.1.title')} desc={t('auth.feature.1.desc')} />
          <Feature icon={<Globe className="size-5" />} title={t('auth.feature.2.title')} desc={t('auth.feature.2.desc')} />
          <Feature icon={<Users className="size-5" />} title={t('auth.feature.3.title')} desc={t('auth.feature.3.desc')} />
        </div>
      </div>

      {/* Right auth panel */}
      <div className="lg:w-1/2 flex items-center justify-center p-6 lg:p-12 bg-background">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="size-9 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
              <Anchor className="size-5" />
            </div>
            <span className="font-bold text-lg">{t('brand.name')}</span>
          </div>

          <Tabs value={mode} onValueChange={(v) => setMode(v as 'login' | 'register')}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">{t('auth.login')}</TabsTrigger>
              <TabsTrigger value="register">{t('auth.register')}</TabsTrigger>
            </TabsList>

            {/* Login */}
            <TabsContent value="login">
              <Card>
                <CardHeader>
                  <CardTitle>{t('auth.loginTitle')}</CardTitle>
                  <CardDescription>{t('auth.loginSubtitle')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email">{t('auth.email')}</Label>
                      <Input id="login-email" type="email" required value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} placeholder="you@example.com" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="login-password">{t('auth.password')}</Label>
                      <Input id="login-password" type="password" required value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} placeholder="••••••••" />
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading && <Loader2 className="size-4 animate-spin me-2" />}
                      {t('auth.loginCta')}
                    </Button>
                  </form>

                  <div className="mt-6">
                    <div className="text-xs font-medium text-muted-foreground mb-2">{t('auth.demoAccounts')}</div>
                    <div className="grid gap-2">
                      {demoAccounts.map((acc) => (
                        <button
                          key={acc.email}
                          type="button"
                          onClick={() => quickLogin(acc.email, acc.password)}
                          className="flex items-center gap-3 p-2.5 rounded-lg border border-border hover:border-primary/50 hover:bg-accent transition-colors text-start"
                        >
                          <div className="size-8 rounded-md bg-accent flex items-center justify-center text-accent-foreground">
                            <acc.icon className="size-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium">{t(acc.labelKey)}</div>
                            <div className="text-xs text-muted-foreground truncate">{acc.email}</div>
                          </div>
                          <span className="text-xs text-primary font-medium">{t('auth.useDemo')}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Register */}
            <TabsContent value="register">
              <Card>
                <CardHeader>
                  <CardTitle>{t('auth.registerTitle')}</CardTitle>
                  <CardDescription>{t('auth.registerSubtitle')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div className="space-y-2">
                      <Label>{t('auth.accountType')}</Label>
                      <RadioGroup value={regRole} onValueChange={(v) => setRegRole(v as Role)} className="grid grid-cols-2 gap-3">
                        <Label htmlFor="role-seafarer" className="flex items-center gap-2 p-3 rounded-lg border cursor-pointer has-[:checked]:border-primary has-[:checked]:bg-accent transition-colors">
                          <RadioGroupItem id="role-seafarer" value="SEAFARER" />
                          <User className="size-4" />
                          <span className="text-sm font-medium">{t('role.seafarer')}</span>
                        </Label>
                        <Label htmlFor="role-recruiter" className="flex items-center gap-2 p-3 rounded-lg border cursor-pointer has-[:checked]:border-primary has-[:checked]:bg-accent transition-colors">
                          <RadioGroupItem id="role-recruiter" value="RECRUITER" />
                          <Building2 className="size-4" />
                          <span className="text-sm font-medium">{t('role.recruiter')}</span>
                        </Label>
                      </RadioGroup>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reg-name">{t('auth.name')}</Label>
                      <Input id="reg-name" required value={regName} onChange={(e) => setRegName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reg-email">{t('auth.email')}</Label>
                      <Input id="reg-email" type="email" required value={regEmail} onChange={(e) => setRegEmail(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reg-password">{t('auth.password')}</Label>
                      <Input id="reg-password" type="password" required minLength={6} value={regPassword} onChange={(e) => setRegPassword(e.target.value)} />
                    </div>
                    {regRole === 'RECRUITER' && (
                      <div className="space-y-2">
                        <Label htmlFor="reg-company">{t('auth.company')} <span className="text-destructive">*</span></Label>
                        <Input id="reg-company" required value={regCompany} onChange={(e) => setRegCompany(e.target.value)} />
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="reg-phone">{t('auth.phone')}</Label>
                        <Input id="reg-phone" value={regPhone} onChange={(e) => setRegPhone(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="reg-city">{t('auth.city')}</Label>
                        <Input id="reg-city" value={regCity} onChange={(e) => setRegCity(e.target.value)} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reg-country">{t('auth.country')}</Label>
                      <Input id="reg-country" value={regCountry} onChange={(e) => setRegCountry(e.target.value)} />
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading && <Loader2 className="size-4 animate-spin me-2" />}
                      {t('auth.registerCta')}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}

function Feature({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="flex gap-3 items-start">
      <div className="size-9 rounded-lg bg-white/15 ring-1 ring-white/20 flex items-center justify-center shrink-0">{icon}</div>
      <div>
        <div className="font-semibold text-sm">{title}</div>
        <div className="text-white/70 text-sm">{desc}</div>
      </div>
    </div>
  )
}
