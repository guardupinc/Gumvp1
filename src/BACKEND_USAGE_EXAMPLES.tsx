// ============================================================================
// BACKEND USAGE EXAMPLES
// ============================================================================
// This file contains example code snippets showing how to integrate the
// backend API into various Guard Up components.

import React, { useState, useEffect } from 'react';
import { api } from './utils/api';
import { useAuth } from './hooks/useAuth';

// ============================================================================
// EXAMPLE 1: Authentication Component
// ============================================================================

export function LoginExample() {
  const { signIn, loading, error } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const result = await signIn(email, password);
      
      if (result.success) {
        console.log('Logged in as:', result.user.name);
        console.log('Role:', result.user.role);
        // Navigate to dashboard or appropriate portal
      }
    } catch (err) {
      console.error('Login failed:', err);
    }
  };

  return (
    <form onSubmit={handleLogin}>
      <input 
        type="email" 
        value={email} 
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
      />
      <input 
        type="password" 
        value={password} 
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        required
      />
      <button type="submit" disabled={loading}>
        {loading ? 'Signing in...' : 'Sign In'}
      </button>
      {error && <div className="error">{error}</div>}
    </form>
  );
}

// ============================================================================
// EXAMPLE 2: Workforce Management - Fetch Guards
// ============================================================================

export function GuardsListExample() {
  const [guards, setGuards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchGuards();
  }, []);

  const fetchGuards = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.getAllGuards();
      
      if (response.success) {
        setGuards(response.guards);
      } else {
        setError(response.error || 'Failed to fetch guards');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch guards');
      console.error('Fetch guards error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading guards...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>Guards ({guards.length})</h2>
      <button onClick={fetchGuards}>Refresh</button>
      
      {guards.map((guard) => (
        <div key={guard.id}>
          <h3>{guard.name}</h3>
          <p>Badge: {guard.badgeId}</p>
          <p>Status: {guard.status}</p>
          <p>Site: {guard.location}</p>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// EXAMPLE 3: Create New Guard
// ============================================================================

export function CreateGuardExample() {
  const [formData, setFormData] = useState({
    name: '',
    badgeId: '',
    email: '',
    phone: '',
    role: 'Guard',
    status: 'active',
    location: 'Building A',
    shiftsThisWeek: 0,
    hoursThisWeek: 0
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      const response = await api.createGuard(formData);
      
      if (response.success) {
        console.log('Guard created:', response.guard);
        alert(`Guard ${response.guard.name} created successfully!`);
        // Reset form or navigate
      } else {
        alert(`Error: ${response.error}`);
      }
    } catch (err: any) {
      console.error('Create guard error:', err);
      alert(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Name"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        required
      />
      <input
        type="text"
        placeholder="Badge ID"
        value={formData.badgeId}
        onChange={(e) => setFormData({ ...formData, badgeId: e.target.value })}
        required
      />
      <input
        type="email"
        placeholder="Email"
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        required
      />
      <button type="submit" disabled={loading}>
        {loading ? 'Creating...' : 'Create Guard'}
      </button>
    </form>
  );
}

// ============================================================================
// EXAMPLE 4: Reports - Fetch and Display
// ============================================================================

export function ReportsListExample() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      
      const response = await api.getAllReports();
      
      if (response.success) {
        // Reports are automatically filtered by role on the backend
        setReports(response.reports);
      }
    } catch (err) {
      console.error('Fetch reports error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (reportId: number) => {
    try {
      const clientName = prompt('Enter client name (optional):');
      
      const response = await api.approveReport(reportId, clientName || undefined);
      
      if (response.success) {
        alert('Report approved successfully!');
        fetchReports(); // Refresh list
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleReject = async (reportId: number) => {
    try {
      const reason = prompt('Enter rejection reason:');
      
      if (!reason) return;
      
      const response = await api.rejectReport(reportId, reason);
      
      if (response.success) {
        alert('Report rejected');
        fetchReports();
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  if (loading) return <div>Loading reports...</div>;

  return (
    <div>
      <h2>Reports ({reports.length})</h2>
      
      {reports.map((report) => (
        <div key={report.id}>
          <h3>{report.reportCode}</h3>
          <p>Type: {report.type}</p>
          <p>Guard: {report.guardName}</p>
          <p>Site: {report.site}</p>
          <p>Status: {report.status}</p>
          
          {report.status === 'pending' && (
            <div>
              <button onClick={() => handleApprove(report.id)}>
                Approve
              </button>
              <button onClick={() => handleReject(report.id)}>
                Reject
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// EXAMPLE 5: Create Report
// ============================================================================

export function CreateReportExample() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      const reportData = {
        reportCode: 'IR-2026-1', // Generate this properly
        type: 'Incident',
        reportType: 'incident',
        priority: 'high',
        guardName: user?.name || 'Unknown',
        site: 'Building A',
        content: 'Security breach at main entrance',
        location: 'Main Entrance',
        incidentType: 'security-breach',
        urgency: 'high'
      };
      
      const response = await api.createReport(reportData);
      
      if (response.success) {
        alert('Report submitted successfully!');
        console.log('Report created:', response.report);
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Submit Incident Report</h2>
      {/* Add your form fields here */}
      <button type="submit" disabled={loading}>
        {loading ? 'Submitting...' : 'Submit Report'}
      </button>
    </form>
  );
}

// ============================================================================
// EXAMPLE 6: Scheduling - Create Shift
// ============================================================================

export function CreateShiftExample() {
  const [loading, setLoading] = useState(false);

  const handleCreateShift = async () => {
    try {
      setLoading(true);
      
      const shiftData = {
        guardId: 1,
        guardName: 'John Smith',
        dayOfWeek: 'Monday',
        date: 'Jan 13, 2026',
        startTime: '08:00 AM',
        endTime: '04:00 PM',
        site: 'Building A',
        hours: 8,
        instructions: 'Main entrance patrol'
      };
      
      const response = await api.createShift(shiftData);
      
      if (response.success) {
        alert('Shift created successfully!');
        console.log('Shift:', response.shift);
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button onClick={handleCreateShift} disabled={loading}>
        {loading ? 'Creating...' : 'Create Shift'}
      </button>
    </div>
  );
}

// ============================================================================
// EXAMPLE 7: File Upload
// ============================================================================

export function FileUploadExample() {
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      
      const response = await api.uploadFile(file, 'incident-photos');
      
      if (response.success) {
        setUploadedUrl(response.file.url);
        alert('File uploaded successfully!');
        console.log('File URL:', response.file.url);
      }
    } catch (err: any) {
      alert(`Upload error: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <input 
        type="file" 
        onChange={handleFileUpload}
        disabled={uploading}
      />
      
      {uploading && <p>Uploading...</p>}
      
      {uploadedUrl && (
        <div>
          <p>File uploaded successfully!</p>
          <img src={uploadedUrl} alt="Uploaded" style={{ maxWidth: '300px' }} />
        </div>
      )}
    </div>
  );
}

// ============================================================================
// EXAMPLE 8: Clock In/Out
// ============================================================================

export function ClockInOutExample() {
  const { user } = useAuth();
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleClockIn = async () => {
    if (!user?.guardId) return;

    try {
      setLoading(true);
      
      const response = await api.clockInGuard(
        user.guardId,
        'Building A',
        'Main Entrance'
      );
      
      if (response.success) {
        setIsClockedIn(true);
        alert('Clocked in successfully!');
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleClockOut = async () => {
    if (!user?.guardId) return;

    try {
      setLoading(true);
      
      const response = await api.clockOutGuard(user.guardId);
      
      if (response.success) {
        setIsClockedIn(false);
        alert('Clocked out successfully!');
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {!isClockedIn ? (
        <button onClick={handleClockIn} disabled={loading}>
          {loading ? 'Clocking in...' : 'Clock In'}
        </button>
      ) : (
        <button onClick={handleClockOut} disabled={loading}>
          {loading ? 'Clocking out...' : 'Clock Out'}
        </button>
      )}
    </div>
  );
}

// ============================================================================
// EXAMPLE 9: Dashboard Metrics
// ============================================================================

export function DashboardMetricsExample() {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      
      const response = await api.getDashboardMetrics();
      
      if (response.success) {
        setMetrics(response.metrics);
      }
    } catch (err) {
      console.error('Fetch metrics error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading metrics...</div>;
  if (!metrics) return <div>No metrics available</div>;

  return (
    <div>
      <h2>Dashboard Metrics</h2>
      <div>Total Guards: {metrics.totalGuards}</div>
      <div>Active Guards: {metrics.activeGuards}</div>
      <div>Total Reports: {metrics.totalReports}</div>
      <div>Pending Reports: {metrics.pendingReports}</div>
      <div>Open Incidents: {metrics.openIncidents}</div>
      <div>Upcoming Shifts: {metrics.upcomingShifts}</div>
    </div>
  );
}

// ============================================================================
// EXAMPLE 10: Protected Route Component
// ============================================================================

export function ProtectedRoute({ 
  children, 
  requiredRole 
}: { 
  children: React.ReactNode; 
  requiredRole?: string;
}) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <div>Please sign in to access this page</div>;
  }

  if (requiredRole && user.role !== requiredRole) {
    return <div>You do not have permission to access this page</div>;
  }

  return <>{children}</>;
}

// Usage:
// <ProtectedRoute requiredRole="SECURITY_ADMIN">
//   <AdminDashboard />
// </ProtectedRoute>
