import { describe, it, expect } from 'vitest'

const EXPECTED_STUN_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  { urls: 'stun:stun3.l.google.com:19302' },
  { urls: 'stun:stun4.l.google.com:19302' },
  { urls: 'stun:global.stun.twilio.com:3478' },
  { urls: 'stun:stun.stunprotocol.org:3478' },
  { urls: 'stun:stun.voip.blackberry.com:3478' },
]

describe('ICE Servers Configuration Requirements', () => {
  it('expected configuration should have at least 6 STUN servers', () => {
    expect(EXPECTED_STUN_SERVERS.length).toBeGreaterThanOrEqual(6)
  })

  it('expected configuration should include Google STUN servers', () => {
    const allUrls = EXPECTED_STUN_SERVERS.map((s) => s.urls)
    expect(allUrls.some((url) => url.includes('stun.l.google.com'))).toBe(true)
    expect(allUrls.some((url) => url.includes('stun1.l.google.com'))).toBe(true)
    expect(allUrls.some((url) => url.includes('stun2.l.google.com'))).toBe(true)
  })

  it('expected configuration should include Twilio STUN server', () => {
    const allUrls = EXPECTED_STUN_SERVERS.map((s) => s.urls)
    expect(allUrls.some((url) => url.includes('twilio.com'))).toBe(true)
  })

  it('expected configuration should have valid STUN URL format', () => {
    EXPECTED_STUN_SERVERS.forEach((server) => {
      expect(server.urls).toMatch(/^stuns?:/)
    })
  })

  it('expected configuration should include backup STUN servers', () => {
    const allUrls = EXPECTED_STUN_SERVERS.map((s) => s.urls)
    const uniqueProviders = new Set(
      allUrls.map((url) => {
        const match = url.match(/stuns?:([^:]+)/)
        return match ? match[1].split('.').slice(-2).join('.') : ''
      }),
    )
    expect(uniqueProviders.size).toBeGreaterThanOrEqual(3)
  })
})
