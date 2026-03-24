'use client'
import { useEffect, useState } from 'react'

interface Props {
  onSearch: (value: string) => void
  placeholder?: string
}

export function SearchBar({ onSearch, placeholder = 'Buscar...' }: Props) {
  const [value, setValue] = useState('')

  useEffect(() => {
    const t = setTimeout(() => onSearch(value), 300)
    return () => clearTimeout(t)
  }, [value, onSearch])

  return (
    <div className="px-3 py-2 border-b bg-gray-50">
      <input
        type="text"
        value={value}
        onChange={e => setValue(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-full outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
      />
    </div>
  )
}
