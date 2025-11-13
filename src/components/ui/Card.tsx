import type { HTMLAttributes, ReactNode } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  hover?: boolean
}

export const Card = ({
  children,
  hover = false,
  className = '',
  ...props
}: CardProps) => {
  return (
    <div
      className={`
        bg-white rounded-lg shadow-md border border-gray-200 p-6
        ${hover ? 'hover:shadow-lg transition-shadow duration-200' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  )
}
