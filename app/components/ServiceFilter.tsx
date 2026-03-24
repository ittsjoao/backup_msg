'use client'
import { Service } from '@/lib/types'

interface Props {
  services: Service[]
  selected: string
  onChange: (id: string) => void
}

export function ServiceFilter({ services, selected, onChange }: Props) {
  return (
    <select
      value={selected}
      onChange={e => onChange(e.target.value)}
      className="w-full px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-full outline-none focus:border-green-500"
    >
      <option value="">Todas as conexões</option>
      {services.map(s => (
        <option key={s.id} value={s.id}>{s.name}</option>
      ))}
    </select>
  )
}
