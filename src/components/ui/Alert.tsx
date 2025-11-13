import type { HTMLAttributes, ReactNode } from 'react'

type AlertVariant = 'warning' | 'danger'

interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  variant?: AlertVariant
  children: ReactNode
}

const variantStyles: Record<AlertVariant, { container: string; icon: string }> = {
  warning: {
    container: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    icon: '⚠',
  },
  danger: {
    container: 'bg-red-50 border-red-200 text-red-800',
    icon: '✕',
  },
}

export const Alert = ({
  variant = 'warning',
  children,
  className = '',
  ...props
}: AlertProps) => {
  const styles = variantStyles[variant]

  return (
    <div
      className={`rounded-lg border p-4 ${styles.container} ${className}`}
      role="alert"
      {...props}
    >
      <div className="flex gap-3">
        <span className="text-lg font-bold flex-shrink-0">{styles.icon}</span>
        <div className="flex-1">
          <div className="text-sm">{children}</div>
        </div>
      </div>
    </div>
  )
}
