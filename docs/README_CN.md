# 🚀 火山引擎 TOS TypeScript SDK

一个现代化、轻量级的火山引擎 TOS（对象存储）TypeScript SDK，可在**任何 JavaScript 运行时**中使用。

[![npm 版本](https://img.shields.io/npm/v/ve-tos-ts-sdk.svg)](https://www.npmjs.com/package/ve-tos-ts-sdk)
[![许可证: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

[English Documentation](../README.md)

## ✨ 为什么选择这个 SDK？

与官方的火山引擎 TOS SDK 只能在 Node.js 中运行不同，这个 SDK 被设计为可以在任何地方运行：

- ✅ **Cloudflare Workers** - 完美适配边缘计算
- ✅ **Bun** - 快速的一体化 JavaScript 运行时
- ✅ **Deno** - 现代 JavaScript 运行时
- ✅ **Node.js** (v18+) - 传统后端
- ⚠️ **浏览器** - 技术上支持但**不推荐**（见下方安全说明）

### 核心优势

🎯 **零依赖** - 使用原生 Web Crypto API  
📦 **极小体积** - 压缩后 < 10KB  
🔒 **类型安全** - 完整的 TypeScript 支持  
⚡ **快速** - 针对现代运行时优化  
🌐 **通用** - 可在任何 JavaScript 环境中运行  

## 📦 安装

```bash
# 使用 bun（推荐）
bun add ve-tos-ts-sdk

# 使用 npm
npm install ve-tos-ts-sdk

# 使用 pnpm
pnpm add ve-tos-ts-sdk

# 使用 yarn
yarn add ve-tos-ts-sdk
```

## 🚀 快速开始

```typescript
import { TOSClient } from 've-tos-ts-sdk'

// 初始化客户端
const client = new TOSClient({
  region: 'cn-beijing',
  endpoint: 'tos-cn-beijing.volces.com',
  accessKeyId: '你的访问密钥ID',
  accessKeySecret: '你的访问密钥'
})

// 上传文件
const file = new Blob(['你好，TOS！'], { type: 'text/plain' })
await client.upload('my-bucket', 'hello.txt', file)

// 使用自定义头部上传（Cache-Control、元数据等）
await client.upload('my-bucket', 'document.pdf', pdfBlob, {
  contentType: 'application/pdf',
  cacheControl: 'max-age=3600, public',
  contentDisposition: 'attachment; filename="document.pdf"',
  metadata: {
    author: '张三',
    version: '1.0'
  }
})

// 下载文件
const blob = await client.download('my-bucket', 'hello.txt')
const text = await blob.text()
console.log(text) // "你好，TOS！"

// 更新对象元数据
await client.updateMetadata('my-bucket', 'document.pdf', {
  cacheControl: 'max-age=7200, public',
  metadata: {
    author: '李四',
    version: '2.0'
  }
})

// 复制对象
await client.copy(
  'source-bucket', 'source.txt',
  'dest-bucket', 'dest.txt'
)

// 列举对象
const result = await client.list('my-bucket', {
  prefix: 'documents/',
  maxKeys: 100
})
console.log(`找到 ${result.keyCount} 个对象`)
result.objects.forEach(obj => {
  console.log(`- ${obj.key} (${obj.size} 字节)`)
})

// 删除文件
await client.delete('my-bucket', 'hello.txt')

// 检查文件是否存在
const exists = await client.exists('my-bucket', 'hello.txt')
console.log(exists) // false
```

## 📖 API 文档

### TOSClient

#### 构造函数

```typescript
new TOSClient(options: TOSClientOptions)
```

**选项：**
- `region` (string): TOS 区域（例如：'cn-beijing', 'cn-shanghai'）
- `endpoint` (string): TOS 端点（例如：'tos-cn-beijing.volces.com'）
- `accessKeyId` (string): 你的 TOS 访问密钥 ID
- `accessKeySecret` (string): 你的 TOS 访问密钥
- `debug?` (boolean): 启用调试日志（默认：false）

#### 方法

##### `upload(bucket, key, data, options?)`

上传数据到 TOS。

**参数：**
- `bucket` (string): 存储桶名称
- `key` (string): 对象键（文件路径）
- `data` (Blob | ArrayBuffer | Uint8Array): 要上传的数据
- `options?` (UploadOptions): 可选的上传选项
  - `contentType?` (string): Content-Type 头
  - `cacheControl?` (string): Cache-Control 头（例如：'max-age=3600, public'）
  - `contentDisposition?` (string): Content-Disposition 头（例如：'attachment; filename="file.pdf"'）
  - `contentEncoding?` (string): Content-Encoding 头（例如：'gzip'）
  - `contentLanguage?` (string): Content-Language 头（例如：'zh-CN'）
  - `expires?` (Date | string): Expires 头
  - `metadata?` (Record<string, string>): 自定义元数据（会自动添加 x-tos-meta- 前缀）
  - `headers?` (Record<string, string>): 任意额外的自定义 HTTP 头

**返回：** `Promise<void>`

```typescript
// 基础上传
await client.upload('my-bucket', 'path/to/file.txt', blob, {
  contentType: 'text/plain'
})

// 使用缓存和元数据上传
await client.upload('my-bucket', 'assets/logo.png', imageBlob, {
  contentType: 'image/png',
  cacheControl: 'max-age=31536000, public',
  metadata: {
    uploadedBy: 'user123',
    version: '1.0'
  }
})

// 使用自定义头上传
await client.upload('my-bucket', 'file.txt', blob, {
  headers: {
    'x-tos-storage-class': 'STANDARD_IA',
    'x-tos-server-side-encryption': 'AES256'
  }
})
```

##### `download(bucket, key, options?)`

从 TOS 下载数据。

**参数：**
- `bucket` (string): 存储桶名称
- `key` (string): 对象键（文件路径）
- `options?` (DownloadOptions): 可选的下载选项
  - `headers?` (Record<string, string>): 自定义 HTTP 头

**返回：** `Promise<Blob>`

```typescript
const blob = await client.download('my-bucket', 'path/to/file.txt')
```

##### `copy(sourceBucket, sourceKey, destinationBucket, destinationKey, options?)`

从一个位置复制对象到另一个位置。

**参数：**
- `sourceBucket` (string): 源存储桶名称
- `sourceKey` (string): 源对象键
- `destinationBucket` (string): 目标存储桶名称
- `destinationKey` (string): 目标对象键
- `options?` (CopyOptions): 可选的复制选项
  - `contentType?` (string): Content-Type 头
  - `cacheControl?` (string): Cache-Control 头
  - `contentDisposition?` (string): Content-Disposition 头
  - `metadata?` (Record<string, string>): 自定义元数据
  - `metadataDirective?` ('COPY' | 'REPLACE'): 元数据指令（默认：'COPY'）
  - `headers?` (Record<string, string>): 自定义 HTTP 头

**返回：** `Promise<void>`

```typescript
// 简单复制
await client.copy('source-bucket', 'file.txt', 'dest-bucket', 'copy.txt')

// 复制并替换元数据
await client.copy('bucket', 'old.txt', 'bucket', 'new.txt', {
  metadataDirective: 'REPLACE',
  cacheControl: 'max-age=3600',
  metadata: { version: '2.0' }
})
```

##### `updateMetadata(bucket, key, options)`

更新对象元数据（通过就地复制实现）。

**参数：**
- `bucket` (string): 存储桶名称
- `key` (string): 对象键
- `options` (CopyOptions): 元数据更新选项
  - `cacheControl?` (string): Cache-Control 头
  - `contentDisposition?` (string): Content-Disposition 头
  - `contentType?` (string): Content-Type 头
  - `metadata?` (Record<string, string>): 自定义元数据
  - `headers?` (Record<string, string>): 自定义 HTTP 头

**返回：** `Promise<void>`

```typescript
// 更新元数据
await client.updateMetadata('my-bucket', 'file.txt', {
  cacheControl: 'max-age=7200, public',
  metadata: {
    lastModifiedBy: 'user456',
    version: '2.0'
  }
})
```

##### `delete(bucket, key)`

从 TOS 删除对象。

**参数：**
- `bucket` (string): 存储桶名称
- `key` (string): 对象键（文件路径）

**返回：** `Promise<void>`

```typescript
await client.delete('my-bucket', 'path/to/file.txt')
```

##### `exists(bucket, key)`

检查 TOS 中是否存在对象。

**参数：**
- `bucket` (string): 存储桶名称
- `key` (string): 对象键（文件路径）

**返回：** `Promise<boolean>`

```typescript
const exists = await client.exists('my-bucket', 'path/to/file.txt')
```

##### `list(bucket, options?)`

列举存储桶中的对象。

**参数：**
- `bucket` (string): 存储桶名称
- `options?` (ListObjectsOptions): 可选的列举选项
  - `prefix?` (string): 用于过滤对象的前缀
  - `delimiter?` (string): 用于分组的分隔符（例如：'/' 实现类似目录的结构）
  - `maxKeys?` (number): 返回的最大对象数（默认：1000，最大：1000）
  - `continuationToken?` (string): 用于分页的延续令牌
  - `startAfter?` (string): 从此键之后开始列举
  - `headers?` (Record<string, string>): 自定义 HTTP 头

**返回：** `Promise<ListObjectsResult>`

```typescript
// 列举所有对象
const result = await client.list('my-bucket')
console.log(`找到 ${result.keyCount} 个对象`)
result.objects.forEach(obj => {
  console.log(`${obj.key} - ${obj.size} 字节 - ${obj.lastModified}`)
})

// 使用前缀列举（类似文件夹）
const docs = await client.list('my-bucket', {
  prefix: 'documents/',
  maxKeys: 100
})

// 使用分隔符列举（类似目录结构）
const folders = await client.list('my-bucket', {
  prefix: 'uploads/',
  delimiter: '/'
})
console.log('文件夹:', folders.commonPrefixes)
console.log('文件:', folders.objects.map(o => o.key))

// 分页
let continuationToken: string | undefined
do {
  const result = await client.list('my-bucket', {
    maxKeys: 1000,
    continuationToken
  })
  
  // 处理 result.objects
  console.log(`处理 ${result.objects.length} 个对象`)
  
  continuationToken = result.nextContinuationToken
} while (continuationToken)
```

## 🌍 平台特定示例

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
    
    // 从请求中上传文件
    const formData = await request.formData()
    const file = formData.get('file') as File
    await client.upload('my-bucket', file.name, file)
    
    return new Response('文件上传成功！')
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

await client.upload('my-bucket', 'hello.txt', new TextEncoder().encode('你好！'))
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

## 🔐 安全最佳实践

⚠️ **永远不要**在代码中硬编码你的凭证！

### 推荐：使用环境变量

```typescript
const client = new TOSClient({
  region: process.env.TOS_REGION!,
  endpoint: process.env.TOS_ENDPOINT!,
  accessKeyId: process.env.TOS_ACCESS_KEY_ID!,
  accessKeySecret: process.env.TOS_ACCESS_KEY_SECRET!
})
```

### Cloudflare Workers

使用 Wrangler secrets：

```bash
wrangler secret put TOS_ACCESS_KEY_ID
wrangler secret put TOS_ACCESS_KEY_SECRET
```

### ⚠️ 重要：浏览器安全警告

**不要在浏览器中直接使用你的 TOS 凭证！**

虽然这个 SDK 在技术上兼容浏览器（使用 Web APIs），但**在浏览器代码中暴露你的 `accessKeyId` 和 `accessKeySecret` 是极其危险的**：

- ❌ 你的凭证会在浏览器的 DevTools 中可见
- ❌ 任何人都可以窃取和滥用你的凭证
- ❌ 这违反了安全最佳实践

**浏览器上传的推荐方式：**

**使用后端代理**：
```typescript
// 后端：安全地处理上传
app.post('/api/upload', async (req, res) => {
  const client = new TOSClient({
    region: process.env.TOS_REGION!,
    endpoint: process.env.TOS_ENDPOINT!,
    accessKeyId: process.env.TOS_ACCESS_KEY_ID!,
    accessKeySecret: process.env.TOS_ACCESS_KEY_SECRET!
  })
  
  const file = req.file // 来自 multer 或类似中间件
  await client.upload('my-bucket', `uploads/${file.name}`, file.buffer)
  res.json({ success: true, url: `https://my-bucket.tos-cn-beijing.volces.com/uploads/${file.name}` })
})

// 前端：将文件发送到后端
const formData = new FormData()
formData.append('file', fileInput.files[0])

const response = await fetch('/api/upload', {
  method: 'POST',
  body: formData
})
const result = await response.json()
console.log('已上传:', result.url)
```

## 🌐 可用区域

| 区域 | 端点 |
|------|------|
| 华北（北京） | `tos-cn-beijing.volces.com` |
| 华东（上海） | `tos-cn-shanghai.volces.com` |
| 华南（广州） | `tos-cn-guangzhou.volces.com` |

更多区域请查看[火山引擎 TOS 文档](https://www.volcengine.com/docs/6349/107356)。

## 🆚 与官方 SDK 对比

| 特性 | ve-tos-ts-sdk | 官方 SDK |
|------|---------------|----------|
| Cloudflare Workers | ✅ | ❌ |
| Deno | ✅ | ❌ |
| Bun | ✅ | ⚠️ 部分支持 |
| 浏览器 | ✅ | ❌ |
| Node.js | ✅ | ✅ |
| 包大小 | < 10KB | > 1MB |
| 依赖数量 | 0 | 20+ |
| TypeScript | ✅ 原生支持 | ⚠️ 类型定义 |

## 🤝 贡献

欢迎贡献！请随时提交 Pull Request。

## 📄 许可证

MIT 许可证 - 详见 [LICENSE](../LICENSE) 文件。

## 🔗 相关链接

- [火山引擎 TOS 官方文档](https://www.volcengine.com/docs/6349/74819)
- [NPM 包](https://www.npmjs.com/package/ve-tos-ts-sdk)
- [GitHub 仓库](https://github.com/remi-guan/ve-tos-ts-sdk)

## ⭐ 支持

如果这个项目对你有帮助，请给它一个 ⭐️！
