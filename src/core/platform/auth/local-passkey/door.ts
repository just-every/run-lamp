import {
 generateAuthenticationOptions, generateRegistrationOptions, verifyAuthenticationResponse, verifyRegistrationResponse,
} from '@simplewebauthn/server'
import { decodeClientDataJSON } from '@simplewebauthn/server/helpers'
import { z } from 'zod'
import { AuthError, securityHeaders } from '@runeditrun/rer/modules/operator-auth'
import { managedInstallation } from '@runeditrun/rer/modules/operator-auth/dev'
import { configure } from '@runeditrun/rer/internal/modules/operator-auth/config.mjs'
import { hashToken, opaqueToken } from '@runeditrun/rer/internal/modules/operator-auth/crypto.mjs'
import { localCookieName, requirePost, sessionCookie } from '@runeditrun/rer/internal/modules/operator-auth/http.mjs'
import { readInput } from '@runeditrun/rer/internal/modules/operator-auth/input.mjs'
import { personaSessions } from '@runeditrun/rer/internal/modules/operator-auth/dev/persona-entry.mjs'
import type { AppBindings } from '../../../app/types'
import { createLampAuth } from '..'
import { authConfig } from '../config'
import { localReturnCookie } from '../local-return'
import { PasskeyStore } from './repository'

const lifetimeSeconds = 300
const credential = z.object({
 id: z.string(), rawId: z.string(), type: z.literal('public-key'),
 clientExtensionResults: z.record(z.string(), z.unknown()),
}).passthrough()
const clientData = z.object({ clientDataJSON: z.string() }).passthrough()
const passkeyInput = z.discriminatedUnion('operation', [
 z.object({ operation: z.literal('enroll'), credential: credential.extend({
  response: clientData.extend({ attestationObject: z.string() }),
 }).optional() }).strict(),
 z.object({ operation: z.literal('signin'), credential: credential.extend({
  response: clientData.extend({ authenticatorData: z.string(), signature: z.string(), userHandle: z.string().optional() }),
 }).optional() }).strict(),
])
export const passkeyDoor = '/auth/local/passkey'
export function admitsPasskeys(request: Request, env: AppBindings) {
 if (!env.RER_DEV_KEY || env.RER_DEV_IDENTITY === 'off' || env.RER_DEMO === '1' || managedInstallation({ ...env })) return false
 const origin = new URL(authConfig(env).origin)
 return origin.protocol === 'http:' && origin.hostname === 'localhost' && new URL(request.url).origin === origin.origin
}

export async function passkeyResponse(request: Request, env: AppBindings): Promise<Response> {
 const headers = new Headers(securityHeaders())
 const config = configure(authConfig(env)), store = new PasskeyStore(env.DB)
 const cookiePrefix = localCookieName('lamp_passkey_challenge', config.origin)
 const attemptCookie = (challenge: string) => ({ cookieName: `${cookiePrefix}_${challenge}`, secure: config.secure })
 const reject = (status: number, error = 'passkey_refused') => Response.json({ error }, { status, headers })
 try {
  requirePost(request, config)
  const parsed = passkeyInput.safeParse(await readInput(request))
  if (!parsed.success) return reject(400)
  const { operation, credential: answer } = parsed.data
  const owner = await store.owner()
  if (!owner) return reject(403)
  const session = operation === 'enroll' ? await createLampAuth(env).getSession(request) : null
  if (operation === 'enroll' && (session?.operator.id !== owner.id || session.kind !== 'dev')) return reject(403)
  const credential = await store.credential(owner.id)
  if (operation === 'signin' && !credential) return reject(409)

  const rpID = 'localhost', verification = { expectedOrigin: config.origin, expectedRPID: rpID, requireUserVerification: true }
  if (answer === undefined) {
   if (operation === 'enroll' && credential) return reject(409, 'passkey_already_enrolled')
   const options = operation === 'enroll'
    ? await generateRegistrationOptions({ rpID, rpName: 'Lamp', userID: new TextEncoder().encode(owner.id),
      userName: owner.email, attestationType: 'none', authenticatorSelection: { residentKey: 'preferred', userVerification: 'required' },
      supportedAlgorithmIDs: [-7, -257] })
    : await generateAuthenticationOptions({ rpID, userVerification: 'required', allowCredentials: [{ id: credential!.id }] })
   const id = await store.begin(operation, owner, session?.id ?? null, options.challenge, Date.now() + lifetimeSeconds * 1000)
   headers.append('Set-Cookie', sessionCookie(id, attemptCookie(options.challenge), lifetimeSeconds))
   return Response.json(options, { headers })
  }

  let challenge: string
  try { challenge = decodeClientDataJSON(answer.response.clientDataJSON).challenge }
  catch { return reject(400) }
  if (typeof challenge !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(challenge)) return reject(400)
  const cookieConfig = attemptCookie(challenge)
  const { cookieName } = cookieConfig
  const challengeCookie = request.headers.get('cookie')?.split(';').map(cookie => cookie.trim()).filter(cookie => cookie.startsWith(cookieName + '='))
  if (challengeCookie?.length !== 1) return reject(400)
  const pending = await store.consume(challengeCookie[0].slice(cookieName.length + 1), challenge, operation, owner, session?.id ?? null)
  headers.append('Set-Cookie', sessionCookie('', cookieConfig, 0))
  if (!pending) return reject(400)
  const expectedChallenge = pending.challenge
  if (operation === 'enroll') {
   if (credential) return reject(409, 'passkey_already_enrolled')
   const proof = await verifyRegistrationResponse({ ...verification, expectedChallenge, response: answer }).catch(() => null)
   if (!proof?.verified || !proof.registrationInfo) return reject(400)
   if (!await store.enroll(owner, session!.id, proof.registrationInfo.credential)) {
    return reject(409, await store.credential(owner.id) ? 'passkey_already_enrolled' : 'passkey_refused')
   }
   return Response.json({ enrolled: true }, { headers })
  }

  const proof = await verifyAuthenticationResponse({ ...verification, expectedChallenge, credential: credential!, response: answer }).catch(() => null)
  if (!proof?.verified) return reject(400)
  const id = crypto.randomUUID(), token = opaqueToken()
  const hash = await hashToken(config.SESSION_SECRET, 'session', token)
  if (!await store.signIn(owner, credential!, proof.authenticationInfo.newCounter,
   { id, hash, expiresAt: Date.now() + config.sessionSeconds * 1000 })) return reject(409)
  headers.append('Set-Cookie', sessionCookie(token, config))
  headers.append('Set-Cookie', await personaSessions(env.RER_DEV_KEY!, config.origin).cookie(id, config.sessionSeconds))
  headers.append('Set-Cookie', localReturnCookie(config.origin, '', 0))
  return Response.json({ signedIn: true }, { headers })
 } catch (error) {
  return reject(error instanceof AuthError ? error.status : 503)
 }
}
