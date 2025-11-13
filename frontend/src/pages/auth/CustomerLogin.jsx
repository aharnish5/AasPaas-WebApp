import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, Link } from 'react-router-dom'
import { login } from '../../store/slices/authSlice'
import Input from '../../components/ui/Input'
import toast from 'react-hot-toast'

const phoneRegex = /^\+[1-9][0-9]{7,14}$/
const loginSchema = z.object({
  identifier: z
    .string()
    .trim()
    .refine((val) => /.+@.+\..+/.test(val) || phoneRegex.test(val), {
      message: 'Enter a valid email or phone with country code (e.g., +91XXXXXXXXXX)',
    }),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

const CustomerLogin = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { loading, error } = useSelector((state) => state.auth)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data) => {
    try {
      await dispatch(login({ ...data, role: 'customer' })).unwrap()
      toast.success('Login successful!')
      navigate('/customer')
    } catch (err) {
      toast.error(err || 'Login failed')
    }
  }

  return (
    <div className="min-h-screen bg-[color:var(--color-background)] py-12">
      <div className="container-custom">
        <div className="grid gap-10 lg:grid-cols-[1.1fr,0.9fr] lg:items-center">
          <div className="space-y-8">
            <div className="max-w-xl space-y-4">
              <span className="badge-pill bg-primary/10 text-primary">Customer access</span>
              <h1 className="text-4xl font-semibold tracking-[-0.03em] text-text md:text-5xl">
                Welcome back to the AasPaas courtside.
              </h1>
              <p className="text-base text-text-muted">
                Pick up exactly where you left off—track favourite shops, discover curated offers, and drop
                feedback that keeps your neighbourhood vendors shining.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { title: 'Save top picks', description: 'Bookmark boutique experiences and revisit in two taps.' },
                { title: 'Faster check-ins', description: 'One login unlocks rewards, reviews, and appointments.' },
              ].map((feature) => (
                <div key={feature.title} className="surface-card rounded-3xl p-5 shadow-[var(--shadow-xs)]">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-text-muted/70">
                    {feature.title}
                  </p>
                  <p className="mt-2 text-sm text-text-muted">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="surface-card relative rounded-3xl p-8 shadow-[var(--shadow-sm)]">
            <div className="absolute -top-10 right-10 hidden h-24 w-24 rounded-full bg-primary/25 blur-3xl md:block" />
            <div className="absolute -bottom-12 left-6 hidden h-28 w-28 rounded-full bg-accent/20 blur-3xl md:block" />
            <div className="relative space-y-6">
              <div className="space-y-2 text-center">
                <h2 className="text-2xl font-semibold text-text">Customer Login</h2>
                <p className="text-sm text-text-muted">
                  Sign in with your registered email or verified number.
                </p>
              </div>
              {error && (
                <div className="alert alert-danger text-sm">
                  <p className="alert-title">Login error</p>
                  <p className="alert-description">{error}</p>
                </div>
              )}
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <Input
                  label="Email or Phone (+country code)"
                  type="text"
                  {...register('identifier')}
                  error={errors.identifier?.message}
                  placeholder="name@example.com or +919876543210"
                  autoComplete="username"
                />
                <Input
                  label="Password"
                  type="password"
                  {...register('password')}
                  error={errors.password?.message}
                  autoComplete="current-password"
                />
                <button
                  type="submit"
                  className="btn-gradient flex w-full items-center justify-center gap-3 text-xs font-semibold uppercase tracking-[0.18em] disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={loading}
                >
                  {loading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-b-transparent" />}
                  Login
                </button>
              </form>
              <div className="space-y-3 text-center text-sm">
                <Link
                  to="/forgot-password"
                  className="font-semibold text-[color:var(--color-primary)] underline-offset-4 hover:underline"
                >
                  Forgot password?
                </Link>
                <p className="text-text-muted">
                  Don't have an account?{' '}
                  <Link
                    to="/signup/customer"
                    className="font-semibold text-[color:var(--color-accent)] underline-offset-4 hover:underline"
                  >
                    Sign up
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CustomerLogin

