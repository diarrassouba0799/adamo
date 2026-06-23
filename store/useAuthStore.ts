import { create } from 'zustand'
import { User, Transaction } from '@/types'
import { mockComptes, mockTransactions } from '@/lib/data'
import { supabase } from '../lib/supabase'

interface AlerteSecurite {
  active: boolean
  montant: number
  beneficiaire: string
}

interface VirementEnCours {
  id: string
  beneficiaire: string
  montant: number
  motif: string
  dateEnvoi: number
  dateCreditPrevue: number
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  solde: number
  avatar: string | null
  alerteSecurite: AlerteSecurite | null
  transactions: Transaction[]
  virementsEnCours: VirementEnCours[]
  compteEnVerification: boolean
  virementVerification: VirementEnCours | null

  login: (user: User) => Promise<void>
  logout: () => void
  retirerMontant: (montant: number) => Promise<void>
  setAvatar: (url: string) => void
  setAlerteSecurite: (alerte: AlerteSecurite | null) => void
  updateUser: (data: Partial<User>) => void
  ajouterTransaction: (t: Transaction) => Promise<void>
  ajouterVirementEnCours: (v: VirementEnCours) => Promise<void>
  setCompteEnVerification: (active: boolean, virement?: VirementEnCours | null) => Promise<void>
  verifierVirementsExpires: () => void
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  user: null,
  isAuthenticated: false,
  solde: mockComptes[0].solde,
  avatar: null,
  alerteSecurite: null,
  transactions: mockTransactions,
  virementsEnCours: [],
  compteEnVerification: false,
  virementVerification: null,

  // ── Login : charge toutes les données depuis Supabase ──────────────
  login: async (user) => {
    set({ user, isAuthenticated: true })

    try {
      // Charger le solde
      const { data: compte } = await supabase
        .from('compte')
        .select('*')
        .eq('id', 'main')
        .single()

      // Charger les transactions
      const { data: transactions } = await supabase
        .from('transactions')
        .select('*')
        .order('date', { ascending: false })

      // Charger les virements en cours
      const { data: virements } = await supabase
        .from('virements_en_cours')
        .select('*')

      // Charger l'état du compte (vérification)
      const { data: etat } = await supabase
        .from('etat_compte')
        .select('*')
        .eq('id', 'main')
        .single()

      set({
        solde: compte?.solde ?? mockComptes[0].solde,
        transactions: transactions?.map((t) => ({
          id: t.id,
          date: t.date,
          libelle: t.libelle,
          montant: t.montant,
          type: t.type,
          categorie: t.categorie,
          compteId: t.compte_id,
        })) ?? mockTransactions,
        virementsEnCours: virements?.map((v) => ({
          id: v.id,
          beneficiaire: v.beneficiaire,
          montant: v.montant,
          motif: v.motif,
          dateEnvoi: v.date_envoi,
          dateCreditPrevue: v.date_credit_prevue,
        })) ?? [],
        compteEnVerification: etat?.compte_en_verification ?? false,
        virementVerification: etat?.virement_verification ?? null,
      })

      // Vérifier les virements expirés
      setTimeout(() => get().verifierVirementsExpires(), 100)
    } catch (err) {
      console.error('Erreur chargement Supabase:', err)
      // Fallback sur les données locales si Supabase inaccessible
      setTimeout(() => get().verifierVirementsExpires(), 100)
    }
  },

  logout: () =>
    set({
      user: null,
      isAuthenticated: false,
      alerteSecurite: null,
    }),

  // ── Retirer montant : met à jour Supabase + state local ───────────
  retirerMontant: async (montant) => {
    const nouveauSolde = Math.max(0, get().solde - montant)
    set({ solde: nouveauSolde })

    try {
      await supabase
        .from('compte')
        .update({ solde: nouveauSolde })
        .eq('id', 'main')
    } catch (err) {
      console.error('Erreur mise à jour solde:', err)
    }
  },

  setAvatar: (url) => set({ avatar: url }),

  setAlerteSecurite: (alerte) => set({ alerteSecurite: alerte }),

  updateUser: (data) =>
    set({ user: get().user ? { ...get().user!, ...data } : null }),

  // ── Ajouter transaction : sauvegarde dans Supabase ────────────────
  ajouterTransaction: async (t) => {
    set({ transactions: [t, ...get().transactions] })

try {
  const { data, error } = await supabase
    .from('transactions')
    .insert({
      id: t.id,
      date: t.date,
      libelle: t.libelle,
      montant: t.montant,
      type: t.type,
      categorie: t.categorie,
      compte_id: t.compteId,
    })

  console.log('TRANSACTION DATA', data)
  console.log('TRANSACTION ERROR', error)

  if (error) {
    console.error('SUPABASE ERROR:', error)
  }
} catch (err) {
  console.error('Erreur ajout transaction:', err)
}
  },
  

  // ── Ajouter virement : sauvegarde dans Supabase ───────────────────
  ajouterVirementEnCours: async (v) => {
    set({ virementsEnCours: [v, ...get().virementsEnCours] })

    try {
      await supabase.from('virements_en_cours').insert({
        id: v.id,
        beneficiaire: v.beneficiaire,
        montant: v.montant,
        motif: v.motif,
        date_envoi: v.dateEnvoi,
        date_credit_prevue: v.dateCreditPrevue,
      })
    } catch (err) {
      console.error('Erreur ajout virement:', err)
    }
  },

  // ── État vérification : sauvegarde dans Supabase ──────────────────
  setCompteEnVerification: async (active, virement = null) => {
    set({
      compteEnVerification: active,
      virementVerification: virement,
    })

    try {
      await supabase
        .from('etat_compte')
        .update({
          compte_en_verification: active,
          virement_verification: virement,
        })
        .eq('id', 'main')
    } catch (err) {
      console.error('Erreur mise à jour vérification:', err)
    }
  },

  // ── Vérifier virements expirés ────────────────────────────────────
  verifierVirementsExpires: () => {
    const { virementsEnCours, compteEnVerification } = get()
    if (compteEnVerification) return
    const maintenant = Date.now()
    const expire = virementsEnCours.find((v) => maintenant >= v.dateCreditPrevue)
    if (expire) {
      get().setCompteEnVerification(true, expire)
    }
  },
}))