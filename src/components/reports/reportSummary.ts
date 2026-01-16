import { FileText, AlertTriangle, Wrench, UserX, ClipboardList, MoreHorizontal } from 'lucide-react';
import React from 'react';

export interface ReportTypeCount {
  type: string;
  count: number;
  label: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

interface Report {
  id: string;
  type: string;
  status: string;
}

const REPORT_TYPE_CONFIG: Record<string, Omit<ReportTypeCount, 'count' | 'type'>> = {
  'Incident': {
    label: 'Incident Reports',
    icon: React.createElement(AlertTriangle, { size: 20 }),
    color: '#EF4444',
    bgColor: 'rgba(239, 68, 68, 0.12)'
  },
  'DAR': {
    label: 'Daily Activity Reports',
    icon: React.createElement(FileText, { size: 20 }),
    color: '#3B82F6',
    bgColor: 'rgba(59, 130, 246, 0.12)'
  },
  'Maintenance': {
    label: 'Maintenance Reports',
    icon: React.createElement(Wrench, { size: 20 }),
    color: '#F59E0B',
    bgColor: 'rgba(245, 158, 11, 0.12)'
  },
  'Disciplinary': {
    label: 'Disciplinary Reports',
    icon: React.createElement(UserX, { size: 20 }),
    color: '#A855F7',
    bgColor: 'rgba(168, 85, 247, 0.12)'
  },
  'Shift Pass-On': {
    label: 'Shift Pass-On Logs',
    icon: React.createElement(ClipboardList, { size: 20 }),
    color: '#10B981',
    bgColor: 'rgba(16, 185, 129, 0.12)'
  }
};

export function calculatePendingCounts(reports: Report[]): ReportTypeCount[] {
  // Filter to pending reports only
  const pendingReports = reports.filter(r => r.status === 'pending');
  
  // Count by type
  const counts: Record<string, number> = {};
  const otherTypes: Set<string> = new Set();
  
  pendingReports.forEach(report => {
    const type = report.type;
    
    if (REPORT_TYPE_CONFIG[type]) {
      counts[type] = (counts[type] || 0) + 1;
    } else {
      // Unknown type goes to "Other"
      counts['Other'] = (counts['Other'] || 0) + 1;
      otherTypes.add(type);
    }
  });
  
  // Build result array in preferred order
  const result: ReportTypeCount[] = [];
  const orderedTypes = ['Incident', 'DAR', 'Maintenance', 'Disciplinary', 'Shift Pass-On'];
  
  orderedTypes.forEach(type => {
    if (counts[type] && counts[type] > 0) {
      result.push({
        type,
        count: counts[type],
        ...REPORT_TYPE_CONFIG[type]
      });
    }
  });
  
  // Add "Other" at the end if there are unknown types
  if (counts['Other'] && counts['Other'] > 0) {
    result.push({
      type: 'Other',
      count: counts['Other'],
      label: 'Other Reports',
      icon: React.createElement(MoreHorizontal, { size: 20 }),
      color: '#6B7280',
      bgColor: 'rgba(107, 114, 128, 0.12)'
    });
  }
  
  return result;
}

export function normalizeReportType(type: string): string {
  // Normalize variations to canonical types
  const normalized = type.toLowerCase().trim();
  
  if (normalized.includes('incident')) return 'Incident';
  if (normalized.includes('dar') || normalized.includes('daily')) return 'DAR';
  if (normalized.includes('maintenance') || normalized.includes('maint')) return 'Maintenance';
  if (normalized.includes('disciplinary') || normalized.includes('disc')) return 'Disciplinary';
  if (normalized.includes('shift') || normalized.includes('pass')) return 'Shift Pass-On';
  
  return type; // Return original if no match
}
