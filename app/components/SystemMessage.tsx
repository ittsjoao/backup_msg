import { Message } from '@/lib/types'

interface Props { message: Message }

const pad = (n: number) => String(n).padStart(2, '0')

function formatTime(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function getSystemText(message: Message): string {
  const dept = message.department_name ? ` · ${message.department_name}` : ''
  const user = message.user_name ? ` · ${message.user_name}` : ''

  if (message.type === 'ticket') {
    let data: Record<string, unknown> = {}
    try { data = JSON.parse(message.raw_json || '{}')?.data || {} } catch {}
    if (data.ticketOpen)                       return `📋 Chamado aberto${user}${dept}`
    if (data.ticketTransfer)                   return `🔀 Chamado transferido${user}${dept}`
    if (data.ticketClose || data.ticketClosed) return `✅ Chamado encerrado${user}${dept}`
    return `📋 Chamado${user}${dept}`
  }

  if (message.type === 'bot_action') {
    const text = message.text || ''
    return text.length > 120 ? text.slice(0, 117) + '...' : text
  }

  if (message.type === 'reaction')  return `Reagiu: ${message.text || ''}`
  if (message.type === 'call_log')  return `📞 Chamada`
  if (message.type === 'schedule')  return `🗓️ Agendamento`
  if (message.type === 'vcard')     return `👤 Contato compartilhado`

  return message.text || `[${message.type}]`
}

export function SystemMessage({ message }: Props) {
  const time = formatTime(message.timestamp)
  const text = getSystemText(message)

  return (
    <div className="flex justify-center my-2">
      <span className="text-xs text-gray-500 bg-gray-100 rounded-full px-3 py-1 max-w-[80%] text-center">
        {text}{time ? ` · ${time}` : ''}
      </span>
    </div>
  )
}
