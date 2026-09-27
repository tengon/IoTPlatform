'use client'

import { Suspense } from 'react'
import { useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Loader2, Cpu, Activity, Wifi, Lock, Mail, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const LoginSchema = z.object({
  email: z.email({ error: 'Please enter a valid email address.' }),
  password: z.string().min(1, { error: 'Password is required.' }),
})

type LoginForm = z.infer<typeof LoginSchema>

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/'
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(LoginSchema),
  })

  const onSubmit = (data: LoginForm) => {
    setError(null)
    startTransition(async () => {
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })

        const json = await res.json()

        if (!res.ok) {
          setError(json.error || 'Login failed. Please try again.')
          return
        }

        router.push(callbackUrl)
        router.refresh()
      } catch {
        setError('Network error. Please check your connection.')
      }
    })
  }

  return (
    <div className="min-h-screen flex bg-background relative overflow-hidden">
      {/* Animated background grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border)/0.4)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.4)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,black_40%,transparent_100%)]" />

      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 relative flex-col items-start justify-between p-12 bg-gradient-to-br from-primary/5 via-background to-primary/10">
        {/* Glowing orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 border border-primary/30 backdrop-blur-sm">
            <Cpu className="w-5 h-5 text-primary" />
          </div>
          <span className="font-semibold text-lg tracking-tight">IIoT Platform</span>
        </div>

        {/* Main content */}
        <div className="relative z-10 space-y-8 max-w-lg">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              Industrial IoT Monitoring
            </div>
            <h1 className="text-4xl xl:text-5xl font-bold leading-tight text-foreground">
              Real-time control<br />
              <span className="text-primary">at your fingertips</span>
            </h1>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Monitor machines, track OEE, manage alarms, and gain full visibility across your entire operation from one unified platform.
            </p>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Uptime', value: '99.9%', icon: Activity, color: 'text-emerald-400' },
              { label: 'Devices', value: '2,400+', icon: Cpu, color: 'text-cyan-400' },
              { label: 'Live Data', value: '< 50ms', icon: Wifi, color: 'text-violet-400' },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="rounded-xl border border-border/50 bg-card/40 backdrop-blur-sm p-4 space-y-2">
                <Icon className={`w-4 h-4 ${color}`} />
                <div className="font-bold text-xl text-foreground">{value}</div>
                <div className="text-xs text-muted-foreground">{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer text */}
        <p className="relative z-10 text-xs text-muted-foreground/60">
          © 2026 IIoT Platform · v2.5.0 · All rights reserved
        </p>
      </div>

      {/* Right panel — login form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 relative z-10">
        <div className="w-full max-w-md space-y-8">

          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-3 justify-center">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 border border-primary/30">
              <Cpu className="w-5 h-5 text-primary" />
            </div>
            <span className="font-semibold text-lg">IIoT Platform</span>
          </div>

          {/* Header */}
          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Welcome back</h2>
            <p className="text-muted-foreground text-sm">Sign in to your account to continue</p>
          </div>

          {/* Form card */}
          <div className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-xl p-7 shadow-xl shadow-black/5 space-y-6">

            {/* Error alert */}
            {error && (
              <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive animate-in slide-in-from-top-2 duration-200">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
              {/* Email field */}
              <div className="space-y-2">
                <Label htmlFor="login-email" className="text-sm font-medium">
                  Email address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="you@factory.io"
                    autoComplete="email"
                    className={`pl-10 h-11 transition-all ${errors.email ? 'border-destructive focus-visible:ring-destructive/30' : ''}`}
                    {...register('email')}
                  />
                </div>
                {errors.email && (
                  <p className="text-xs text-destructive flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Password field */}
              <div className="space-y-2">
                <Label htmlFor="login-password" className="text-sm font-medium">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className={`pl-10 pr-11 h-11 transition-all ${errors.password ? 'border-destructive focus-visible:ring-destructive/30' : ''}`}
                    {...register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-destructive flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Submit */}
              <Button
                id="login-submit"
                type="submit"
                className="w-full h-11 font-semibold text-sm gap-2 transition-all"
                disabled={isPending}
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Signing in…
                  </>
                ) : (
                  'Sign in'
                )}
              </Button>
            </form>

            {/* Demo hint */}
            <div className="pt-2 border-t border-border/40">
              <p className="text-xs text-muted-foreground/70 text-center leading-relaxed">
                Demo: use credentials from a seeded user account.<br />
                Contact your administrator for access.
              </p>
            </div>
          </div>

          {/* System status */}
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground/60">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            All systems operational
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center" />}>
      <LoginForm />
    </Suspense>
  )
}
