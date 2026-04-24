'use client'
import { Bell, Settings } from 'lucide-react'
import { useAuthStore } from '@/store/useAuthStore'

export default function Topbar({ title }: { title: string }) {
  const { user, avatar } = useAuthStore()

  return (
    <header
      className="px-6 py-4 flex items-center justify-between border-b"
      style={{
        background: 'white',
        borderColor: '#e5e7eb',
      }}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-1 h-7 rounded-full"
          style={{ background: 'linear-gradient(180deg, #003189, #0050c8)' }}
        />
        <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
      </div>

      <div className="flex items-center gap-3">
        <button className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>
        <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">
          <Settings size={20} />
        </button>
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center ml-1 overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #003189, #0050c8)' }}
        >
          {avatar ? (
            <img src={avatar} alt="avatar" className="w-full h-full object-cover" />
          ) : (
            <span className="text-white font-bold text-xs">
              {user?.prenom?.[0]}{user?.nom?.[0]}
            </span>
          )}
        </div>
      </div>
    </header>
  )
}