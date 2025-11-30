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
  accessKeySecret: 'your-secret-access-key'
})

// Upload a file
const file = new Blob(['Hello, TOS!'], { type: 'text/plain' })
await client.upload('my-bucket', 'hello.txt', file)

// Upload with custom headers (Cache-Control, metadata, etc.)
await client.upload('my-bucket', 'document.pdf', pdfBlob, {
  contentType: 'application/pdf',
  cacheControl: 'max-age=3600, public',
  contentDisposition: 'attachment; filename="document.pdf"',
  metadata: {
    author: 'John Doe',
    version: '1.0'
  }
})

// Download a file
const blob = await client.download('my-bucket', 'hello.txt')
const text = await blob.text()
console.log(text) // "Hello, TOS!"

// Update object metadata
await client.updateMetadata('my-bucket', 'document.pdf', {
  cacheControl: 'max-age=7200, public',
  metadata: {
    author: 'Jane Doe',
    version: '2.0'
  }
})

// Copy object
await client.copy(
  'source-bucket', 'source.txt',
  'dest-bucket', 'dest.txt'
)

// List objects
const result = await client.list('my-bucket', {
  prefix: 'documents/',
  maxKeys: 100
})
console.log(`Found ${result.keyCount} objects`)
result.objects.forEach(obj => {
  console.log(`- ${obj.key} (${obj.size} bytes)`)
})

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
- `accessKeySecret` (string): Your TOS secret access key
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
  - `cacheControl?` (string): Cache-Control header (e.g., 'max-age=3600, public')
  - `contentDisposition?` (string): Content-Disposition header (e.g., 'attachment; filename="file.pdf"')
  - `contentEncoding?` (string): Content-Encoding header (e.g., 'gzip')
  - `contentLanguage?` (string): Content-Language header (e.g., 'en-US')
  - `expires?` (Date | string): Expires header
  - `metadata?` (Record<string, string>): Custom metadata (will be prefixed with x-tos-meta-)
  - `headers?` (Record<string, string>): Any additional custom HTTP headers

**Returns:** `Promise<void>`

```typescript
// Basic upload
await client.upload('my-bucket', 'path/to/file.txt', blob, {
  contentType: 'text/plain'
})

// Upload with caching and metadata
await client.upload('my-bucket', 'assets/logo.png', imageBlob, {
  contentType: 'image/png',
  cacheControl: 'max-age=31536000, public',
  metadata: {
    uploadedBy: 'user123',
    version: '1.0'
  }
})

// Upload with custom headers
await client.upload('my-bucket', 'file.txt', blob, {
  headers: {
    'x-tos-storage-class': 'STANDARD_IA',
    'x-tos-server-side-encryption': 'AES256'
  }
})
```

##### `download(bucket, key, options?)`

Download data from TOS.

**Parameters:**
- `bucket` (string): Bucket name
- `key` (string): Object key (file path)
- `options?` (DownloadOptions): Optional download options
  - `headers?` (Record<string, string>): Custom HTTP headers

**Returns:** `Promise<Blob>`

```typescript
const blob = await client.download('my-bucket', 'path/to/file.txt')
```

##### `copy(sourceBucket, sourceKey, destinationBucket, destinationKey, options?)`

Copy an object from one location to another.

**Parameters:**
- `sourceBucket` (string): Source bucket name
- `sourceKey` (string): Source object key
- `destinationBucket` (string): Destination bucket name
- `destinationKey` (string): Destination object key
- `options?` (CopyOptions): Optional copy options
  - `contentType?` (string): Content-Type header
  - `cacheControl?` (string): Cache-Control header
  - `contentDisposition?` (string): Content-Disposition header
  - `metadata?` (Record<string, string>): Custom metadata
  - `metadataDirective?` ('COPY' | 'REPLACE'): Metadata directive (default: 'COPY')
  - `headers?` (Record<string, string>): Custom HTTP headers

**Returns:** `Promise<void>`

```typescript
// Simple copy
await client.copy('source-bucket', 'file.txt', 'dest-bucket', 'copy.txt')

// Copy with new metadata
await client.copy('bucket', 'old.txt', 'bucket', 'new.txt', {
  metadataDirective: 'REPLACE',
  cacheControl: 'max-age=3600',
  metadata: { version: '2.0' }
})
```

##### `updateMetadata(bucket, key, options)`

Update object metadata (implemented via in-place copy).

**Parameters:**
- `bucket` (string): Bucket name
- `key` (string): Object key
- `options` (CopyOptions): Metadata update options
  - `cacheControl?` (string): Cache-Control header
  - `contentDisposition?` (string): Content-Disposition header
  - `contentType?` (string): Content-Type header
  - `metadata?` (Record<string, string>): Custom metadata
  - `headers?` (Record<string, string>): Custom HTTP headers

**Returns:** `Promise<void>`

```typescript
// Update metadata
await client.updateMetadata('my-bucket', 'file.txt', {
  cacheControl: 'max-age=7200, public',
  metadata: {
    lastModifiedBy: 'user456',
    version: '2.0'
  }
})
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

##### `list(bucket, options?)`

List objects in a bucket.

**Parameters:**
- `bucket` (string): Bucket name
- `options?` (ListObjectsOptions): Optional list options
  - `prefix?` (string): Prefix to filter objects
  - `delimiter?` (string): Delimiter for grouping (e.g., '/' for directory-like structure)
  - `maxKeys?` (number): Maximum number of objects to return (default: 1000, max: 1000)
  - `continuationToken?` (string): Continuation token for pagination
  - `startAfter?` (string): Start listing after this key
  - `headers?` (Record<string, string>): Custom HTTP headers

**Returns:** `Promise<ListObjectsResult>`

```typescript
// List all objects
const result = await client.list('my-bucket')
console.log(`Found ${result.keyCount} objects`)
result.objects.forEach(obj => {
  console.log(`${obj.key} - ${obj.size} bytes - ${obj.lastModified}`)
})

// List with prefix (like a folder)
const docs = await client.list('my-bucket', {
  prefix: 'documents/',
  maxKeys: 100
})

// List with delimiter (directory-like structure)
const folders = await client.list('my-bucket', {
  prefix: 'uploads/',
  delimiter: '/'
})
console.log('Folders:', folders.commonPrefixes)
console.log('Files:', folders.objects.map(o => o.key))

// Pagination
let continuationToken: string | undefined
do {
  const result = await client.list('my-bucket', {
    maxKeys: 1000,
    continuationToken
  })
  
  // Process result.objects
  console.log(`Processing ${result.objects.length} objects`)
  
  continuationToken = result.nextContinuationToken
} while (continuationToken)
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
      accessKeySecret: env.TOS_ACCESS_KEY_SECRET
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
  accessKeySecret: Deno.env.get('TOS_ACCESS_KEY_SECRET')!
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
  accessKeySecret: process.env.TOS_ACCESS_KEY_SECRET!
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
  accessKeySecret: Bun.env.TOS_ACCESS_KEY_SECRET!
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
  accessKeySecret: process.env.TOS_ACCESS_KEY_SECRET!
})
```

### For Cloudflare Workers

Use Wrangler secrets:

```bash
wrangler secret put TOS_ACCESS_KEY_ID
wrangler secret put TOS_ACCESS_KEY_SECRET
```

### ⚠️ CRITICAL: Browser Security Warning

**DO NOT use this SDK directly in the browser with your TOS credentials!**

While this SDK is technically compatible with browsers (uses Web APIs), **exposing your `accessKeyId` and `accessKeySecret` in browser code is extremely dangerous**:

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
    accessKeySecret: process.env.TOS_ACCESS_KEY_SECRET!
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
