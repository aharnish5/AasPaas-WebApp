import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Input from '../../components/ui/Input'
import toast from 'react-hot-toast'
import api, { authAPI } from '../../services/api'
import { useDispatch } from 'react-redux'
import { getMe } from '../../store/slices/authSlice'
import { useAuth } from '../../hooks/useAuth'
import { useEffect } from 'react'
import { Lock, Mail, Phone, Sparkles, User } from 'lucide-react'

const passwordSchema = z.object({
  oldPassword: z.string().min(6),
  newPassword: z.string().min(6),
})

const emailSchema = z.object({
  password: z.string().min(6),
  newEmail: z.string().email(),
})

const detailsSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().regex(/^\+[1-9][0-9]{7,14}$/, 'Phone must be +countrycode and digits (e.g., +91XXXXXXXXXX)'),
})

const VendorSettings = () => {
  const dispatch = useDispatch()
  const { user } = useAuth()
  const pwForm = useForm({ resolver: zodResolver(passwordSchema) })
  const emForm = useForm({ resolver: zodResolver(emailSchema) })
  const detailsForm = useForm({ resolver: zodResolver(detailsSchema), defaultValues: { name: user?.name || '', phone: user?.phone || '' } })
  const detailsState = detailsForm.formState

  useEffect(() => {
    detailsForm.reset({ name: user?.name || '', phone: user?.phone || '' })
  }, [user])

  const onChangePassword = async (data) => {
    try {
      await api.patch('/auth/change-password', data)
      toast.success('Password updated')
      pwForm.reset()
    } catch (e) {
      toast.error(e.response?.data?.error || 'Failed to update password')
    }
  }

  const onChangeEmail = async (data) => {
    try {
      await api.patch('/auth/change-email', data)
      toast.success('Email updated')
      emForm.reset()
    } catch (e) {
      toast.error(e.response?.data?.error || 'Failed to update email')
    }
  }

  const onUpdateDetails = async (data) => {
    try {
      const res = await authAPI.updateProfile(data)
      toast.success('Profile updated')
      detailsForm.reset({ name: res.data.user?.name || '', phone: res.data.user?.phone || '' })
      dispatch(getMe())
    } catch (e) {
      toast.error(e.response?.data?.error || 'Failed to update profile')
    }
  }

  return (
    <div className="container-custom space-y-8 py-8">
      <div className="surface-card relative overflow-hidden rounded-3xl px-7 py-8 shadow-[var(--shadow-sm)]">
        <div className="absolute -top-16 right-12 h-36 w-36 rounded-full bg-[color:var(--color-primary)]/20 blur-3xl" />
        <div className="absolute -bottom-16 left-12 h-40 w-40 rounded-full bg-[color:var(--color-accent)]/18 blur-3xl" />
        <div className="relative grid gap-6 md:grid-cols-[minmax(0,1fr),auto] md:items-center">
          <div className="space-y-3">
            <span className="badge-pill inline-flex items-center gap-2 bg-primary/10 text-[color:var(--color-primary)]">
              <Sparkles className="h-4 w-4" />
              Vendor settings
            </span>
            <h1 className="text-3xl font-semibold tracking-[-0.03em] text-text md:text-4xl">
              Shape how customers see and reach your business.
            </h1>
            <p className="text-sm text-text-muted">
              Update owner contact details, manage credentials, and secure your storefront in one place.
            </p>
          </div>
          <div className="hidden justify-end md:flex">
            <div className="surface-card grid h-full min-w-[220px] place-items-center rounded-3xl px-6 py-6 text-center">
              <User className="h-8 w-8 text-[color:var(--color-primary)]" />
              <p className="mt-3 text-lg font-semibold text-text">{user?.name || 'Vendor'}</p>
              <p className="text-xs text-text-muted">{user?.email}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header mb-6">
          <div>
            <p className="card-subtitle">Profile</p>
            <h2 className="mt-2 text-xl font-semibold text-text">Contact details</h2>
          </div>
          <Phone className="h-6 w-6 text-[color:var(--color-primary)]" />
        </div>
        <form onSubmit={detailsForm.handleSubmit(onUpdateDetails)} className="grid gap-4 md:grid-cols-2">
          <Input label="Name" {...detailsForm.register('name')} error={detailsForm.formState.errors.name?.message} />
          <Input label="Phone (+country code)" type="tel" placeholder="+91XXXXXXXXXX" {...detailsForm.register('phone')} error={detailsForm.formState.errors.phone?.message} />
          <div className="md:col-span-2">
            <button
              type="submit"
              className="btn-gradient inline-flex w-full items-center justify-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] disabled:cursor-not-allowed disabled:opacity-60"
              disabled={!detailsState.isDirty || detailsState.isSubmitting}
            >
              {detailsState.isSubmitting ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="card">
          <div className="card-header mb-5">
            <div>
              <p className="card-subtitle">Security</p>
              <h2 className="mt-2 text-xl font-semibold text-text">Change password</h2>
            </div>
            <Lock className="h-6 w-6 text-[color:var(--color-primary)]" />
          </div>
          <form onSubmit={pwForm.handleSubmit(onChangePassword)} className="space-y-4">
            <Input label="Old Password" type="password" {...pwForm.register('oldPassword')} error={pwForm.formState.errors.oldPassword?.message} />
            <Input label="New Password" type="password" {...pwForm.register('newPassword')} error={pwForm.formState.errors.newPassword?.message} />
            <button
              type="submit"
              className="btn-gradient inline-flex w-full items-center justify-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] disabled:cursor-not-allowed disabled:opacity-60"
              disabled={pwForm.formState.isSubmitting}
            >
              {pwForm.formState.isSubmitting ? 'Updating…' : 'Update password'}
            </button>
          </form>
        </div>
        <div className="card">
          <div className="card-header mb-5">
            <div>
              <p className="card-subtitle">Account</p>
              <h2 className="mt-2 text-xl font-semibold text-text">Change email</h2>
            </div>
            <Mail className="h-6 w-6 text-[color:var(--color-primary)]" />
          </div>
          <form onSubmit={emForm.handleSubmit(onChangeEmail)} className="space-y-4">
            <Input label="Current Password" type="password" {...emForm.register('password')} error={emForm.formState.errors.password?.message} />
            <Input label="New Email" type="email" {...emForm.register('newEmail')} error={emForm.formState.errors.newEmail?.message} />
            <button
              type="submit"
              className="btn-gradient inline-flex w-full items-center justify-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] disabled:cursor-not-allowed disabled:opacity-60"
              disabled={emForm.formState.isSubmitting}
            >
              {emForm.formState.isSubmitting ? 'Updating…' : 'Update email'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default VendorSettings

