import { Message } from '@/lib/types'

const TYPE_ICONS: Record<string, string> = {
  image: '🖼️', document: '📄', audio: '🎵',
  video: '🎬', ptt: '🎤', sticker: '🎭',
}

interface Props { message: Message }

const pad = (n: number) => String(n).padStart(2, '0')

function formatTime(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// Mensagens enviadas por atendentes têm o nome embutido como "*Nome:*\ntexto"
function parseSender(text: string | null): { sender: string | null; body: string | null } {
  if (!text) return { sender: null, body: null }
  const match = text.match(/^\*([^*\n]+):\*\n?([\s\S]*)/)
  if (match) return { sender: match[1].trim(), body: match[2] || null }
  return { sender: null, body: text }
}

export function MessageBubble({ message }: Props) {
  const isSent = message.is_from_me === 1
  const icon = message.type ? TYPE_ICONS[message.type] : null

  const { sender, body } = parseSender(message.text)
  const displaySender = message.user_name || (isSent ? sender : null)
  const displayText = body ?? message.text
  const hasText = displayText && displayText.trim()

  return (
    <div className={`flex ${isSent ? 'justify-end' : 'justify-start'} mb-1`}>
      <div
        className={`max-w-[70%] px-3 py-2 rounded-2xl shadow-sm ${
          isSent
            ? 'bg-[#dcf8c6] rounded-tr-sm'
            : 'bg-white rounded-tl-sm'
        }`}
      >
        {displaySender && (
          <p className="text-xs font-semibold text-green-700 mb-1">{displaySender}</p>
        )}
        {icon && !hasText && (
          <p className="text-2xl">{icon}</p>
        )}
        {icon && hasText && (
          <p className="text-xs text-gray-500 mb-1">{icon} {message.type}</p>
        )}
        {hasText && (
          <p className="text-sm text-gray-800 whitespace-pre-wrap break-words">
            {displayText}
          </p>
        )}
        <p className={`text-xs mt-1 ${isSent ? 'text-right text-green-700' : 'text-gray-400'}`}>
          {formatTime(message.timestamp)}
        </p>
      </div>
    </div>
  )
}
