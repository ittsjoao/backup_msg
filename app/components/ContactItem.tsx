'use client'
import { Contact } from '@/lib/types'

interface Props {
  contact: Contact
  isActive: boolean
  onClick: () => void
}

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const pad = (n: number) => String(n).padStart(2, '0')

function formatDate(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000)
  if (diffDays <= 0) return `${pad(d.getHours())}:${pad(d.getMinutes())}`
  if (diffDays < 7) return WEEKDAYS[d.getDay()]
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}`
}

export function ContactItem({ contact, isActive, onClick }: Props) {
  const displayName = contact.internal_name || contact.name || contact.phone_number || 'Sem nome'

  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 cursor-pointer border-b border-gray-100 hover:bg-gray-50 transition-colors ${isActive ? 'bg-green-50 border-l-4 border-l-green-500' : ''}`}
    >
      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-semibold text-sm flex-shrink-0">
        {contact.is_group ? '👥' : displayName.charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-baseline">
          <span className="text-sm font-medium text-gray-900 truncate">{displayName}</span>
          <span className="text-xs text-gray-400 ml-2 flex-shrink-0">
            {formatDate(contact.last_message_at)}
          </span>
        </div>
        {contact.service_name && (
          <span className="text-xs text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full">
            {contact.service_name}
          </span>
        )}
      </div>
    </div>
  )
}
