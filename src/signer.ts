/**
 * 火山引擎 TOS 签名实现
 * 基于 TOS4-HMAC-SHA256 签名算法，使用 Web Crypto API
 * 
 * 相比官方 SDK 的优势：
 * - 支持 Cloudflare Workers、Deno、Bun 等非 Node.js 环境
 * - 零依赖，使用标准 Web Crypto API
 * - 更小的包体积
 * - 现代化的 TypeScript 实现
 */

export interface TOSSignOptions {
  method: string
  bucket: string
  key: string
  region: string
  endpoint: string
  accessKeyId: string
  secretAccessKey: string
  contentType?: string
  contentSha256?: string
  date?: Date
  debug?: boolean
}

/**
 * 计算 HMAC-SHA256
 */
async function hmacSha256(key: ArrayBuffer | string, data: string): Promise<ArrayBuffer> {
  const encoder = new TextEncoder()
  const keyData = typeof key === 'string' ? encoder.encode(key) : key
  
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  
  return await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(data))
}

/**
 * 将 ArrayBuffer 转换为十六进制字符串
 */
function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * 格式化日期为 ISO8601 格式
 */
function formatDate(date: Date): { short: string; long: string } {
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')
  const hours = String(date.getUTCHours()).padStart(2, '0')
  const minutes = String(date.getUTCMinutes()).padStart(2, '0')
  const seconds = String(date.getUTCSeconds()).padStart(2, '0')
  
  return {
    short: `${year}${month}${day}`,
    long: `${year}${month}${day}T${hours}${minutes}${seconds}Z`
  }
}

/**
 * URI 编码（保留部分字符）
 */
function uriEncode(str: string, encodeSlash: boolean = true): string {
  let result = encodeURIComponent(str)
  result = result.replace(/!/g, '%21')
  result = result.replace(/'/g, '%27')
  result = result.replace(/\(/g, '%28')
  result = result.replace(/\)/g, '%29')
  result = result.replace(/\*/g, '%2A')
  
  if (!encodeSlash) {
    result = result.replace(/%2F/g, '/')
  }
  
  return result
}

/**
 * 生成 TOS 签名
 * @param options 签名选项
 * @returns 包含签名的 Headers 对象
 */
export async function signTOSRequest(options: TOSSignOptions): Promise<Headers> {
  const {
    method,
    bucket,
    key,
    region,
    accessKeyId,
    secretAccessKey,
    contentType = 'application/octet-stream',
    contentSha256,
    date = new Date(),
    debug = false
  } = options
  
  const dates = formatDate(date)
  const host = `${bucket}.${options.endpoint}`
  const uri = `/${uriEncode(key, false)}`
  
  // 计算 content SHA256（如果没有提供）
  const payloadHash = contentSha256 || 'UNSIGNED-PAYLOAD'
  
  // 构建 canonical headers
  const canonicalHeaders = [
    `host:${host}`,
    `x-tos-content-sha256:${payloadHash}`,
    `x-tos-date:${dates.long}`
  ].join('\n')
  
  const signedHeaders = 'host;x-tos-content-sha256;x-tos-date'
  
  // 构建 canonical request
  const canonicalRequest = [
    method,
    uri,
    '', // query string (empty for simple requests)
    canonicalHeaders,
    '', // empty line after headers
    signedHeaders,
    payloadHash
  ].join('\n')
  
  if (debug) {
    console.log('[TOS Signer] Canonical Request:', canonicalRequest)
  }
  
  // 计算 canonical request 的 SHA256
  const canonicalRequestHash = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(canonicalRequest)
  )
  const canonicalRequestHashHex = bufferToHex(canonicalRequestHash)
  
  // 构建 string to sign
  const credentialScope = `${dates.short}/${region}/tos/request`
  const stringToSign = [
    'TOS4-HMAC-SHA256',
    dates.long,
    credentialScope,
    canonicalRequestHashHex
  ].join('\n')
  
  if (debug) {
    console.log('[TOS Signer] String to Sign:', stringToSign)
  }
  
  // 计算签名密钥
  const kDate = await hmacSha256(secretAccessKey, dates.short)
  const kRegion = await hmacSha256(kDate, region)
  const kService = await hmacSha256(kRegion, 'tos')
  const kSigning = await hmacSha256(kService, 'request')
  const signature = await hmacSha256(kSigning, stringToSign)
  const signatureHex = bufferToHex(signature)
  
  if (debug) {
    console.log('[TOS Signer] Signature:', signatureHex)
  }
  
  // 构建 Authorization header
  const authorization = `TOS4-HMAC-SHA256 Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signatureHex}`
  
  // 返回所有需要的 headers
  const headers = new Headers()
  headers.set('Host', host)
  headers.set('X-Tos-Date', dates.long)
  headers.set('X-Tos-Content-Sha256', payloadHash)
  headers.set('Authorization', authorization)
  headers.set('Content-Type', contentType)
  
  return headers
}

