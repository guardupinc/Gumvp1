// ============================================================================
// API CLIENT - FRONTEND
// ============================================================================
// This module provides a centralized API client for communicating with the
// Guard Up backend server.

import { projectId, publicAnonKey } from './supabase/info';

// ============================================================================
// CONFIGURATION
// ============================================================================

const API_BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-e7fd76e8`;

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  [key: string]: any;
}

export interface UserProfile {
  id: string;
  email: string;
  role: 'SECURITY_ADMIN' | 'GUARD' | 'COMPANY_ADMIN';
  name: string;
  guardId?: number;
  createdAt: string;
  lastLoginAt?: string;
}

// ============================================================================
// API CLIENT CLASS
// ============================================================================

class ApiClient {
  private accessToken: string | null = null;

  /**
   * Set the access token for authenticated requests
   */
  setAccessToken(token: string | null) {
    this.accessToken = token;
    
    // Store in localStorage for persistence
    if (token) {
      localStorage.setItem('guardup_access_token', token);
    } else {
      localStorage.removeItem('guardup_access_token');
    }
  }

  /**
   * Get the current access token
   */
  getAccessToken(): string | null {
    // Check memory first, then localStorage
    if (this.accessToken) {
      return this.accessToken;
    }
    
    const storedToken = localStorage.getItem('guardup_access_token');
    if (storedToken) {
      this.accessToken = storedToken;
      return storedToken;
    }
    
    return null;
  }

  /**
   * Make an authenticated API request
   */
  private async request<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Add authorization header if token exists
    const token = this.getAccessToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    } else {
      // Use public anon key for unauthenticated requests
      headers['Authorization'] = `Bearer ${publicAnonKey}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      return data;
    } catch (error) {
      console.error(`API request error [${endpoint}]:`, error);
      throw error;
    }
  }

  /**
   * GET request
   */
  async get<T = any>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  /**
   * POST request
   */
  async post<T = any>(endpoint: string, body?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  /**
   * PUT request
   */
  async put<T = any>(endpoint: string, body?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  /**
   * DELETE request
   */
  async delete<T = any>(endpoint: string, body?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  /**
   * Upload file
   */
  async uploadFile(file: File, folder: string = 'general'): Promise<any> {
    const url = `${API_BASE_URL}/upload`;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);

    const headers: HeadersInit = {};
    const token = this.getAccessToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    } else {
      headers['Authorization'] = `Bearer ${publicAnonKey}`;
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      return data;
    } catch (error) {
      console.error('File upload error:', error);
      throw error;
    }
  }

  // ============================================================================
  // AUTHENTICATION ENDPOINTS
  // ============================================================================

  async signUp(email: string, password: string, name: string, role: string, guardId?: number) {
    const response = await this.post('/auth/signup', { email, password, name, role, guardId });
    return response;
  }

  async signIn(email: string, password: string) {
    const response = await this.post('/auth/signin', { email, password });
    if (response.success && response.accessToken) {
      this.setAccessToken(response.accessToken);
    }
    return response;
  }

  async getSession() {
    return this.get('/auth/session');
  }

  async signOut() {
    const response = await this.post('/auth/signout');
    this.setAccessToken(null);
    return response;
  }

  // ============================================================================
  // GUARDS ENDPOINTS
  // ============================================================================

  async getAllGuards() {
    return this.get('/guards');
  }

  async getGuard(id: number) {
    return this.get(`/guards/${id}`);
  }

  async createGuard(guardData: any) {
    return this.post('/guards', guardData);
  }

  async updateGuard(id: number, updates: any) {
    return this.put(`/guards/${id}`, updates);
  }

  async deleteGuard(id: number) {
    return this.delete(`/guards/${id}`);
  }

  async clockInGuard(id: number, site: string, location: string) {
    return this.post(`/guards/${id}/clock-in`, { site, location });
  }

  async clockOutGuard(id: number) {
    return this.post(`/guards/${id}/clock-out`);
  }

  async getActiveGuards() {
    return this.get('/guards/active/all');
  }

  // ============================================================================
  // REPORTS ENDPOINTS
  // ============================================================================

  async getAllReports() {
    return this.get('/reports');
  }

  async getReport(id: number) {
    return this.get(`/reports/${id}`);
  }

  async createReport(reportData: any) {
    return this.post('/reports', reportData);
  }

  async updateReport(id: number, updates: any) {
    return this.put(`/reports/${id}`, updates);
  }

  async approveReport(id: number, clientName?: string) {
    return this.post(`/reports/${id}/approve`, { clientName });
  }

  async rejectReport(id: number, rejectionNote: string) {
    return this.post(`/reports/${id}/reject`, { rejectionNote });
  }

  async deleteReport(id: number) {
    return this.delete(`/reports/${id}`);
  }

  // ============================================================================
  // SCHEDULING ENDPOINTS
  // ============================================================================

  async getAllShifts() {
    return this.get('/shifts');
  }

  async createShift(shiftData: any) {
    return this.post('/shifts', shiftData);
  }

  async updateShift(id: number, updates: any) {
    return this.put(`/shifts/${id}`, updates);
  }

  async deleteShift(id: number) {
    return this.delete(`/shifts/${id}`);
  }

  async getUnassignedShifts() {
    return this.get('/shifts/unassigned/all');
  }

  async createUnassignedShift(shiftData: any) {
    return this.post('/shifts/unassigned', shiftData);
  }

  // ============================================================================
  // INCIDENTS ENDPOINTS
  // ============================================================================

  async getAllIncidents() {
    return this.get('/incidents');
  }

  async createIncident(incidentData: any) {
    return this.post('/incidents', incidentData);
  }

  async updateIncident(id: number, updates: any) {
    return this.put(`/incidents/${id}`, updates);
  }

  async resolveIncident(id: number) {
    return this.post(`/incidents/${id}/resolve`);
  }

  // ============================================================================
  // VAULT DOCUMENTS ENDPOINTS
  // ============================================================================

  async getAllVaultDocuments() {
    return this.get('/vault/documents');
  }

  async createVaultDocument(docData: any) {
    return this.post('/vault/documents', docData);
  }

  // ============================================================================
  // SITES ENDPOINTS
  // ============================================================================

  async getAllSites() {
    return this.get('/sites');
  }

  async updateSite(id: number, updates: any) {
    return this.put(`/sites/${id}`, updates);
  }

  // ============================================================================
  // DASHBOARD ENDPOINTS
  // ============================================================================

  async getDashboardMetrics() {
    return this.get('/dashboard/metrics');
  }

  // ============================================================================
  // FILE STORAGE ENDPOINTS
  // ============================================================================

  async uploadFileBase64(base64Data: string, fileName: string, mimeType: string, folder: string = 'general') {
    return this.post('/upload/base64', { base64Data, fileName, mimeType, folder });
  }

  async getSignedUrl(filePath: string, expiresIn?: number) {
    return this.post('/files/signed-url', { filePath, expiresIn });
  }

  async listFiles(folder: string) {
    return this.get(`/files/${folder}`);
  }

  async deleteFile(filePath: string) {
    return this.delete('/files', { filePath });
  }
}

// ============================================================================
// EXPORT SINGLETON INSTANCE
// ============================================================================

export const api = new ApiClient();

// ============================================================================
// CONVENIENCE HOOKS (Optional - for React components)
// ============================================================================

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return api.getAccessToken() !== null;
}

/**
 * Get stored user data from localStorage
 */
export function getStoredUser(): UserProfile | null {
  const userData = localStorage.getItem('guardup_user');
  if (!userData) return null;
  
  try {
    return JSON.parse(userData);
  } catch {
    return null;
  }
}

/**
 * Store user data in localStorage
 */
export function setStoredUser(user: UserProfile | null) {
  if (user) {
    localStorage.setItem('guardup_user', JSON.stringify(user));
  } else {
    localStorage.removeItem('guardup_user');
  }
}

/**
 * Clear all auth data
 */
export function clearAuthData() {
  api.setAccessToken(null);
  setStoredUser(null);
}
