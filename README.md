# 🚀 Volcengine TOS TypeScript SDK

A modern, lightweight TypeScript SDK for Volcengine TOS (Tinder Object Storage) that works in **any JavaScript runtime**.

[![npm version](https://img.shields.io/npm/v/ve-tos-ts-sdk.svg)](https://www.npmjs.com/package/ve-tos-ts-sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

[中文文档](./docs/README_CN.md)

## ✨ Why This SDK?

Unlike the official Volcengine TOS SDK which only works in Node.js, this SDK is designed to work everywhere:

- ✅ **Cloudflare Workers** - Perfect for edge computing
- ✅ **Bun** - Fast all-in-one JavaScript runtime
- ✅ **Deno** - Modern JavaScript runtime
- ✅ **Node.js** (v18+) - Traditional backend
- ⚠️ **Browsers** - Technically supported but **NOT RECOMMENDED** (see security notes below)

### Key Advantages

🎯 **Zero Dependencies** - Uses native Web Crypto API  
📦 **Tiny Bundle Size** - < 10KB minified  
🔒 **Type-Safe** - Full TypeScript support  
⚡ **Fast** - Optimized for modern runtimes  
🌐 **Universal** - Works in any JavaScript environment  

## 📦 Installation

```bash
# Using bun (recommended)
bun add ve-tos-ts-sdk

# Using npm
npm install ve-tos-ts-sdk

# Using pnpm
pnpm add ve-tos-ts-sdk

# Using yarn
yarn add ve-tos-ts-sdk
```

## 🚀 Quick Start

```typescript
import { TOSClient } from 've-tos-ts-sdk'

// Initialize client
const client = new TOSClient({
  region: 'cn-beijing',
  endpoint: 'tos-cn-beijing.volces.com',
  accessKeyId: 'your-access-key-id',
  secretAccessKey: 'your-secret-access-key'
})

// Upload a file
const file = new Blob(['Hello, TOS!'], { type: 'text/plain' })
await client.upload('my-bucket', 'hello.txt', file)

// Download a file
const blob = await client.download('my-bucket', 'hello.txt')
const text = await blob.text()
console.log(text) // "Hello, TOS!"

// Delete a file
await client.delete('my-bucket', 'hello.txt')

// Check if file exists
const exists = await client.exists('my-bucket', 'hello.txt')
console.log(exists) // false
```

## 📖 API Documentation

### TOSClient

#### Constructor

```typescript
new TOSClient(options: TOSClientOptions)
```

**Options:**
- `region` (string): TOS region (e.g., 'cn-beijing', 'cn-shanghai')
- `endpoint` (string): TOS endpoint (e.g., 'tos-cn-beijing.volces.com')
- `accessKeyId` (string): Your TOS access key ID
- `secretAccessKey` (string): Your TOS secret access key
- `debug?` (boolean): Enable debug logging (default: false)

#### Methods

##### `upload(bucket, key, data, options?)`

Upload data to TOS.

**Parameters:**
- `bucket` (string): Bucket name
- `key` (string): Object key (file path)
- `data` (Blob | ArrayBuffer | Uint8Array): Data to upload
- `options?` (UploadOptions): Optional upload options
  - `contentType?` (string): Content-Type header

**Returns:** `Promise<void>`

```typescript
await client.upload('my-bucket', 'path/to/file.txt', blob, {
  contentType: 'text/plain'
})
```

##### `download(bucket, key, options?)`

Download data from TOS.

**Parameters:**
- `bucket` (string): Bucket name
- `key` (string): Object key (file path)
- `options?` (DownloadOptions): Optional download options

**Returns:** `Promise<Blob>`

```typescript
const blob = await client.download('my-bucket', 'path/to/file.txt')
```

##### `delete(bucket, key)`

Delete an object from TOS.

**Parameters:**
- `bucket` (string): Bucket name
- `key` (string): Object key (file path)

**Returns:** `Promise<void>`

```typescript
await client.delete('my-bucket', 'path/to/file.txt')
```

##### `exists(bucket, key)`

Check if an object exists in TOS.

**Parameters:**
- `bucket` (string): Bucket name
- `key` (string): Object key (file path)

**Returns:** `Promise<boolean>`

```typescript
const exists = await client.exists('my-bucket', 'path/to/file.txt')
```

## 🌍 Platform-Specific Examples

### Cloudflare Workers

```typescript
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const client = new TOSClient({
      region: env.TOS_REGION,
      endpoint: env.TOS_ENDPOINT,
      accessKeyId: env.TOS_ACCESS_KEY_ID,
      secretAccessKey: env.TOS_SECRET_ACCESS_KEY
    })
    
    // Upload file from request
    const formData = await request.formData()
    const file = formData.get('file') as File
    await client.upload('my-bucket', file.name, file)
    
    return new Response('File uploaded successfully!')
  }
}
```

### Deno

```typescript
import { TOSClient } from 'npm:ve-tos-ts-sdk'

const client = new TOSClient({
  region: Deno.env.get('TOS_REGION')!,
  endpoint: Deno.env.get('TOS_ENDPOINT')!,
  accessKeyId: Deno.env.get('TOS_ACCESS_KEY_ID')!,
  secretAccessKey: Deno.env.get('TOS_SECRET_ACCESS_KEY')!
})

await client.upload('my-bucket', 'hello.txt', new TextEncoder().encode('Hello!'))
```

### Node.js (v18+)

```typescript
import { TOSClient } from 've-tos-ts-sdk'
import { readFile } from 'fs/promises'

const client = new TOSClient({
  region: process.env.TOS_REGION!,
  endpoint: process.env.TOS_ENDPOINT!,
  accessKeyId: process.env.TOS_ACCESS_KEY_ID!,
  secretAccessKey: process.env.TOS_SECRET_ACCESS_KEY!
})

const buffer = await readFile('./file.txt')
await client.upload('my-bucket', 'file.txt', buffer)
```

### Bun

```typescript
import { TOSClient } from 've-tos-ts-sdk'

const client = new TOSClient({
  region: Bun.env.TOS_REGION!,
  endpoint: Bun.env.TOS_ENDPOINT!,
  accessKeyId: Bun.env.TOS_ACCESS_KEY_ID!,
  secretAccessKey: Bun.env.TOS_SECRET_ACCESS_KEY!
})

const file = Bun.file('./file.txt')
await client.upload('my-bucket', 'file.txt', await file.arrayBuffer())
```

## 🔐 Security Best Practices

⚠️ **Never** hardcode your credentials in your code!

### Recommended: Use Environment Variables

```typescript
const client = new TOSClient({
  region: process.env.TOS_REGION!,
  endpoint: process.env.TOS_ENDPOINT!,
  accessKeyId: process.env.TOS_ACCESS_KEY_ID!,
  secretAccessKey: process.env.TOS_SECRET_ACCESS_KEY!
})
```

### For Cloudflare Workers

Use Wrangler secrets:

```bash
wrangler secret put TOS_ACCESS_KEY_ID
wrangler secret put TOS_SECRET_ACCESS_KEY
```

### ⚠️ CRITICAL: Browser Security Warning

**DO NOT use this SDK directly in the browser with your TOS credentials!**

While this SDK is technically compatible with browsers (uses Web APIs), **exposing your `accessKeyId` and `secretAccessKey` in browser code is extremely dangerous**:

- ❌ Your credentials will be visible in the browser's DevTools
- ❌ Anyone can steal and abuse your credentials
- ❌ This violates security best practices

**Recommended approach for browser uploads:**

**Use a Backend Proxy**:
```typescript
// Backend: Handle uploads securely
app.post('/api/upload', async (req, res) => {
  const client = new TOSClient({
    region: process.env.TOS_REGION!,
    endpoint: process.env.TOS_ENDPOINT!,
    accessKeyId: process.env.TOS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.TOS_SECRET_ACCESS_KEY!
  })
  
  const file = req.file // from multer or similar
  await client.upload('my-bucket', `uploads/${file.name}`, file.buffer)
  res.json({ success: true, url: `https://my-bucket.tos-cn-beijing.volces.com/uploads/${file.name}` })
})

// Frontend: Send file to backend
const formData = new FormData()
formData.append('file', fileInput.files[0])

const response = await fetch('/api/upload', {
  method: 'POST',
  body: formData
})
const result = await response.json()
console.log('Uploaded:', result.url)
```

**Browser compatibility test**: See `browser-test.html` to verify that all required Web APIs are available in your browser.

## 🌐 Available Regions

| Region | Endpoint |
|--------|----------|
| North China (Beijing) | `tos-cn-beijing.volces.com` |
| East China (Shanghai) | `tos-cn-shanghai.volces.com` |
| South China (Guangzhou) | `tos-cn-guangzhou.volces.com` |

See [Volcengine TOS Documentation](https://www.volcengine.com/docs/6349/107356) for more regions.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- [Volcengine TOS Official Documentation](https://www.volcengine.com/docs/6349/74819)
- [NPM Package](https://www.npmjs.com/package/ve-tos-ts-sdk)
- [GitHub Repository](https://github.com/remi-guan/ve-tos-ts-sdk)

## ⭐ Support

If this project helps you, please give it a ⭐️!
