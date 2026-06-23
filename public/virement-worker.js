/* virement-worker.js — Service Worker */

let virementData = null
let intervalId = null

function checkVirement() {
  if (!virementData) return

  const dateCreditPrevue = virementData.dateEnvoi + 48 * 60 * 60 * 1000

  if (Date.now() >= dateCreditPrevue) {
    // Notifier tous les onglets ouverts
    self.clients.matchAll({ includeUncontrolled: true, type: 'window' }).then((clients) => {
      clients.forEach((client) =>
        client.postMessage({ type: 'VIREMENT_EXPIRE', virement: virementData })
      )
    })

    // Notification push visible même si l'onglet est fermé
    self.registration.showNotification('Virement crédité', {
      body: `Le virement de ${virementData.montant}€ vers ${virementData.beneficiaire} a été crédité.`,
      icon: '/globe.svg',
      tag: 'virement-expire',
    })

    // Stopper la surveillance
    virementData = null
    if (intervalId) {
      clearInterval(intervalId)
      intervalId = null
    }
  }
}

self.addEventListener('message', (event) => {
  if (event.data.type === 'START_WATCH') {
    virementData = event.data.virement

    // Stopper un éventuel interval précédent
    if (intervalId) clearInterval(intervalId)

    // Vérifier immédiatement puis toutes les 30 secondes
    checkVirement()
    intervalId = setInterval(checkVirement, 30 * 1000)
  }

  if (event.data.type === 'STOP_WATCH') {
    virementData = null
    if (intervalId) {
      clearInterval(intervalId)
      intervalId = null
    }
  }
})

// Reprendre la surveillance après un redémarrage du SW
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})