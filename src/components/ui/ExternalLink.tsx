import type { AnchorHTMLAttributes, ReactNode } from 'react'

interface ExternalLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'subtle'
  showIcon?: boolean
}

const variantStyles = {
  primary: 'text-blue-600 hover:text-blue-700 font-medium',
  secondary: 'text-gray-600 hover:text-gray-700',
  subtle: 'text-blue-600 hover:underline',
}

export const ExternalLink = ({
  href,
  children,
  variant = 'primary',
  showIcon = true,
  className = '',
  ...props
}: ExternalLinkProps) => {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1 transition-colors ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
      {showIcon && <span className="text-xs">↗</span>}
    </a>
  )
}
