// lib/virementWorker.ts

export interface VirementWatchData {
  id: string
  beneficiaire: string
  montant: number
  motif: string
  dateEnvoi: number
}

async function getWorkerRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return null

  try {
    const reg = await navigator.serviceWorker.register('/virement-worker.js', {
      scope: '/',
    })
    await navigator.serviceWorker.ready
    return reg
  } catch (err) {
    console.error('[virementWorker] Enregistrement échoué :', err)
    return null
  }
}

export async function startVirementWorker(virement: VirementWatchData): Promise<void> {
  const reg = await getWorkerRegistration()
  if (!reg) return

  const worker = reg.active || reg.installing || reg.waiting
  if (!worker) return

  // Demander la permission pour les notifications
  if ('Notification' in window && Notification.permission === 'default') {
    await Notification.requestPermission()
  }

  worker.postMessage({ type: 'START_WATCH', virement })
}

export async function stopVirementWorker(): Promise<void> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return

  try {
    const reg = await navigator.serviceWorker.getRegistration('/virement-worker.js')
    const worker = reg?.active || reg?.installing || reg?.waiting
    worker?.postMessage({ type: 'STOP_WATCH' })
  } catch (err) {
    console.error('[virementWorker] Arrêt échoué :', err)
  }
}

export function onVirementExpire(
  callback: (virement: VirementWatchData) => void
): () => void {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return () => {}

  const handler = (event: MessageEvent) => {
    if (event.data?.type === 'VIREMENT_EXPIRE') {
      callback(event.data.virement)
    }
  }

  navigator.serviceWorker.addEventListener('message', handler)

  // Retourne une fonction de cleanup
  return () => navigator.serviceWorker.removeEventListener('message', handler)
}