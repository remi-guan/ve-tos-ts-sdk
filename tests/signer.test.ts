import { describe, test, expect } from 'bun:test'
import { signTOSRequest } from '../src/signer'

describe('signTOSRequest', () => {
  const testOptions = {
    method: 'PUT',
    bucket: 'test-bucket',
    key: 'test-file.txt',
    region: 'cn-beijing',
    endpoint: 'tos-cn-beijing.volces.com',
    accessKeyId: 'test-access-key',
    accessKeySecret: 'test-secret-key',
    contentType: 'text/plain',
    contentSha256: 'test-sha256'
  }

  test('should generate headers', async () => {
    const headers = await signTOSRequest(testOptions)
    
    expect(headers).toBeInstanceOf(Headers)
    expect(headers.get('Host')).toBe('test-bucket.tos-cn-beijing.volces.com')
    expect(headers.get('X-Tos-Date')).toBeTruthy()
    expect(headers.get('X-Tos-Content-Sha256')).toBe('test-sha256')
    expect(headers.get('Authorization')).toContain('TOS4-HMAC-SHA256')
    expect(headers.get('Content-Type')).toBe('text/plain')
  })

  test('should use UNSIGNED-PAYLOAD when no contentSha256 provided', async () => {
    const options = { ...testOptions }
    delete options.contentSha256
    
    const headers = await signTOSRequest(options)
    expect(headers.get('X-Tos-Content-Sha256')).toBe('UNSIGNED-PAYLOAD')
  })

  test('should handle GET requests', async () => {
    const headers = await signTOSRequest({
      ...testOptions,
      method: 'GET',
      contentSha256: 'UNSIGNED-PAYLOAD'
    })
    
    expect(headers.get('Authorization')).toContain('TOS4-HMAC-SHA256')
  })

  test('should handle DELETE requests', async () => {
    const headers = await signTOSRequest({
      ...testOptions,
      method: 'DELETE',
      contentSha256: 'UNSIGNED-PAYLOAD'
    })
    
    expect(headers.get('Authorization')).toContain('TOS4-HMAC-SHA256')
  })

  test('should encode special characters in key', async () => {
    const headers = await signTOSRequest({
      ...testOptions,
      key: 'path/to/文件 (1).txt'
    })
    
    expect(headers.get('Authorization')).toContain('TOS4-HMAC-SHA256')
  })

  test('should use custom date', async () => {
    const customDate = new Date('2025-01-01T00:00:00Z')
    const headers = await signTOSRequest({
      ...testOptions,
      date: customDate
    })
    
    const dateHeader = headers.get('X-Tos-Date')
    expect(dateHeader).toContain('20250101T000000Z')
  })
})

