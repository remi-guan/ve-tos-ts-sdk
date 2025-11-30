# ve-tos-ts-sdk 使用示例

## 基本上传

```typescript
import { TOSClient } from 've-tos-ts-sdk'

const client = new TOSClient({
  region: 'cn-beijing',
  endpoint: 'tos-cn-beijing.volces.com',
  accessKeyId: 'your-access-key-id',
  accessKeySecret: 'your-access-key-secret'
})

// 简单上传
const file = new Blob(['Hello, TOS!'], { type: 'text/plain' })
await client.upload('my-bucket', 'hello.txt', file)
```

## 使用 Cache-Control 上传

```typescript
// 上传静态资源，设置长期缓存
const imageBlob = await fetch('logo.png').then(r => r.blob())
await client.upload('my-bucket', 'assets/logo.png', imageBlob, {
  contentType: 'image/png',
  cacheControl: 'max-age=31536000, public, immutable', // 缓存 1 年
  metadata: {
    uploadedBy: 'admin',
    version: '1.0'
  }
})

// 上传动态内容，设置短期缓存
const htmlBlob = new Blob(['<html>...</html>'], { type: 'text/html' })
await client.upload('my-bucket', 'index.html', htmlBlob, {
  contentType: 'text/html; charset=utf-8',
  cacheControl: 'max-age=300, must-revalidate' // 缓存 5 分钟
})
```

## 使用自定义元数据上传

```typescript
// 上传文件并添加自定义元数据
const pdfBlob = await fetch('document.pdf').then(r => r.blob())
await client.upload('my-bucket', 'documents/report-2025.pdf', pdfBlob, {
  contentType: 'application/pdf',
  contentDisposition: 'attachment; filename="2025年度报告.pdf"',
  cacheControl: 'private, max-age=3600',
  metadata: {
    author: '张三',
    department: '财务部',
    confidential: 'true',
    year: '2025'
  }
})
```

## 使用自定义 HTTP 头上传

```typescript
// 使用存储类型和加密
await client.upload('my-bucket', 'sensitive-data.json', jsonBlob, {
  contentType: 'application/json',
  headers: {
    'x-tos-storage-class': 'STANDARD_IA', // 低频访问存储
    'x-tos-server-side-encryption': 'AES256', // 服务端加密
    'x-tos-acl': 'private' // 私有访问控制
  }
})
```

## 更新对象元数据

```typescript
// 更新已存在对象的缓存策略和元数据
await client.updateMetadata('my-bucket', 'assets/logo.png', {
  cacheControl: 'max-age=86400, public', // 更新为 1 天缓存
  metadata: {
    version: '2.0',
    lastModifiedBy: '李四'
  }
})
```

## 复制对象

```typescript
// 简单复制
await client.copy(
  'source-bucket', 'old-file.txt',
  'dest-bucket', 'new-file.txt'
)

// 复制并修改元数据
await client.copy(
  'my-bucket', 'draft.doc',
  'my-bucket', 'final.doc',
  {
    metadataDirective: 'REPLACE',
    cacheControl: 'max-age=7200',
    contentDisposition: 'attachment; filename="final-document.doc"',
    metadata: {
      status: 'final',
      approvedBy: '王五'
    }
  }
)
```

## 设置文件下载名称

```typescript
// 上传文件时设置下载名称
await client.upload('my-bucket', 'reports/Q4.xlsx', excelBlob, {
  contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  contentDisposition: 'attachment; filename="2025Q4财务报表.xlsx"'
})
```

## 上传压缩文件

```typescript
// 上传 gzip 压缩的内容
const gzippedData = await compressData(originalData)
await client.upload('my-bucket', 'data.json.gz', gzippedData, {
  contentType: 'application/json',
  contentEncoding: 'gzip',
  cacheControl: 'max-age=3600'
})
```

## 设置过期时间

```typescript
// 上传临时文件，设置过期时间
const tempBlob = new Blob(['temporary data'])
await client.upload('my-bucket', 'temp/session-123.json', tempBlob, {
  contentType: 'application/json',
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 小时后过期
  cacheControl: 'no-cache'
})
```

## 组合使用多个选项

```typescript
// 完整示例：上传带有完整配置的文件
const videoBlob = await fetch('video.mp4').then(r => r.blob())
await client.upload('my-bucket', 'videos/tutorial-2025.mp4', videoBlob, {
  contentType: 'video/mp4',
  contentDisposition: 'inline; filename="教程视频.mp4"',
  cacheControl: 'max-age=604800, public', // 缓存 7 天
  metadata: {
    title: 'TypeScript 教程',
    duration: '1200',
    resolution: '1080p',
    uploadDate: new Date().toISOString()
  },
  headers: {
    'x-tos-storage-class': 'STANDARD',
    'x-tos-acl': 'public-read'
  }
})
```

## 检查文件是否存在

```typescript
const exists = await client.exists('my-bucket', 'path/to/file.txt')
if (!exists) {
  console.log('文件不存在')
}
```

## 下载文件

```typescript
// 下载文件
const blob = await client.download('my-bucket', 'path/to/file.txt')
const text = await blob.text()
console.log(text)

// 下载并保存为文件（在浏览器中）
const blob = await client.download('my-bucket', 'document.pdf')
const url = URL.createObjectURL(blob)
const a = document.createElement('a')
a.href = url
a.download = 'document.pdf'
a.click()
URL.revokeObjectURL(url)
```

## 删除文件

```typescript
await client.delete('my-bucket', 'path/to/file.txt')
```

