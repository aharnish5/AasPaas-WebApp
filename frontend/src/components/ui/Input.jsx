import { forwardRef } from 'react'
import { cn } from '../../utils/cn'

const Input = forwardRef(({ label, error, className, ...props }, ref) => {
  return (
    <div className="w-full">
      {label && (
        <label className="input-label" htmlFor={props.id || props.name}>
          {label}
        </label>
      )}
      <input
        ref={ref}
        className={cn('input-field', error && 'border-red-500 focus:ring-red-500/30', className)}
        {...props}
      />
      {error && <p className="input-error">{error}</p>}
    </div>
  )
})

Input.displayName = 'Input'

export default Input

