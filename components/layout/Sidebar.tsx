'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, ArrowLeftRight, CreditCard,
  Send, LogOut, ChevronRight, Settings
} from 'lucide-react'
import { useAuthStore } from '@/store/useAuthStore'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
  { href: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
  { href: '/virements', label: 'Virements', icon: Send },
  { href: '/cartes', label: 'Mes cartes', icon: CreditCard },
  { href: '/parametres', label: 'Parametres', icon: Settings },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { logout, user } = useAuthStore()

  function handleLogout() {
    logout()
    document.cookie = 'bnp-auth=; Max-Age=0; path=/'
    router.push('/login')
  }

  return (
    <aside className="hidden lg:flex flex-col w-64 h-screen sticky top-0"
      style={{ background: 'linear-gradient(180deg, #002a75 0%, #003189 100%)' }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-white/10">
        <div className="w-20 h-20 bg-white rounded-lg flex items-center justify-center">
          <span className="text-[#003189] font-bold text-sm">
            <p className="w-15 h-11"><img src="https://upload.wikimedia.org/wikipedia/fr/thumb/d/d4/Logo_La_Banque_postale_2022.svg/1280px-Logo_La_Banque_postale_2022.svg.png" alt="" /></p>
          </span>
        </div>
        <div>
          <p className="font-bold text-white text-sm">La banque postale</p>
          <p className="text-xs text-blue-200">Banque en ligne</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                active
                  ? 'bg-white text-[#003189]'
                  : 'text-blue-100 hover:bg-white/10 hover:text-white'
              )}
            >
              <Icon size={18} />
              <span className="flex-1">{label}</span>
              {active && <ChevronRight size={14} />}
            </Link>
          )
        })}
      </nav>

      {/* Profil + Déconnexion */}
      <div className="px-3 py-4 border-t border-white/10 space-y-1">
        <div className="flex items-center gap-3 px-3 py-2.5">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
            <span className="text-white font-bold text-xs">
              {user?.prenom?.[0]}{user?.nom?.[0]}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {user?.prenom} {user?.nom}
            </p>
            <p className="text-xs text-blue-200 truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-300 hover:bg-red-500/10 hover:text-red-200 transition-colors"
        >
          <LogOut size={18} />
          Deconnexion
        </button>
      </div>
    </aside>
  )
}