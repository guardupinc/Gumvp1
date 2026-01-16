// ============================================================================
// API CLIENT - GUARD UP MVP
// ============================================================================
// Centralized API client for all server communication

import { projectId, publicAnonKey } from './supabase/info';

const BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-e7fd76e8/api`;

// For mock/demo mode without authentication
const USE_MOCK_TOKEN = true;
const MOCK_TOKEN = publicAnonKey; // Use anon key for unauthenticated requests

/**
 * Get auth token from storage or use mock token
 */
function getAuthToken(): string {
  if (USE_MOCK_TOKEN) {
    return MOCK_TOKEN;
  }
  
  // TODO: In production, get real auth token from session
  return localStorage.getItem('accessToken') || MOCK_TOKEN;
}

/**
 * Safe API fetch helper with detailed error reporting
 * Throws Error with structured error data from server
 */
async function apiFetch(url: string, options: RequestInit = {}): Promise<any> {
  const res = await fetch(url, options);
  const text = await res.text();
  
  if (!res.ok) {
    // Try to parse error response as JSON
    let errorData: any = { error: text || res.statusText };
    
    try {
      if (text) {
        errorData = JSON.parse(text);
      }
    } catch (parseError) {
      // Not JSON, use text as error message
      errorData = { error: text || res.statusText };
    }
    
    // Create structured error
    const error: any = new Error(errorData.error || `HTTP ${res.status} ${res.statusText}`);
    error.status = res.status;
    error.code = errorData.code;
    error.wrong_org_report_ids = errorData.wrong_org_report_ids || [];
    error.missing_report_ids = errorData.missing_report_ids || [];
    error.url = url;
    
    console.error('[apiFetch] Error:', {
      status: res.status,
      url,
      code: error.code,
      message: error.message,
      wrong_org_report_ids: error.wrong_org_report_ids,
      missing_report_ids: error.missing_report_ids
    });
    
    throw error;
  }
  
  try {
    return text ? JSON.parse(text) : null;
  } catch (parseError) {
    // If response is not JSON, return raw text
    return text;
  }
}

/**
 * Generic API request handler
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken();
  
  const url = `${BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    ...options.headers,
  };

  try {
    const response = await apiFetch(url, {
      ...options,
      headers,
    });

    return response;
  } catch (error) {
    // In demo mode with anon key, suppress fetch errors as they're expected
    // The app will use fallback data from initial state
    if (USE_MOCK_TOKEN && error instanceof TypeError && error.message.includes('fetch')) {
      // Silently fail - this is expected in demo mode when server isn't available
      throw error;
    }
    console.error(`API Error [${endpoint}]:`, error);
    throw error;
  }
}

// ============================================================================
// REPORT API
// ============================================================================

export const reportsAPI = {
  /**
   * Get all reports (filtered by role on server)
   */
  async getAll() {
    return apiRequest<{ success: boolean; reports: any[] }>('/reports');
  },

  /**
   * Get single report by ID
   */
  async getById(id: number) {
    return apiRequest<{ success: boolean; report: any }>(`/reports/${id}`);
  },

  /**
   * Create new report
   */
  async create(reportData: any) {
    return apiRequest<{ success: boolean; report: any }>('/reports', {
      method: 'POST',
      body: JSON.stringify(reportData),
    });
  },

  /**
   * Update report
   */
  async update(id: number, updates: any) {
    return apiRequest<{ success: boolean; report: any }>(`/reports/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  /**
   * Approve report (admin only)
   */
  async approve(id: number, options?: { notifyGuard?: boolean; updates?: any; reviewerName?: string; reviewerRole?: string; reviewerId?: number }) {
    return apiRequest<{ success: boolean; report: any }>(`/reports/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify(options || {}),
    });
  },

  /**
   * Reject report (admin only)
   */
  async reject(id: number, rejectionNote: string, reviewerMeta?: { reviewerName?: string; reviewerRole?: string; reviewerId?: number }) {
    return apiRequest<{ success: boolean; report: any }>(`/reports/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ 
        rejectionNote,
        ...reviewerMeta 
      }),
    });
  },

  /**
   * Resubmit report (guard only - for rejected reports)
   */
  async resubmit(id: number, updates?: any) {
    return apiRequest<{ success: boolean; report: any }>(`/reports/${id}/resubmit`, {
      method: 'POST',
      body: JSON.stringify(updates || {}),
    });
  },

  /**
   * Delete report
   */
  async delete(id: number) {
    return apiRequest<{ success: boolean; message: string }>(`/reports/${id}`, {
      method: 'DELETE',
    });
  },
};

// ============================================================================
// GUARD API
// ============================================================================

export const guardsAPI = {
  /**
   * Get all guards (admin only)
   */
  async getAll() {
    return apiRequest<{ success: boolean; guards: any[] }>('/guards');
  },

  /**
   * Get guard by ID
   */
  async getById(id: number) {
    return apiRequest<{ success: boolean; guard: any }>(`/guards/${id}`);
  },

  /**
   * Create new guard (admin only)
   */
  async create(guardData: any) {
    return apiRequest<{ success: boolean; guard: any }>('/guards', {
      method: 'POST',
      body: JSON.stringify(guardData),
    });
  },

  /**
   * Update guard (admin only)
   */
  async update(id: number, updates: any) {
    return apiRequest<{ success: boolean; guard: any }>(`/guards/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },
};

// ============================================================================
// INCIDENT API
// ============================================================================

export const incidentsAPI = {
  /**
   * Get all incidents (filtered by role on server)
   */
  async getAll() {
    return apiRequest<{ success: boolean; incidents: any[] }>('/incidents');
  },

  /**
   * Create new incident
   */
  async create(incidentData: any) {
    return apiRequest<{ success: boolean; incident: any }>('/incidents', {
      method: 'POST',
      body: JSON.stringify(incidentData),
    });
  },

  /**
   * Update incident
   */
  async update(id: number, updates: any) {
    return apiRequest<{ success: boolean; incident: any }>(`/incidents/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },
};

// ============================================================================
// SHIFT API
// ============================================================================

export const shiftsAPI = {
  /**
   * Get all shifts (filtered by role on server)
   */
  async getAll() {
    return apiRequest<{ success: boolean; shifts: any[] }>('/shifts');
  },

  /**
   * Create new shift (admin only)
   */
  async create(shiftData: any) {
    return apiRequest<{ success: boolean; shift: any }>('/shifts', {
      method: 'POST',
      body: JSON.stringify(shiftData),
    });
  },

  /**
   * Update shift (admin only)
   */
  async update(id: number, updates: any) {
    return apiRequest<{ success: boolean; shift: any }>(`/shifts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  /**
   * Delete shift (admin only)
   */
  async delete(id: number) {
    return apiRequest<{ success: boolean; message: string }>(`/shifts/${id}`, {
      method: 'DELETE',
    });
  },
};

// ============================================================================
// VAULT API
// ============================================================================

export const vaultAPI = {
  /**
   * Get all vault documents
   */
  async getAll() {
    return apiRequest<{ success: boolean; documents: any[] }>('/vault');
  },

  /**
   * Create vault document
   */
  async create(docData: any) {
    return apiRequest<{ success: boolean; document: any }>('/vault', {
      method: 'POST',
      body: JSON.stringify(docData),
    });
  },
};

// ============================================================================
// SITE API
// ============================================================================

export const sitesAPI = {
  /**
   * Get all sites
   */
  async getAll() {
    return apiRequest<{ success: boolean; sites: any[] }>('/sites');
  },

  /**
   * Update site (admin only)
   */
  async update(id: number, updates: any) {
    return apiRequest<{ success: boolean; site: any }>(`/sites/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },
};

// ============================================================================
// SYNC API - Fetch all data at once
// ============================================================================

export const syncAPI = {
  /**
   * Fetch all data from server for initial load
   */
  async fetchAll() {
    try {
      const [
        reportsRes,
        // guardsRes, // Only admins can fetch all guards
        incidentsRes,
        shiftsRes,
        vaultRes,
        sitesRes
      ] = await Promise.all([
        reportsAPI.getAll().catch(() => ({ success: false, reports: [] })),
        // guardsAPI.getAll().catch(() => ({ success: false, guards: [] })),
        incidentsAPI.getAll().catch(() => ({ success: false, incidents: [] })),
        shiftsAPI.getAll().catch(() => ({ success: false, shifts: [] })),
        vaultAPI.getAll().catch(() => ({ success: false, documents: [] })),
        sitesAPI.getAll().catch(() => ({ success: false, sites: [] }))
      ]);

      return {
        reports: reportsRes.reports || [],
        // guards: guardsRes.guards || [],
        incidents: incidentsRes.incidents || [],
        shifts: shiftsRes.shifts || [],
        vaultDocuments: vaultRes.documents || [],
        sites: sitesRes.sites || []
      };
    } catch (error) {
      console.error('Sync error:', error);
      return {
        reports: [],
        incidents: [],
        shifts: [],
        vaultDocuments: [],
        sites: []
      };
    }
  },
};