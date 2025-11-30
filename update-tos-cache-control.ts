#!/usr/bin/env bun
/**
 * Script to recursively update Cache-Control header for all files in TOS bucket
 * 
 * Usage:
 *   bun run scripts/update-tos-cache-control.ts
 * 
 * Required environment variables:
 *   TOS_REGION - TOS region (e.g., 'cn-beijing')
 *   TOS_ENDPOINT - TOS endpoint (e.g., 'tos-cn-beijing.volces.com')
 *   TOS_ACCESS_KEY_ID - Access key ID
 *   TOS_ACCESS_KEY_SECRET - Access key secret
 *   R2_BUCKET_NAME - Bucket name to update
 */

import { TOSClient } from 've-tos-ts-sdk';

// Cache control value for 1 year
const ONE_YEAR_CACHE = 'public, max-age=31536000, immutable';

// Get environment variables
const region = process.env.TOS_REGION;
const endpoint = process.env.TOS_ENDPOINT;
const accessKeyId = process.env.TOS_ACCESS_KEY_ID;
const accessKeySecret = process.env.TOS_ACCESS_KEY_SECRET;
const bucketName = process.env.R2_BUCKET_NAME;

if (!region || !endpoint || !accessKeyId || !accessKeySecret || !bucketName) {
  console.error('❌ Missing required environment variables');
  console.error('Required: TOS_REGION, TOS_ENDPOINT, TOS_ACCESS_KEY_ID, TOS_ACCESS_KEY_SECRET, R2_BUCKET_NAME');
  console.error('');
  console.error('You can set them inline:');
  console.error('  TOS_REGION=cn-shanghai TOS_ENDPOINT=tos-cn-shanghai.volces.com TOS_ACCESS_KEY_ID=xxx TOS_ACCESS_KEY_SECRET=xxx R2_BUCKET_NAME=deckflow bun run scripts/update-tos-cache-control.ts');
  process.exit(1);
}

console.log('🚀 Starting TOS Cache-Control update script');
console.log(`📦 Bucket: ${bucketName}`);
console.log(`🌍 Region: ${region}`);
console.log(`🔗 Endpoint: ${endpoint}`);
console.log(`⏱️  Cache-Control: ${ONE_YEAR_CACHE}`);
console.log('');

const client = new TOSClient({
  region,
  endpoint,
  accessKeyId,
  accessKeySecret,
  debug: false,
});

/**
 * List all objects in the bucket using SDK's list method with pagination
 */
async function listAllObjects(): Promise<string[]> {
  const allKeys: string[] = [];
  let continuationToken: string | undefined;
  
  console.log('📋 Listing all objects in bucket...');
  
  do {
    const result = await client.list(bucketName!, {
      maxKeys: 1000,
      continuationToken,
    });
    
    for (const obj of result.objects) {
      allKeys.push(obj.key);
    }
    
    continuationToken = result.isTruncated ? result.nextContinuationToken : undefined;
    
    console.log(`   Found ${allKeys.length} objects so far...`);
    
  } while (continuationToken);
  
  console.log(`✅ Total objects found: ${allKeys.length}`);
  return allKeys;
}

/**
 * Update a single file's Cache-Control header
 */
async function updateFileMetadata(key: string): Promise<boolean> {
  try {
    await client.updateMetadata(bucketName!, key, {
      cacheControl: ONE_YEAR_CACHE,
    });
    return true;
  } catch (error) {
    console.error(`   ❌ Failed: ${key}`, error);
    return false;
  }
}

/**
 * Update multiple files by their keys with progress
 */
async function updateFiles(keys: string[]): Promise<{ success: number; failed: number }> {
  let success = 0;
  let failed = 0;
  const total = keys.length;
  
  console.log(`\n🔄 Updating ${total} files with Cache-Control: ${ONE_YEAR_CACHE}\n`);
  
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const result = await updateFileMetadata(key);
    
    if (result) {
      success++;
      console.log(`   ✅ [${i + 1}/${total}] ${key}`);
    } else {
      failed++;
      console.log(`   ❌ [${i + 1}/${total}] ${key}`);
    }
    
    // Add a small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  
  return { success, failed };
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help')) {
    console.log('Usage:');
    console.log('  bun run scripts/update-tos-cache-control.ts          # Update all files in bucket');
    console.log('  bun run scripts/update-tos-cache-control.ts --dry-run # List files without updating');
    console.log('  bun run scripts/update-tos-cache-control.ts key1 key2 # Update specific files');
    return;
  }
  
  if (args.includes('--dry-run')) {
    // Dry run - just list files
    const keys = await listAllObjects();
    console.log('\n📋 Files that would be updated:');
    keys.forEach(key => console.log(`   - ${key}`));
    console.log(`\nTotal: ${keys.length} files`);
    console.log('\nRun without --dry-run to actually update the files.');
    return;
  }
  
  if (args.length > 0 && !args[0].startsWith('--')) {
    // Update specific files
    console.log(`📋 Updating ${args.length} specified files...`);
    const { success, failed } = await updateFiles(args);
    console.log('\n' + '='.repeat(50));
    console.log(`✅ Successfully updated: ${success}`);
    console.log(`❌ Failed: ${failed}`);
    return;
  }
  
  // Update all files in bucket
  try {
    const keys = await listAllObjects();
    
    if (keys.length === 0) {
      console.log('⚠️  No objects found in bucket');
      return;
    }
    
    const { success, failed } = await updateFiles(keys);
    
    console.log('\n' + '='.repeat(50));
    console.log(`✅ Successfully updated: ${success}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📊 Total: ${keys.length}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main().catch(console.error);
