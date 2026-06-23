'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, ArrowLeftRight,
  CreditCard, Send, Settings
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard', label: 'Accueil', icon: LayoutDashboard },
  { href: '/transactions', label: 'Mouvements', icon: ArrowLeftRight },
  { href: '/virements', label: 'Virement', icon: Send },
  { href: '/cartes', label: 'Cartes', icon: CreditCard },
  { href: '/parametres', label: 'Profil', icon: Settings },
]

export default function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="flex">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors',
                active
                  ? 'text-[#003189]'
                  : 'text-gray-400 hover:text-[#003189]'
              )}
            >
              <Icon
                size={20}
                className={active ? 'text-[#003189]' : 'text-[#7a8bbd]'}
              />
              {label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}