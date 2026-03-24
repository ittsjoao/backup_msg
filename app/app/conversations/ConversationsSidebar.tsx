'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Contact, Service } from '@/lib/types'
import { SearchBar } from '@/components/SearchBar'
import { ServiceFilter } from '@/components/ServiceFilter'
import { ContactItem } from '@/components/ContactItem'

export function ConversationsSidebar() {
  const router = useRouter()
  const pathname = usePathname()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [search, setSearch] = useState('')
  const [serviceId, setServiceId] = useState('')
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)
  const loaderRef = useRef<HTMLDivElement>(null)
  const loadingRef = useRef(false)

  const activeId = pathname.split('/conversations/')[1] || ''

  const loadContacts = useCallback(async (reset: boolean, currentSearch: string, currentServiceId: string, currentOffset: number) => {
    if (loadingRef.current) return
    loadingRef.current = true
    setLoading(true)
    const res = await fetch(
      `/api/contacts?search=${encodeURIComponent(currentSearch)}&serviceId=${currentServiceId}&offset=${currentOffset}&limit=50`
    )
    const data = await res.json()
    setContacts(prev => reset ? data.contacts : [...prev, ...data.contacts])
    setHasMore(data.hasMore)
    setOffset(currentOffset + 50)
    loadingRef.current = false
    setLoading(false)
  }, [])

  // Load services once
  useEffect(() => {
    fetch('/api/services').then(r => r.json()).then(d => setServices(d.services))
  }, [])

  // Reset and reload on filter change
  useEffect(() => {
    setOffset(0)
    setContacts([])
    setHasMore(true)
    loadContacts(true, search, serviceId, 0)
  }, [search, serviceId]) // eslint-disable-line

  // Intersection observer for infinite scroll
  useEffect(() => {
    if (!loaderRef.current) return
    const obs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !loadingRef.current) {
        setOffset(prev => {
          loadContacts(false, search, serviceId, prev)
          return prev
        })
      }
    }, { threshold: 0.5 })
    obs.observe(loaderRef.current)
    return () => obs.disconnect()
  }, [hasMore, search, serviceId, loadContacts])

  return (
    <div className="w-[350px] flex-shrink-0 bg-white border-r flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 bg-[#075E54] text-white">
        <h1 className="font-semibold text-lg">Backup Digisac</h1>
        <p className="text-xs text-green-100">Histórico de mensagens</p>
      </div>

      <SearchBar onSearch={setSearch} placeholder="Buscar contato ou número..." />

      <div className="px-3 pt-2 pb-1">
        <ServiceFilter services={services} selected={serviceId} onChange={setServiceId} />
      </div>

      {/* Lista */}
      <div className="flex-1 overflow-y-auto">
        {contacts.map(c => (
          <ContactItem
            key={c.id}
            contact={c}
            isActive={c.id === activeId}
            onClick={() => router.push(`/conversations/${c.id}`)}
          />
        ))}
        <div ref={loaderRef} className="py-2 text-center text-xs text-gray-400">
          {loading ? 'Carregando...' : hasMore ? '' : `${contacts.length} contatos`}
        </div>
      </div>
    </div>
  )
}
