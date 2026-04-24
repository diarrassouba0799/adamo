'use client'
import { useState, useEffect } from 'react'
import { CheckCircle, AlertCircle, Shield, ArrowRight, Clock } from 'lucide-react'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { useAuthStore } from '@/store/useAuthStore'
import { formatMontant } from '@/lib/utils'
import { verifierCodeVirement } from '@/lib/auth'

type Etape = 'formulaire' | 'confirmation' | '2fa' | 'succes'

function Compte48h({ dateEnvoi }: { dateEnvoi: number }) {
  const dateCible = dateEnvoi + 48 * 60 * 60 * 1000
  const [restant, setRestant] = useState(dateCible - Date.now())

  useEffect(() => {
    const interval = setInterval(() => {
      const r = dateCible - Date.now()
      setRestant(r)
      if (r <= 0) clearInterval(interval)
    }, 1000)
    return () => clearInterval(interval)
  }, [dateCible])

  if (restant <= 0) {
    return <span className="text-green-600 font-semibold">Credite</span>
  }

  const heures = Math.floor(restant / (1000 * 60 * 60))
  const minutes = Math.floor((restant % (1000 * 60 * 60)) / (1000 * 60))
  const secondes = Math.floor((restant % (1000 * 60)) / 1000)

  return (
    <span className="font-mono font-semibold text-amber-700">
      {String(heures).padStart(2, '0')}h {String(minutes).padStart(2, '0')}m {String(secondes).padStart(2, '0')}s
    </span>
  )
}

export default function VirementForm() {
  const {
    solde,
    retirerMontant,
    setAlerteSecurite,
    ajouterTransaction,
    ajouterVirementEnCours,
  } = useAuthStore()

  const [etape, setEtape] = useState<Etape>('formulaire')
  const [form, setForm] = useState({
    beneficiaire: '',
    iban: '',
    montant: '',
    motif: '',
  })
  const [code2fa, setCode2fa] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [reference, setReference] = useState('')
  const [dateEnvoi, setDateEnvoi] = useState(0)

  const montantNum = parseFloat(form.montant) || 0
  const estInhabituel = montantNum > 500

  function validate(): boolean {
    const e: Record<string, string> = {}
    if (!form.beneficiaire.trim()) e.beneficiaire = 'Nom du beneficiaire requis'
    if (!form.iban.trim() || form.iban.replace(/\s/g, '').length < 14)
      e.iban = 'IBAN invalide (minimum 14 caracteres)'
    if (!form.montant || montantNum <= 0) e.montant = 'Montant invalide'
    if (montantNum > solde)
      e.montant = `Solde insuffisant (disponible : ${formatMontant(solde)})`
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSoumettre(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setEtape('confirmation')
  }

  async function handleValider2FA(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    await new Promise((r) => setTimeout(r, 1000))

    if (!verifierCodeVirement(code2fa)) {
      setErrors({ code: 'Code incorrect. Reessayez.' })
      setLoading(false)
      return
    }

    const maintenant = Date.now()
    const ref = `VIR-${maintenant}`
    const dateStr = new Date().toISOString().split('T')[0]

    retirerMontant(montantNum)

    ajouterTransaction({
      id: ref,
      date: dateStr,
      libelle: `VIREMENT VERS ${form.beneficiaire.toUpperCase()}${form.motif ? ' - ' + form.motif : ''}`,
      montant: -montantNum,
      type: 'debit',
      categorie: 'Virement',
      compteId: 'c1',
    })

    ajouterVirementEnCours({
      id: ref,
      beneficiaire: form.beneficiaire,
      montant: montantNum,
      motif: form.motif,
      dateEnvoi: maintenant,
      dateCreditPrevue: maintenant + 48 * 60 * 60 * 1000,
    })

    if (estInhabituel) {
      setAlerteSecurite({
        active: true,
        montant: montantNum,
        beneficiaire: form.beneficiaire,
      })
    }

    setReference(ref)
    setDateEnvoi(maintenant)
    setEtape('succes')
    setLoading(false)
  }

  // ── Succes ────────────────────────────────
  if (etape === 'succes') {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 space-y-5">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle size={36} className="text-[#003189]" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Virement envoye !</h3>
          <p className="text-gray-500 text-sm">
            {formatMontant(montantNum)} debites vers{' '}
            <strong>{form.beneficiaire}</strong>
          </p>
          <p className="text-xs text-gray-400 bg-gray-50 rounded-lg px-4 py-2 font-mono">
            {reference}
          </p>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Clock size={18} className="text-amber-600" />
            <p className="font-semibold text-amber-900 text-sm">
              Credit prevu dans
            </p>
          </div>
          <div className="text-2xl text-center py-2">
            <Compte48h dateEnvoi={dateEnvoi} />
          </div>
          <div className="w-full bg-amber-100 rounded-full h-1.5">
            <div className="bg-amber-500 h-1.5 rounded-full w-full animate-pulse" />
          </div>
          <p className="text-xs text-amber-700 text-center">
            Le virement sera credite sur le compte de{' '}
            <strong>{form.beneficiaire}</strong> dans les 48 heures.
          </p>
        </div>

        <div className="bg-gray-50 rounded-lg p-3 space-y-1 text-xs text-gray-500">
          <p>Solde debite immediatement</p>
          <p>Transaction enregistree dans votre historique</p>
          <p>Credit sur le compte beneficiaire : sous 48h ouvrees</p>
        </div>

        <Button
          className="w-full"
          style={{ backgroundColor: '#003189' }}
          onClick={() => {
            setEtape('formulaire')
            setForm({ beneficiaire: '', iban: '', montant: '', motif: '' })
            setCode2fa('')
            setErrors({})
          }}
        >
          Nouveau virement
        </Button>
      </div>
    )
  }

  // ── 2FA ───────────────────────────────────
  if (etape === '2fa') {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-5">
        <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
          <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
            <Shield size={20} className="text-[#003189]" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Confirmation par SMS</h3>
            <p className="text-xs text-gray-500">
              Code envoye au +33 6 xx xx xx 42
            </p>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
          <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-1">
            Recapitulatif
          </p>
          <div className="flex justify-between">
            <span className="text-gray-500">Beneficiaire</span>
            <span className="font-medium">{form.beneficiaire}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Montant</span>
            <span className="font-semibold text-gray-900">
              {formatMontant(montantNum)}
            </span>
          </div>
          {form.motif && (
            <div className="flex justify-between">
              <span className="text-gray-500">Motif</span>
              <span>{form.motif}</span>
            </div>
          )}
        </div>

        <form onSubmit={handleValider2FA} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Code de confirmation (6 chiffres)
            </label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="000000"
              value={code2fa}
              onChange={(e) => setCode2fa(e.target.value.replace(/\D/g, ''))}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-center text-xl font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-[#003189] focus:border-transparent"
            />
          </div>
          {errors.code && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg text-center">
              {errors.code}
            </p>
          )}
          <button
            type="submit"
            disabled={code2fa.length !== 6 || loading}
            className="w-full bg-[#003189] hover:bg-[#002070] disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 rounded-xl transition-colors"
          >
            {loading ? 'Validation...' : 'Confirmer le virement'}
          </button>
          <button
            type="button"
            onClick={() => setEtape('confirmation')}
            className="w-full text-sm text-gray-400 hover:text-gray-600 py-1"
          >
            Retour
          </button>
        </form>

      </div>
    )
  }

  // ── Confirmation ──────────────────────────
  if (etape === 'confirmation') {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-5">
        <h3 className="font-semibold text-gray-900 pb-4 border-b border-gray-100">
          Confirmer le virement
        </h3>
        <div className="flex items-center justify-between bg-gray-50 rounded-xl p-4">
          <div>
            <p className="text-xs text-gray-400 mb-0.5">De</p>
            <p className="font-medium text-sm">Compte Courant</p>
            <p className="text-xs text-gray-500">{formatMontant(solde)} disponible</p>
          </div>
          <ArrowRight size={20} className="text-gray-400" />
          <div className="text-right">
            <p className="text-xs text-gray-400 mb-0.5">Vers</p>
            <p className="font-medium text-sm">{form.beneficiaire}</p>
            <p className="text-xs text-gray-500 font-mono">
              {form.iban.slice(0, 12)}...
            </p>
          </div>
        </div>
        <div className="text-center py-2">
          <p className="text-3xl font-bold text-gray-900">
            {formatMontant(montantNum)}
          </p>
          {form.motif && (
            <p className="text-sm text-gray-400 mt-1">"{form.motif}"</p>
          )}
        </div>
        {estInhabituel && (
          <div className="flex gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3">
            <AlertCircle size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700">
              <strong>Virement inhabituel</strong> — Une verification SMS sera requise.
            </p>
          </div>
        )}
        <div className="flex gap-3">
          <button
            onClick={() => setEtape('formulaire')}
            className="flex-1 border border-gray-300 text-gray-700 font-medium py-2.5 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Modifier
          </button>
          <button
            onClick={() => setEtape('2fa')}
            className="flex-1 bg-[#003189] hover:bg-[#002070] text-white font-medium py-2.5 rounded-xl transition-colors"
          >
            Continuer
          </button>
        </div>
      </div>
    )
  }

  // ── Formulaire ────────────────────────────
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      <div className="mb-6 pb-4 border-b border-gray-100">
        <h3 className="font-semibold text-gray-900">Emettre un virement</h3>
        <p className="text-xs text-gray-500 mt-0.5">
          Solde disponible :{' '}
          <span className="font-semibold text-[#003189]">
            {formatMontant(solde)}
          </span>
        </p>
      </div>
      <form onSubmit={handleSoumettre} className="space-y-5">
        <Input
          label="Nom du beneficiaire"
          placeholder="Jean Martin"
          value={form.beneficiaire}
          onChange={(e) => setForm({ ...form, beneficiaire: e.target.value })}
          error={errors.beneficiaire}
        />
        <Input
          label="IBAN"
          placeholder="FR76 3000 4028 3798 ..."
          value={form.iban}
          onChange={(e) => setForm({ ...form, iban: e.target.value })}
          error={errors.iban}
        />
        <Input
          label="Montant (EUR)"
          type="number"
          placeholder="0.00"
          min="0.01"
          step="0.01"
          value={form.montant}
          onChange={(e) => setForm({ ...form, montant: e.target.value })}
          error={errors.montant}
        />
        <Input
          label="Motif (facultatif)"
          placeholder="Remboursement restaurant..."
          value={form.motif}
          onChange={(e) => setForm({ ...form, motif: e.target.value })}
        />
        <div className="flex gap-2 bg-blue-50 border border-blue-100 rounded-lg p-3">
          <AlertCircle size={15} className="text-[#003189] flex-shrink-0 mt-0.5" />
          <p className="text-xs text-[#003189]">
            Verifiez l'IBAN avant de valider. Les virements sont definitifs.
          </p>
        </div>
        <button
          type="submit"
          className="w-full bg-[#003189] hover:bg-[#002070] text-white font-medium py-3 rounded-xl transition-colors"
        >
          Verifier le virement
        </button>
      </form>
    </div>
  )
}