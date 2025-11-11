import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, Link } from 'react-router-dom'
import { login } from '../../store/slices/authSlice'
import Button from '../../components/ui/Button'
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

const VendorLogin = () => {
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
      await dispatch(login({ ...data, role: 'vendor' })).unwrap()
      toast.success('Login successful!')
      navigate('/vendor')
    } catch (err) {
      toast.error(err || 'Login failed')
    }
  }

  return (
    <div className="container-custom py-12">
      <div className="max-w-md mx-auto">
        <div className="card">
          <h1 className="text-2xl font-bold mb-6">Vendor Login</h1>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Email or Phone (+country code)"
              type="text"
              {...register('identifier')}
              error={errors.identifier?.message}
              placeholder="name@example.com or +919876543210"
            />
            <Input
              label="Password"
              type="password"
              {...register('password')}
              error={errors.password?.message}
            />
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <Button type="submit" variant="primary" className="w-full" loading={loading}>
              Login
            </Button>
          </form>
          <div className="mt-6 text-center space-y-2">
            <Link to="/forgot-password" className="text-sm text-[#0F766E] hover:underline">
              Forgot password?
            </Link>
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link to="/signup/vendor" className="text-[#0F766E] hover:underline font-medium">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default VendorLogin

