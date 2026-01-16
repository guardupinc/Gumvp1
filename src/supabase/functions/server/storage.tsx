// ============================================================================
// SUPABASE STORAGE INTEGRATION
// ============================================================================
// This module handles file uploads, downloads, and management using
// Supabase Storage for the Guard Up application.

import { createClient } from 'npm:@supabase/supabase-js@2.39.3';
import type { Context } from 'npm:hono';
import * as auth from './auth.tsx';

// ============================================================================
// CONSTANTS
// ============================================================================

const BUCKET_NAME = 'make-e7fd76e8-guardup-files';
const SIGNED_URL_EXPIRY = 3600; // 1 hour in seconds

// ============================================================================
// SUPABASE CLIENT
// ============================================================================

function getSupabaseClient() {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  );
}

// ============================================================================
// BUCKET MANAGEMENT
// ============================================================================

/**
 * Initialize storage bucket (idempotent)
 * Should be called on server startup
 */
export async function initializeStorage() {
  try {
    const supabase = getSupabaseClient();
    
    // Check if bucket already exists
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some(bucket => bucket.name === BUCKET_NAME);
    
    if (!bucketExists) {
      console.log(`Creating storage bucket: ${BUCKET_NAME}`);
      const { error } = await supabase.storage.createBucket(BUCKET_NAME, {
        public: false, // Private bucket - requires signed URLs
        fileSizeLimit: 52428800, // 50MB limit
        allowedMimeTypes: [
          'image/jpeg',
          'image/png',
          'image/gif',
          'image/webp',
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'text/plain',
          'video/mp4',
          'video/quicktime'
        ]
      });
      
      if (error) {
        console.error('Error creating storage bucket:', error);
        throw error;
      }
      
      console.log(`Storage bucket created: ${BUCKET_NAME}`);
    } else {
      console.log(`Storage bucket already exists: ${BUCKET_NAME}`);
    }
  } catch (error) {
    console.error('Storage initialization error:', error);
    throw error;
  }
}

// ============================================================================
// FILE UPLOAD
// ============================================================================

/**
 * Upload a file to storage
 * Returns the file path and signed URL for access
 */
export async function uploadFile(
  file: File,
  folder: string = 'general'
): Promise<{ path: string; url: string; size: number }> {
  try {
    const supabase = getSupabaseClient();
    
    // Generate unique filename
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(7);
    const fileExt = file.name.split('.').pop();
    const fileName = `${timestamp}-${randomSuffix}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;
    
    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    // Upload file
    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, uint8Array, {
        contentType: file.type,
        upsert: false
      });
    
    if (uploadError) {
      console.error('File upload error:', uploadError);
      throw uploadError;
    }
    
    // Generate signed URL
    const { data: signedUrlData, error: urlError } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(filePath, SIGNED_URL_EXPIRY);
    
    if (urlError || !signedUrlData) {
      console.error('Signed URL generation error:', urlError);
      throw urlError || new Error('Failed to generate signed URL');
    }
    
    return {
      path: filePath,
      url: signedUrlData.signedUrl,
      size: file.size
    };
  } catch (error) {
    console.error('Upload file error:', error);
    throw error;
  }
}

/**
 * Upload a file from base64 data
 */
export async function uploadFileFromBase64(
  base64Data: string,
  fileName: string,
  mimeType: string,
  folder: string = 'general'
): Promise<{ path: string; url: string; size: number }> {
  try {
    const supabase = getSupabaseClient();
    
    // Remove data URL prefix if present
    const base64Content = base64Data.replace(/^data:[^;]+;base64,/, '');
    
    // Decode base64 to binary
    const binaryString = atob(base64Content);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    // Generate unique filename
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(7);
    const fileExt = fileName.split('.').pop();
    const uniqueFileName = `${timestamp}-${randomSuffix}.${fileExt}`;
    const filePath = `${folder}/${uniqueFileName}`;
    
    // Upload file
    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, bytes, {
        contentType: mimeType,
        upsert: false
      });
    
    if (uploadError) {
      console.error('File upload error:', uploadError);
      throw uploadError;
    }
    
    // Generate signed URL
    const { data: signedUrlData, error: urlError } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(filePath, SIGNED_URL_EXPIRY);
    
    if (urlError || !signedUrlData) {
      console.error('Signed URL generation error:', urlError);
      throw urlError || new Error('Failed to generate signed URL');
    }
    
    return {
      path: filePath,
      url: signedUrlData.signedUrl,
      size: bytes.length
    };
  } catch (error) {
    console.error('Upload file from base64 error:', error);
    throw error;
  }
}

// ============================================================================
// FILE RETRIEVAL
// ============================================================================

/**
 * Get a signed URL for a file
 */
export async function getSignedUrl(filePath: string, expiresIn: number = SIGNED_URL_EXPIRY): Promise<string> {
  try {
    const supabase = getSupabaseClient();
    
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(filePath, expiresIn);
    
    if (error || !data) {
      console.error('Get signed URL error:', error);
      throw error || new Error('Failed to generate signed URL');
    }
    
    return data.signedUrl;
  } catch (error) {
    console.error('Get signed URL error:', error);
    throw error;
  }
}

/**
 * Get signed URLs for multiple files
 */
export async function getSignedUrls(filePaths: string[], expiresIn: number = SIGNED_URL_EXPIRY): Promise<string[]> {
  try {
    const urls = await Promise.all(
      filePaths.map(path => getSignedUrl(path, expiresIn))
    );
    return urls;
  } catch (error) {
    console.error('Get signed URLs error:', error);
    throw error;
  }
}

/**
 * Download a file as binary data
 */
export async function downloadFile(filePath: string): Promise<Uint8Array> {
  try {
    const supabase = getSupabaseClient();
    
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .download(filePath);
    
    if (error || !data) {
      console.error('Download file error:', error);
      throw error || new Error('Failed to download file');
    }
    
    const arrayBuffer = await data.arrayBuffer();
    return new Uint8Array(arrayBuffer);
  } catch (error) {
    console.error('Download file error:', error);
    throw error;
  }
}

// ============================================================================
// FILE MANAGEMENT
// ============================================================================

/**
 * List files in a folder
 */
export async function listFiles(folder: string = ''): Promise<any[]> {
  try {
    const supabase = getSupabaseClient();
    
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .list(folder, {
        limit: 100,
        offset: 0,
        sortBy: { column: 'created_at', order: 'desc' }
      });
    
    if (error) {
      console.error('List files error:', error);
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('List files error:', error);
    throw error;
  }
}

/**
 * Delete a file
 */
export async function deleteFile(filePath: string): Promise<void> {
  try {
    const supabase = getSupabaseClient();
    
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([filePath]);
    
    if (error) {
      console.error('Delete file error:', error);
      throw error;
    }
  } catch (error) {
    console.error('Delete file error:', error);
    throw error;
  }
}

/**
 * Delete multiple files
 */
export async function deleteFiles(filePaths: string[]): Promise<void> {
  try {
    const supabase = getSupabaseClient();
    
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove(filePaths);
    
    if (error) {
      console.error('Delete files error:', error);
      throw error;
    }
  } catch (error) {
    console.error('Delete files error:', error);
    throw error;
  }
}

/**
 * Move/rename a file
 */
export async function moveFile(fromPath: string, toPath: string): Promise<void> {
  try {
    const supabase = getSupabaseClient();
    
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .move(fromPath, toPath);
    
    if (error) {
      console.error('Move file error:', error);
      throw error;
    }
  } catch (error) {
    console.error('Move file error:', error);
    throw error;
  }
}

// ============================================================================
// FILE METADATA
// ============================================================================

/**
 * Get file metadata
 */
export async function getFileMetadata(filePath: string): Promise<any> {
  try {
    const supabase = getSupabaseClient();
    
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .list(filePath.split('/').slice(0, -1).join('/'), {
        search: filePath.split('/').pop()
      });
    
    if (error) {
      console.error('Get file metadata error:', error);
      throw error;
    }
    
    return data?.[0] || null;
  } catch (error) {
    console.error('Get file metadata error:', error);
    throw error;
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Validate file type
 */
export function isValidFileType(mimeType: string): boolean {
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'video/mp4',
    'video/quicktime'
  ];
  
  return allowedTypes.includes(mimeType);
}

/**
 * Validate file size
 */
export function isValidFileSize(size: number, maxSizeMB: number = 50): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return size <= maxSizeBytes;
}
