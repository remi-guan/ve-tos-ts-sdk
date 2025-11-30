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

export interface ListObjectsOptions {
  /** Prefix to filter objects */
  prefix?: string
  /** Delimiter for grouping (e.g., '/' for directory-like structure) */
  delimiter?: string
  /** Maximum number of objects to return (default: 1000, max: 1000) */
  maxKeys?: number
  /** Continuation token for pagination */
  continuationToken?: string
  /** Start listing after this key */
  startAfter?: string
  /** Custom HTTP headers to include in the request */
  headers?: Record<string, string>
}

export interface ListObjectsResult {
  /** List of objects */
  objects: ObjectInfo[]
  /** Common prefixes (directories when using delimiter) */
  commonPrefixes: string[]
  /** Whether the result is truncated */
  isTruncated: boolean
  /** Token for next page (if isTruncated is true) */
  nextContinuationToken?: string
  /** Total number of keys returned */
  keyCount: number
}

export interface ObjectInfo {
  /** Object key */
  key: string
  /** Last modified time */
  lastModified: Date
  /** ETag */
  etag: string
  /** Size in bytes */
  size: number
  /** Storage class */
  storageClass: string
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

  /**
   * 列举存储桶中的对象
   * @param bucket 存储桶名称
   * @param options 列举选项
   * @returns 对象列表和分页信息
   */
  async list(
    bucket: string,
    options: ListObjectsOptions = {}
  ): Promise<ListObjectsResult> {
    // 构建查询参数
    const queryParams: Record<string, string> = {
      'list-type': '2' // 使用 ListObjectsV2
    }
    
    if (options.prefix) {
      queryParams['prefix'] = options.prefix
    }
    if (options.delimiter) {
      queryParams['delimiter'] = options.delimiter
    }
    if (options.maxKeys) {
      queryParams['max-keys'] = String(options.maxKeys)
    }
    if (options.continuationToken) {
      queryParams['continuation-token'] = options.continuationToken
    }
    if (options.startAfter) {
      queryParams['start-after'] = options.startAfter
    }
    
    // 构建查询字符串（必须按字母顺序排序！这是签名规范要求的）
    const sortedKeys = Object.keys(queryParams).sort()
    const queryString = sortedKeys
      .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(queryParams[key] as string)}`)
      .join('&')
    
    // 构建自定义头部
    const customHeaders: Record<string, string> = { ...options.headers }
    
    // 生成签名（注意：list 操作的 key 是空字符串，查询参数需要包含在签名中）
    const headers = await signTOSRequest({
      method: 'GET',
      bucket,
      key: '', // ListObjects 使用根路径
      region: this.options.region,
      endpoint: this.options.endpoint,
      accessKeyId: this.options.accessKeyId,
      accessKeySecret: this.options.accessKeySecret,
      contentSha256: 'UNSIGNED-PAYLOAD',
      customHeaders,
      queryString, // 将查询参数传递给签名函数
      debug: this.options.debug
    })
    
    // 发送请求
    const url = `https://${bucket}.${this.options.endpoint}/?${queryString}`
    const response = await fetch(url, {
      method: 'GET',
      headers,
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to list objects in TOS: ${response.status} ${errorText}`)
    }

    // 解析响应（支持 JSON 和 XML 格式）
    const responseText = await response.text()
    return this.parseListObjectsResponse(responseText)
  }

  /**
   * 解析 ListObjects 响应（支持 JSON 和 XML 格式）
   * @private
   */
  private parseListObjectsResponse(responseText: string): ListObjectsResult {
    // 尝试解析 JSON（TOS 默认返回 JSON）
    try {
      const json = JSON.parse(responseText)
      return this.parseListObjectsJSON(json)
    } catch {
      // 如果不是 JSON，尝试解析 XML
      return this.parseListObjectsXML(responseText)
    }
  }

  /**
   * 解析 JSON 格式的 ListObjects 响应
   * @private
   */
  private parseListObjectsJSON(json: {
    Name?: string
    Prefix?: string
    KeyCount?: number
    MaxKeys?: number
    IsTruncated?: boolean
    NextContinuationToken?: string
    Contents?: Array<{
      Key: string
      LastModified: string
      ETag: string
      Size: number
      StorageClass: string
    }>
    CommonPrefixes?: Array<{ Prefix: string }>
  }): ListObjectsResult {
    const objects: ObjectInfo[] = (json.Contents || []).map(item => ({
      key: item.Key,
      lastModified: new Date(item.LastModified),
      etag: item.ETag.replace(/"/g, ''),
      size: item.Size,
      storageClass: item.StorageClass
    }))

    const commonPrefixes: string[] = (json.CommonPrefixes || []).map(p => p.Prefix)

    return {
      objects,
      commonPrefixes,
      isTruncated: json.IsTruncated || false,
      nextContinuationToken: json.NextContinuationToken,
      keyCount: json.KeyCount || objects.length
    }
  }

  /**
   * 解析 XML 格式的 ListObjects 响应
   * @private
   */
  private parseListObjectsXML(xml: string): ListObjectsResult {
    const objects: ObjectInfo[] = []
    const commonPrefixes: string[] = []
    
    // 提取 IsTruncated
    const isTruncatedMatch = xml.match(/<IsTruncated>(\w+)<\/IsTruncated>/)
    const isTruncated = isTruncatedMatch ? isTruncatedMatch[1] === 'true' : false
    
    // 提取 NextContinuationToken
    const nextTokenMatch = xml.match(/<NextContinuationToken>([^<]+)<\/NextContinuationToken>/)
    const nextContinuationToken = nextTokenMatch ? nextTokenMatch[1] : undefined
    
    // 提取 KeyCount
    const keyCountMatch = xml.match(/<KeyCount>(\d+)<\/KeyCount>/)
    const keyCount = keyCountMatch?.[1] ? parseInt(keyCountMatch[1], 10) : 0
    
    // 提取所有 <Contents> 块
    const contentsRegex = /<Contents>([\s\S]*?)<\/Contents>/g
    let match: RegExpExecArray | null
    
    while ((match = contentsRegex.exec(xml)) !== null) {
      const content = match[1]
      if (!content) continue
      
      const keyMatch = content.match(/<Key>([^<]*)<\/Key>/)
      const lastModifiedMatch = content.match(/<LastModified>([^<]+)<\/LastModified>/)
      const etagMatch = content.match(/<ETag>([^<]+)<\/ETag>/)
      const sizeMatch = content.match(/<Size>(\d+)<\/Size>/)
      const storageClassMatch = content.match(/<StorageClass>([^<]+)<\/StorageClass>/)
      
      if (keyMatch && keyMatch[1]) {
        objects.push({
          key: keyMatch[1],
          lastModified: lastModifiedMatch?.[1] ? new Date(lastModifiedMatch[1]) : new Date(),
          etag: etagMatch?.[1] ? etagMatch[1].replace(/"/g, '') : '',
          size: sizeMatch?.[1] ? parseInt(sizeMatch[1], 10) : 0,
          storageClass: storageClassMatch?.[1] || 'STANDARD'
        })
      }
    }
    
    // 提取所有 <CommonPrefixes> 块
    const prefixesRegex = /<CommonPrefixes>[\s\S]*?<Prefix>([^<]+)<\/Prefix>[\s\S]*?<\/CommonPrefixes>/g
    while ((match = prefixesRegex.exec(xml)) !== null) {
      if (match[1]) {
        commonPrefixes.push(match[1])
      }
    }
    
    return {
      objects,
      commonPrefixes,
      isTruncated,
      nextContinuationToken,
      keyCount
    }
  }
}

