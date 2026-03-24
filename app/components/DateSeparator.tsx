const MONTHS = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez']
const WEEKDAYS = ['domingo','segunda','terça','quarta','quinta','sexta','sábado']
const pad = (n: number) => String(n).padStart(2, '0')

function formatSeparatorDate(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  const now = new Date()

  // Zera horas para comparar só datas
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const day   = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const diffDays = Math.round((today.getTime() - day.getTime()) / 86400000)

  if (diffDays === 0) return 'Hoje'
  if (diffDays === 1) return 'Ontem'
  if (diffDays < 7)  return WEEKDAYS[d.getDay()]
  if (d.getFullYear() === now.getFullYear()) {
    return `${pad(d.getDate())} de ${MONTHS[d.getMonth()]}`
  }
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`
}

export function DateSeparator({ timestamp }: { timestamp: string | null }) {
  const label = formatSeparatorDate(timestamp)
  if (!label) return null
  return (
    <div className="flex items-center justify-center my-3">
      <span className="text-xs text-gray-500 bg-[#d9fdd3] rounded-full px-4 py-1 shadow-sm">
        {label}
      </span>
    </div>
  )
}

export function getDateKey(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
}
