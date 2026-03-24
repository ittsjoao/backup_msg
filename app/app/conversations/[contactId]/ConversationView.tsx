'use client'
import { useEffect, useRef, useState } from 'react'
import { Contact, Message } from '@/lib/types'
import { MessageBubble } from '@/components/MessageBubble'
import { SystemMessage } from '@/components/SystemMessage'
import { DateSeparator, getDateKey } from '@/components/DateSeparator'

const SYSTEM_TYPES = new Set(['ticket', 'transfer', 'close', 'open', 'bot_action', 'call_log', 'reaction', 'schedule', 'vcard'])
const LIMIT = 100

interface Props { contactId: string }

export function ConversationView({ contactId }: Props) {
  const [contact, setContact] = useState<Contact | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [total, setTotal] = useState(0)
  const [startOffset, setStartOffset] = useState(0)
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const loadingRef = useRef(false)

  // Carrega página específica (ASC), retorna os dados
  const fetchPage = async (offset: number, limit = LIMIT) => {
    const res = await fetch(`/api/contacts/${contactId}/messages?offset=${offset}&limit=${limit}`)
    return res.json()
  }

  // Reset e carga inicial ao trocar de contato
  useEffect(() => {
    setContact(null)
    setMessages([])
    setTotal(0)
    setStartOffset(0)

    // Busca contato e total de mensagens em paralelo
    Promise.all([
      fetch(`/api/contacts/${contactId}`).then(r => r.json()),
      fetchPage(0), // para pegar o total
    ]).then(async ([contactData, firstData]) => {
      setContact(contactData.contact ?? null)
      const tot = firstData.total as number
      setTotal(tot)

      // Carrega a última página para mostrar as mensagens mais recentes
      const lastOffset = Math.max(0, tot - LIMIT)
      const lastData = lastOffset > 0 ? await fetchPage(lastOffset) : firstData
      setMessages(lastData.messages)
      setStartOffset(lastOffset)
      // Scroll para o fim após render
      setTimeout(() => bottomRef.current?.scrollIntoView(), 50)
    })
  }, [contactId]) // eslint-disable-line

  // Carrega mensagens mais antigas (prepend) — usa limit exato para não sobrepor
  const loadOlder = async () => {
    if (loadingRef.current || startOffset === 0) return
    loadingRef.current = true
    setLoading(true)
    const newOffset = Math.max(0, startOffset - LIMIT)
    const count = startOffset - newOffset  // evita sobreposição com o que já temos
    const data = await fetchPage(newOffset, count)
    setMessages(prev => [...data.messages, ...prev])
    setStartOffset(newOffset)
    loadingRef.current = false
    setLoading(false)
  }

  const hasOlder = startOffset > 0
  const displayName = contact
    ? contact.internal_name || contact.name || contact.phone_number || 'Sem nome'
    : '...'

  return (
    <div className="flex-1 flex flex-col bg-[#efeae2] overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-[#075E54] text-white flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-green-300 flex items-center justify-center text-green-900 font-bold text-sm flex-shrink-0">
          {contact?.is_group ? '👥' : displayName.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="font-medium text-sm">{displayName}</p>
          <p className="text-xs text-green-100">
            {contact?.service_name && `${contact.service_name} · `}
            {total.toLocaleString('pt-BR')} mensagens
          </p>
        </div>
      </div>

      {/* Mensagens */}
      <div className="flex-1 overflow-y-auto px-4 py-2">
        {hasOlder && !loading && (
          <button
            onClick={loadOlder}
            className="w-full text-xs text-gray-500 py-2 hover:text-gray-700"
          >
            ↑ Carregar mensagens anteriores
          </button>
        )}
        {loading && <p className="text-center text-xs text-gray-400 py-2">Carregando...</p>}

        {messages.flatMap((m, i) => {
          const items = []
          const prevKey = i > 0 ? getDateKey(messages[i - 1].timestamp) : null
          const curKey  = getDateKey(m.timestamp)
          if (curKey && curKey !== prevKey) {
            items.push(<DateSeparator key={`sep-${m.id}`} timestamp={m.timestamp} />)
          }
          items.push(
            SYSTEM_TYPES.has(m.type || '')
              ? <SystemMessage key={m.id} message={m} />
              : <MessageBubble key={m.id} message={m} />
          )
          return items
        })}

        <div ref={bottomRef} />
      </div>
    </div>
  )
}
