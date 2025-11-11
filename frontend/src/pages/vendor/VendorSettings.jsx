import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import toast from 'react-hot-toast'
import api, { authAPI } from '../../services/api'
import { useDispatch } from 'react-redux'
import { getMe } from '../../store/slices/authSlice'
import { useAuth } from '../../hooks/useAuth'
import { useEffect } from 'react'

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
  const { formState } = detailsForm

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
    <div className="container-custom py-8">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      <div className="card mb-6">
        <h2 className="text-lg font-semibold mb-4">Profile Details</h2>
        <form onSubmit={detailsForm.handleSubmit(onUpdateDetails)} className="grid md:grid-cols-2 gap-4">
          <Input label="Name" {...detailsForm.register('name')} error={detailsForm.formState.errors.name?.message} />
          <Input label="Phone (+country code)" type="tel" placeholder="+91XXXXXXXXXX" {...detailsForm.register('phone')} error={detailsForm.formState.errors.phone?.message} />
          <div className="md:col-span-2">
            <Button type="submit" variant="primary" disabled={!formState.isDirty}>Save Changes</Button>
          </div>
        </form>
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Change Password</h2>
          <form onSubmit={pwForm.handleSubmit(onChangePassword)} className="space-y-4">
            <Input label="Old Password" type="password" {...pwForm.register('oldPassword')} error={pwForm.formState.errors.oldPassword?.message} />
            <Input label="New Password" type="password" {...pwForm.register('newPassword')} error={pwForm.formState.errors.newPassword?.message} />
            <Button type="submit" variant="primary">Update Password</Button>
          </form>
        </div>
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Change Email</h2>
          <form onSubmit={emForm.handleSubmit(onChangeEmail)} className="space-y-4">
            <Input label="Current Password" type="password" {...emForm.register('password')} error={emForm.formState.errors.password?.message} />
            <Input label="New Email" type="email" {...emForm.register('newEmail')} error={emForm.formState.errors.newEmail?.message} />
            <Button type="submit" variant="secondary">Update Email</Button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default VendorSettings

