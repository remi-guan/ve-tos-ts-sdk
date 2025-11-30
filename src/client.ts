import { signTOSRequest } from './signer'

export interface TOSClientOptions {
  region: string
  endpoint: string
  accessKeyId: string
  accessKeySecret: string
  debug?: boolean
}

export interface UploadOptions {
  contentType?: string
  /** Custom HTTP headers to include in the request */
  headers?: Record<string, string>
  /** Cache-Control header (e.g., 'max-age=3600, public') */
  cacheControl?: string
  /** Content-Disposition header (e.g., 'attachment; filename="example.pdf"') */
  contentDisposition?: string
  /** Content-Encoding header (e.g., 'gzip') */
  contentEncoding?: string
  /** Content-Language header (e.g., 'en-US') */
  contentLanguage?: string
  /** Expires header (e.g., new Date('2025-12-31')) */
  expires?: Date | string
  /** Custom metadata (will be prefixed with x-tos-meta-) */
  metadata?: Record<string, string>
}

export interface DownloadOptions {
  /** Custom HTTP headers to include in the request */
  headers?: Record<string, string>
  // 未来可以添加 range 等选项
}

export interface CopyOptions {
  /** Custom HTTP headers to include in the request */
  headers?: Record<string, string>
  /** Cache-Control header */
  cacheControl?: string
  /** Content-Disposition header */
  contentDisposition?: string
  /** Content-Type header */
  contentType?: string
  /** Custom metadata (will be prefixed with x-tos-meta-) */
  metadata?: Record<string, string>
  /** Metadata directive: COPY (default) or REPLACE */
  metadataDirective?: 'COPY' | 'REPLACE'
}

/**
 * 火山引擎 TOS 客户端
 * 
 * 支持在以下环境中运行：
 * - Cloudflare Workers
 * - Deno
 * - Bun
 * - Node.js (v18+)
 * - 浏览器
 * 
 * @example
 * ```typescript
 * const client = new TOSClient({
 *   region: 'cn-beijing',
 *   endpoint: 'tos-cn-beijing.volces.com',
 *   accessKeyId: 'your-access-key-id',
 *   accessKeySecret: 'your-secret-access-key'
 * })
 * 
 * // 上传文件
 * await client.upload('my-bucket', 'path/to/file.txt', blob)
 * 
 * // 下载文件
 * const blob = await client.download('my-bucket', 'path/to/file.txt')
 * 
 * // 删除文件
 * await client.delete('my-bucket', 'path/to/file.txt')
 * ```
 */
export class TOSClient {
  private readonly options: TOSClientOptions

  constructor(options: TOSClientOptions) {
    this.options = options
  }

  /**
   * 上传文件到 TOS
   * @param bucket 存储桶名称
   * @param key 对象键（文件路径）
   * @param data 文件数据（Blob、File、ArrayBuffer 或 Uint8Array）
   * @param options 上传选项
   */
  async upload(
    bucket: string,
    key: string,
    data: Blob | ArrayBuffer | Uint8Array,
    options: UploadOptions = {}
  ): Promise<void> {
    // 转换数据为 ArrayBuffer
    let arrayBuffer: ArrayBuffer
    let contentType: string
    
    if (data instanceof Blob) {
      arrayBuffer = await data.arrayBuffer()
      contentType = options.contentType || data.type || 'application/octet-stream'
    } else if (data instanceof ArrayBuffer) {
      arrayBuffer = data
      contentType = options.contentType || 'application/octet-stream'
    } else if (data instanceof Uint8Array) {
      // 确保返回 ArrayBuffer 而不是 SharedArrayBuffer
      const buffer = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength)
      arrayBuffer = buffer instanceof ArrayBuffer ? buffer : new ArrayBuffer(buffer.byteLength)
      contentType = options.contentType || 'application/octet-stream'
    } else {
      throw new Error('Unsupported data type. Must be Blob, ArrayBuffer, or Uint8Array')
    }
    
    // 计算 SHA256 hash
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const contentSha256 = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
    
    // 构建自定义头部
    const customHeaders: Record<string, string> = { ...options.headers }
    
    // 添加常用头部
    if (options.cacheControl) {
      customHeaders['Cache-Control'] = options.cacheControl
    }
    if (options.contentDisposition) {
      customHeaders['Content-Disposition'] = options.contentDisposition
    }
    if (options.contentEncoding) {
      customHeaders['Content-Encoding'] = options.contentEncoding
    }
    if (options.contentLanguage) {
      customHeaders['Content-Language'] = options.contentLanguage
    }
    if (options.expires) {
      const expiresValue = options.expires instanceof Date 
        ? options.expires.toUTCString() 
        : new Date(options.expires).toUTCString()
      customHeaders['Expires'] = expiresValue
    }
    
    // 添加自定义元数据
    if (options.metadata) {
      for (const [key, value] of Object.entries(options.metadata)) {
        customHeaders[`x-tos-meta-${key}`] = value
      }
    }
    
    // 生成签名
    const headers = await signTOSRequest({
      method: 'PUT',
      bucket,
      key,
      region: this.options.region,
      endpoint: this.options.endpoint,
      accessKeyId: this.options.accessKeyId,
      accessKeySecret: this.options.accessKeySecret,
      contentType,
      contentSha256,
      customHeaders,
      debug: this.options.debug
    })
    
    // 发送请求
    const url = `https://${bucket}.${this.options.endpoint}/${key}`
    const response = await fetch(url, {
      method: 'PUT',
      body: arrayBuffer,
      headers,
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to upload to TOS: ${response.status} ${errorText}`)
    }
  }

  /**
   * 从 TOS 下载文件
   * @param bucket 存储桶名称
   * @param key 对象键（文件路径）
   * @param options 下载选项
   * @returns 文件数据（Blob）
   */
  async download(
    bucket: string,
    key: string,
    options: DownloadOptions = {}
  ) {
    // 构建自定义头部
    const customHeaders: Record<string, string> = { ...options.headers }
    
    // 生成签名
    const headers = await signTOSRequest({
      method: 'GET',
      bucket,
      key,
      region: this.options.region,
      endpoint: this.options.endpoint,
      accessKeyId: this.options.accessKeyId,
      accessKeySecret: this.options.accessKeySecret,
      contentSha256: 'UNSIGNED-PAYLOAD',
      customHeaders,
      debug: this.options.debug
    })
    
    // 发送请求
    const url = `https://${bucket}.${this.options.endpoint}/${key}`
    const response = await fetch(url, {
      method: 'GET',
      headers,
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to download from TOS: ${response.status} ${errorText}`)
    }

    return await response.blob()
  }

  /**
   * 从 TOS 删除文件
   * @param bucket 存储桶名称
   * @param key 对象键（文件路径）
   */
  async delete(bucket: string, key: string): Promise<void> {
    // 生成签名
    const headers = await signTOSRequest({
      method: 'DELETE',
      bucket,
      key,
      region: this.options.region,
      endpoint: this.options.endpoint,
      accessKeyId: this.options.accessKeyId,
      accessKeySecret: this.options.accessKeySecret,
      contentSha256: 'UNSIGNED-PAYLOAD',
      debug: this.options.debug
    })
    
    // 发送请求
    const url = `https://${bucket}.${this.options.endpoint}/${key}`
    const response = await fetch(url, {
      method: 'DELETE',
      headers,
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to delete from TOS: ${response.status} ${errorText}`)
    }
  }

  /**
   * 检查文件是否存在
   * @param bucket 存储桶名称
   * @param key 对象键（文件路径）
   * @returns 文件是否存在
   */
  async exists(bucket: string, key: string): Promise<boolean> {
    try {
      // 使用 HEAD 请求检查文件是否存在
      const headers = await signTOSRequest({
        method: 'HEAD',
        bucket,
        key,
        region: this.options.region,
        endpoint: this.options.endpoint,
        accessKeyId: this.options.accessKeyId,
        accessKeySecret: this.options.accessKeySecret,
        contentSha256: 'UNSIGNED-PAYLOAD',
        debug: this.options.debug
      })
      
      const url = `https://${bucket}.${this.options.endpoint}/${key}`
      const response = await fetch(url, {
        method: 'HEAD',
        headers,
      })

      return response.ok
    } catch {
      return false
    }
  }

  /**
   * 复制对象（可用于更新对象元数据）
   * @param sourceBucket 源存储桶名称
   * @param sourceKey 源对象键
   * @param destinationBucket 目标存储桶名称
   * @param destinationKey 目标对象键
   * @param options 复制选项
   */
  async copy(
    sourceBucket: string,
    sourceKey: string,
    destinationBucket: string,
    destinationKey: string,
    options: CopyOptions = {}
  ): Promise<void> {
    // 构建自定义头部
    const customHeaders: Record<string, string> = { ...options.headers }
    
    // 添加复制源
    customHeaders['x-tos-copy-source'] = `/${sourceBucket}/${sourceKey}`
    
    // 添加元数据指令
    if (options.metadataDirective) {
      customHeaders['x-tos-metadata-directive'] = options.metadataDirective
    }
    
    // 添加常用头部
    if (options.cacheControl) {
      customHeaders['Cache-Control'] = options.cacheControl
    }
    if (options.contentDisposition) {
      customHeaders['Content-Disposition'] = options.contentDisposition
    }
    
    // 添加自定义元数据
    if (options.metadata) {
      for (const [key, value] of Object.entries(options.metadata)) {
        customHeaders[`x-tos-meta-${key}`] = value
      }
    }
    
    // 生成签名
    const headers = await signTOSRequest({
      method: 'PUT',
      bucket: destinationBucket,
      key: destinationKey,
      region: this.options.region,
      endpoint: this.options.endpoint,
      accessKeyId: this.options.accessKeyId,
      accessKeySecret: this.options.accessKeySecret,
      contentType: options.contentType || 'application/octet-stream',
      contentSha256: 'UNSIGNED-PAYLOAD',
      customHeaders,
      debug: this.options.debug
    })
    
    // 发送请求
    const url = `https://${destinationBucket}.${this.options.endpoint}/${destinationKey}`
    const response = await fetch(url, {
      method: 'PUT',
      headers,
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to copy object in TOS: ${response.status} ${errorText}`)
    }
  }

  /**
   * 更新对象元数据（通过就地复制实现）
   * @param bucket 存储桶名称
   * @param key 对象键
   * @param options 更新选项
   */
  async updateMetadata(
    bucket: string,
    key: string,
    options: Omit<CopyOptions, 'metadataDirective'>
  ): Promise<void> {
    await this.copy(bucket, key, bucket, key, {
      ...options,
      metadataDirective: 'REPLACE'
    })
  }
}

