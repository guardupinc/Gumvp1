import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";
import * as storage from "./storage.tsx";
import * as data from "./data.tsx";
import * as auth from "./auth.tsx";
import * as db from "./database.tsx";
import { seedDatabase } from "./init-database.tsx";
import api from "./routes.tsx";
// Use existing KV-based API routes
import apiRoutes from "./api-routes.tsx";

const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-e7fd76e8/health", (c) => {
  return c.json({ status: "ok" });
});

// Mount API routes
app.route("/make-server-e7fd76e8", api);
app.route("/make-server-e7fd76e8/api", apiRoutes);

// ============================================================================
// FILE UPLOAD ROUTES
// ============================================================================

// Upload file endpoint
app.post("/make-server-e7fd76e8/upload", auth.requireAuth, async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get('file') as File;
    const folder = (formData.get('folder') as string) || 'general';
    
    if (!file) {
      return c.json({ error: 'No file provided' }, 400);
    }
    
    // Validate file type
    if (!storage.isValidFileType(file.type)) {
      return c.json({ error: 'Invalid file type' }, 400);
    }
    
    // Validate file size (50MB max)
    if (!storage.isValidFileSize(file.size)) {
      return c.json({ error: 'File size exceeds 50MB limit' }, 400);
    }
    
    const result = await storage.uploadFile(file, folder);
    
    return c.json({
      success: true,
      file: {
        path: result.path,
        url: result.url,
        size: storage.formatFileSize(result.size),
        sizeBytes: result.size
      }
    });
  } catch (error) {
    console.error('Upload endpoint error:', error);
    return c.json({ error: 'Failed to upload file' }, 500);
  }
});

// Upload file from base64
app.post("/make-server-e7fd76e8/upload/base64", auth.requireAuth, async (c) => {
  try {
    const { base64Data, fileName, mimeType, folder } = await c.req.json();
    
    if (!base64Data || !fileName || !mimeType) {
      return c.json({ error: 'Missing required fields: base64Data, fileName, mimeType' }, 400);
    }
    
    // Validate file type
    if (!storage.isValidFileType(mimeType)) {
      return c.json({ error: 'Invalid file type' }, 400);
    }
    
    const result = await storage.uploadFileFromBase64(base64Data, fileName, mimeType, folder || 'general');
    
    return c.json({
      success: true,
      file: {
        path: result.path,
        url: result.url,
        size: storage.formatFileSize(result.size),
        sizeBytes: result.size
      }
    });
  } catch (error) {
    console.error('Upload base64 endpoint error:', error);
    return c.json({ error: 'Failed to upload file' }, 500);
  }
});

// Get signed URL for file
// Note: Auth temporarily disabled for MVP - vault document access
app.post("/make-server-e7fd76e8/files/signed-url", async (c) => {
  try {
    const { filePath, expiresIn } = await c.req.json();
    
    if (!filePath) {
      return c.json({ error: 'Missing required field: filePath' }, 400);
    }
    
    console.log('[Files] Generating signed URL for:', filePath, 'expires in:', expiresIn);
    
    const url = await storage.getSignedUrl(filePath, expiresIn);
    
    console.log('[Files] ✅ Generated signed URL successfully');
    
    return c.json({
      success: true,
      url
    });
  } catch (error) {
    console.error('[Files] Get signed URL endpoint error:', error);
    return c.json({ error: 'Failed to generate signed URL', details: String(error) }, 500);
  }
});

// List files in folder
app.get("/make-server-e7fd76e8/files/:folder", auth.requireAuth, async (c) => {
  try {
    const folder = c.req.param('folder');
    const files = await storage.listFiles(folder);
    
    return c.json({
      success: true,
      files
    });
  } catch (error) {
    console.error('List files endpoint error:', error);
    return c.json({ error: 'Failed to list files' }, 500);
  }
});

// Delete file
app.delete("/make-server-e7fd76e8/files", auth.requireAuth, async (c) => {
  try {
    const { filePath } = await c.req.json();
    
    if (!filePath) {
      return c.json({ error: 'Missing required field: filePath' }, 400);
    }
    
    await storage.deleteFile(filePath);
    
    return c.json({
      success: true,
      message: 'File deleted successfully'
    });
  } catch (error) {
    console.error('Delete file endpoint error:', error);
    return c.json({ error: 'Failed to delete file' }, 500);
  }
});

// ============================================================================
// SERVER INITIALIZATION
// ============================================================================

// Initialize storage and database on startup
(async () => {
  try {
    console.log('Initializing Guard Up server...');
    
    // Initialize Supabase Storage
    await storage.initializeStorage();
    
    // Initialize database with seed data
    await seedDatabase();
    
    console.log('Guard Up server initialized successfully');
  } catch (error) {
    console.error('Server initialization error:', error);
  }
})();

Deno.serve(app.fetch);