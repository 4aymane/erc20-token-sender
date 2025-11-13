import type { ReactNode } from 'react'

interface InfoBoxProps {
  icon: ReactNode
  title: string
  description: string
}

export const InfoBox = ({ icon, title, description }: InfoBoxProps) => {
  return (
    <div className="p-4 rounded-lg border bg-white border-gray-200">
      <div className="text-2xl mb-2">{icon}</div>
      <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
  )
}
