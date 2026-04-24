'use client'

import { useState } from 'react'
import { Eye, EyeOff, TrendingUp } from 'lucide-react'
import { Compte } from '@/types'
import { formatMontant } from '@/lib/utils'

export default function SoldeCard({ compte }: { compte: Compte }) {
  const [visible, setVisible] = useState(true)

  return (
    <div className="bg-gradient-to-br from-[#003A8F] to-[#0055C8] rounded-2xl p-6 text-white shadow-lg">
      
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-blue-100 text-sm font-medium">{compte.libelle}</p>
          <p className="text-xs text-blue-200 mt-0.5 font-mono">
            {compte.iban.slice(0, 14)}...
          </p>
        </div>

        <button
          onClick={() => setVisible(!visible)}
          className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-all"
        >
          {visible ? <Eye size={18} /> : <EyeOff size={18} />}
        </button>
      </div>

      <div className="mb-5">
        <p className="text-blue-200 text-xs mb-1">Solde disponible</p>
        <p className="text-3xl font-bold tracking-tight">
          {visible ? formatMontant(compte.solde) : '•••• €'}
        </p>
      </div>

      <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2 w-fit backdrop-blur-sm">
        <TrendingUp size={14} />
        <span className="text-xs text-blue-100">+2 800,00 € ce mois</span>
      </div>
    </div>
  )
}