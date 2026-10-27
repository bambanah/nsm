import { useState } from 'react'
import { createFileRoute, Link, redirect, useNavigate, useRouter } from '@tanstack/react-router'
import { Wordmark } from '@/components/app-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { authClient } from '@/auth/auth-client'
import { getUser } from '@/auth/auth.functions'
import { clearGuestPlan, loadGuestPlan } from '@/guest/guest-plan'
import { adoptGuestPlan } from '@/plan-settings/plan-settings.functions'

export const Route = createFileRoute('/sign-in')({
  beforeLoad: async () => {
    if (await getUser()) throw redirect({ to: '/' })
  },
  component: SignIn,
})

function SignIn() {
  const navigate = useNavigate()
  const router = useRouter()
  const [isSignUp, setIsSignUp] = useState(false)
  const [error, setError] = useState<string>()

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const email = String(form.get('email'))
    const password = String(form.get('password'))
    const result = isSignUp
      ? await authClient.signUp.email({ name: String(form.get('name')), email, password })
      : await authClient.signIn.email({ email, password })
    if (result.error) return setError(result.error.message)
    const guestPlan = loadGuestPlan()
    if (guestPlan) {
      try {
        await adoptGuestPlan({ data: guestPlan })
      } catch (e) {
        return setError((e as Error).message)
      }
      clearGuestPlan()
    }
    router.clearCache()
    await navigate({ to: '/' })
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 p-4">
      <h1 className="text-center text-3xl font-extrabold tracking-tight">
        <Wordmark />
      </h1>
      <form onSubmit={submit} className="flex flex-col gap-4">
        {isSignUp && (
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" required autoComplete="name" />
          </div>
        )}
        <div className="flex flex-col gap-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" required autoComplete="email" />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete={isSignUp ? 'new-password' : 'current-password'}
          />
        </div>
        {error && <p className="text-destructive text-sm">{error}</p>}
        <Button type="submit">{isSignUp ? 'Sign up' : 'Sign in'}</Button>
        <Button
          type="button"
          variant="link"
          onClick={() => {
            setIsSignUp(!isSignUp)
            setError(undefined)
          }}
        >
          {isSignUp ? 'Have an account? Sign in' : 'No account? Sign up'}
        </Button>
        <Button variant="link" asChild>
          <Link to="/">Continue without signing in</Link>
        </Button>
      </form>
    </main>
  )
}
