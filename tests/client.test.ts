import { describe, test, expect, beforeAll } from 'bun:test'
import { TOSClient } from '../src/client'

// 从环境变量加载配置
const config = {
  region: process.env.TOS_REGION || 'cn-shanghai',
  endpoint: process.env.TOS_ENDPOINT || 'tos-cn-shanghai.volces.com',
  accessKeyId: process.env.TOS_ACCESS_KEY_ID || '',
  secretAccessKey: process.env.TOS_SECRET_ACCESS_KEY || '',
  bucket: process.env.TOS_BUCKET || 'test-bucket'
}

// 如果没有配置环境变量，跳过测试
const shouldSkip = !config.accessKeyId || !config.secretAccessKey

describe('TOSClient', () => {
  let client: TOSClient
  const testKey = `test-${Date.now()}.txt`
  const testContent = 'Hello, TOS SDK!'

  beforeAll(() => {
    if (shouldSkip) {
      console.warn('⚠️  Skipping tests: TOS credentials not provided')
      console.warn('   Set environment variables: TOS_REGION, TOS_ENDPOINT, TOS_ACCESS_KEY_ID, TOS_SECRET_ACCESS_KEY, TOS_BUCKET')
    } else {
      client = new TOSClient({
        region: config.region,
        endpoint: config.endpoint,
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
        debug: true
      })
    }
  })

  test('should create client instance', () => {
    if (shouldSkip) return
    expect(client).toBeDefined()
  })

  test('should upload a file', async () => {
    if (shouldSkip) return
    
    const blob = new Blob([testContent], { type: 'text/plain' })
    await expect(
      client.upload(config.bucket, testKey, blob)
    ).resolves.toBeUndefined()
  })

  test('should check if file exists', async () => {
    if (shouldSkip) return
    
    const exists = await client.exists(config.bucket, testKey)
    expect(exists).toBe(true)
  })

  test('should download a file', async () => {
    if (shouldSkip) return
    
    const blob = await client.download(config.bucket, testKey)
    const text = await blob.text()
    expect(text).toBe(testContent)
  })

  test('should delete a file', async () => {
    if (shouldSkip) return
    
    await expect(
      client.delete(config.bucket, testKey)
    ).resolves.toBeUndefined()
  })

  test('should return false for non-existent file', async () => {
    if (shouldSkip) return
    
    const exists = await client.exists(config.bucket, testKey)
    expect(exists).toBe(false)
  })

  test('should throw error when uploading invalid data', async () => {
    if (shouldSkip) return
    
    await expect(
      // @ts-expect-error - testing invalid input
      client.upload(config.bucket, 'test.txt', 'invalid')
    ).rejects.toThrow('Unsupported data type')
  })
})

describe('TOSClient - Different data types', () => {
  let client: TOSClient
  const testKey = `test-types-${Date.now()}.bin`

  beforeAll(() => {
    if (!shouldSkip) {
      client = new TOSClient({
        region: config.region,
        endpoint: config.endpoint,
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey
      })
    }
  })

  test('should upload ArrayBuffer', async () => {
    if (shouldSkip) return
    
    const encoder = new TextEncoder()
    const arrayBuffer = encoder.encode('Hello from ArrayBuffer').buffer
    
    await expect(
      client.upload(config.bucket, testKey, arrayBuffer)
    ).resolves.toBeUndefined()
    
    // Clean up
    await client.delete(config.bucket, testKey)
  })

  test('should upload Uint8Array', async () => {
    if (shouldSkip) return
    
    const encoder = new TextEncoder()
    const uint8Array = encoder.encode('Hello from Uint8Array')
    
    await expect(
      client.upload(config.bucket, testKey, uint8Array)
    ).resolves.toBeUndefined()
    
    // Clean up
    await client.delete(config.bucket, testKey)
  })
})

