export const MOCK_CREDENTIALS = {
  identifiant: '4978362510',
  password: '482951',
  code2fa: '465680',
  codeVirement: '578420',
  codeSecurite: '731926',
}

export function verifierCredentials(identifiant: string, password: string): boolean {
  return (
    identifiant === MOCK_CREDENTIALS.identifiant &&
    password === MOCK_CREDENTIALS.password
  )
}

export function verifier2FA(code: string): boolean {
  return code === MOCK_CREDENTIALS.code2fa
}

export function verifierCodeVirement(code: string): boolean {
  return code === MOCK_CREDENTIALS.codeVirement
}

export function verifierCodeSecurite(code: string): boolean {
  return code === MOCK_CREDENTIALS.codeSecurite
}