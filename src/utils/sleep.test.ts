import { describe, it, expect } from 'vitest'
import { sleep } from '@/utils/sleep'

describe('sleep', () => {
  it('should resolve after at least the specified ms', async () => {
    const start = Date.now()
    await sleep(100)
    const elapsed = Date.now() - start
    expect(elapsed).toBeGreaterThanOrEqual(95)
  })
})
