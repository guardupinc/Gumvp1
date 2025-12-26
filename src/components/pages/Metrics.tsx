import React, { useState } from 'react';
import { Download, Filter, ChevronDown, X, TrendingUp, AlertTriangle, CheckCircle, Clock, FileText, Users, MapPin, Shield } from 'lucide-react';
import { PageHeader } from '../ui/PageHeader';
import { Card } from '../ui/Card';
import { MetricKPICard } from '../ui/MetricKPICard';
import { MetricListCard } from '../ui/MetricListCard';
import { AlertItem, Alert } from '../ui/AlertItem';
import { ChartCard, BarChart, LineChart } from '../ui/ChartCard';
import '../../metrics.css';

type MetricTab = 'overview' | 'operations' | 'accountability' | 'incidents' | 'compliance' | 'scheduling' | 'documents' | 'client-experience' | 'marketplace';

const metricTabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'operations', label: 'Operations' },
  { id: 'accountability', label: 'Accountability' },
  { id: 'incidents', label: 'Incidents & Reports' },
  { id: 'compliance', label: 'Compliance' },
  { id: 'scheduling', label: 'Scheduling' },
  { id: 'documents', label: 'Documents' },
  { id: 'client-experience', label: 'Client Experience' },
  { id: 'marketplace', label: 'Marketplace Readiness' },
] as const;

// Sample data
const sampleAlerts: Alert[] = [
  { id: 1, severity: 'critical', title: 'Guard check-in overdue', context: 'John Smith - Building A (15 min late)', timestamp: '5 min ago', action: { label: 'Contact', onClick: () => {} } },
  { id: 2, severity: 'critical', title: 'Shift unfilled within 24h', context: 'Building C Night Shift - Tomorrow 10 PM', timestamp: '12 min ago', action: { label: 'Assign', onClick: () => {} } },
  { id: 3, severity: 'warning', title: 'License expires in 7 days', context: 'Maria Garcia - Security License', timestamp: '1 hour ago', action: { label: 'Remind', onClick: () => {} } },
  { id: 4, severity: 'warning', title: 'Incident report pending review', context: 'Building A - Minor incident (14 hours old)', timestamp: '14 hours ago', action: { label: 'Review', onClick: () => {} } },
  { id: 5, severity: 'info', title: 'Missing COI for client site', context: 'Building D - Insurance certificate', timestamp: '2 days ago', action: { label: 'Request', onClick: () => {} } },
];

const lateCheckIns = [
  { id: 1, title: 'John Smith', subtitle: 'Building A - Main Entrance', badge: { label: '15 min late', severity: 'warning' as const }, time: '8:15 AM' },
  { id: 2, title: 'David Lee', subtitle: 'Building C - Lobby', badge: { label: '8 min late', severity: 'warning' as const }, time: '4:08 PM' },
];

const noShows = [
  { id: 1, title: 'Robert Brown', subtitle: 'Building D - Loading Dock', badge: { label: 'No Show', severity: 'critical' as const }, time: '12:00 AM' },
];

const earlyCheckouts = [
  { id: 1, title: 'Lisa Wang', subtitle: 'Building B - Parking Lot', badge: { label: '20 min early', severity: 'warning' as const }, time: '11:40 PM' },
];

const complianceGapsData = [
  { label: 'License Expired', value: 3, color: '#ff6b6b' },
  { label: 'Training Missing', value: 7, color: '#FFB15C' },
  { label: 'Firearm Qual', value: 2, color: '#FFB15C' },
  { label: 'ID Expired', value: 1, color: '#ff6b6b' },
];

const siteComplianceData = [
  { label: 'Building A', value: 98 },
  { label: 'Building C', value: 95 },
  { label: 'Building B', value: 92 },
  { label: 'Building D', value: 88 },
  { label: 'Building E', value: 85 },
];

const trendData = [85, 87, 86, 90, 92, 91, 94, 95, 94, 96, 97, 98];

export function Metrics() {
  const [activeTab, setActiveTab] = useState<MetricTab>('overview');
  const [showFilters, setShowFilters] = useState(false);
  const [alertFilter, setAlertFilter] = useState<'all' | 'critical' | 'warning' | 'info'>('all');

  const filteredAlerts = sampleAlerts.filter(
    alert => alertFilter === 'all' || alert.severity === alertFilter
  );

  return (
    <div className="page-container metrics-page">
      <PageHeader
        title="Metrics"
        description="Live operations + compliance readiness"
      />

      {/* Global Filter Bar */}
      <div className="metrics-filter-bar">
        <div className="metrics-filter-actions">
          <button className="filter-button" onClick={() => setShowFilters(!showFilters)}>
            <Filter size={16} />
            <span>Filters</span>
            {showFilters && <ChevronDown size={14} className="rotate-180" />}
            {!showFilters && <ChevronDown size={14} />}
          </button>
          <div className="filter-pills">
            <span className="filter-pill active">
              Last 7 Days
              <button className="filter-pill-remove"><X size={12} /></button>
            </span>
            <span className="filter-pill">
              All Sites
              <button className="filter-pill-remove"><X size={12} /></button>
            </span>
          </div>
        </div>
        <button className="button-secondary">
          <Download size={16} />
          Export
        </button>
      </div>

      {showFilters && (
        <Card className="metrics-filter-panel">
          <div className="metrics-filter-grid">
            <div className="filter-group">
              <label>Date Range</label>
              <select className="filter-select" defaultValue="Last 7 Days">
                <option>Today</option>
                <option>Last 7 Days</option>
                <option>Last 30 Days</option>
                <option>Custom</option>
              </select>
            </div>
            <div className="filter-group">
              <label>Company</label>
              <select className="filter-select" defaultValue="All Companies">
                <option>All Companies</option>
                <option>ABC Security</option>
                <option>XYZ Guards</option>
              </select>
            </div>
            <div className="filter-group">
              <label>Client</label>
              <select className="filter-select" defaultValue="All Clients">
                <option>All Clients</option>
                <option>Client A</option>
                <option>Client B</option>
              </select>
            </div>
            <div className="filter-group">
              <label>Site</label>
              <select className="filter-select" defaultValue="All Sites">
                <option>All Sites</option>
                <option>Building A</option>
                <option>Building B</option>
              </select>
            </div>
            <div className="filter-group">
              <label>Region</label>
              <select className="filter-select" defaultValue="All Regions">
                <option>All Regions</option>
                <option>North</option>
                <option>South</option>
              </select>
            </div>
            <div className="filter-group">
              <label>Type</label>
              <div className="filter-toggle-group">
                <button className="filter-toggle active">All</button>
                <button className="filter-toggle">Armed</button>
                <button className="filter-toggle">Unarmed</button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Tab Navigation */}
      <div className="metrics-tabs">
        {metricTabs.map((tab) => (
          <button
            key={tab.id}
            className={`metrics-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id as MetricTab)}
          >
            {tab.label}
            {tab.id === 'marketplace' && (
              <span className="metrics-tab-badge">Coming Soon</span>
            )}
          </button>
        ))}
      </div>

      {/* Main Content Layout */}
      <div className="metrics-layout">
        {/* Main Content Area */}
        <div className="metrics-main">
          {activeTab === 'overview' && (
            <>
              {/* Operations Snapshot */}
              <div className="metrics-section">
                <h2 className="metrics-section-title">Today's Operations Snapshot</h2>
                <div className="metrics-kpi-grid">
                  <MetricKPICard
                    title="Active Jobs Right Now"
                    value="12"
                    subtext="Across 8 sites"
                    status="normal"
                    onClick={() => {}}
                  />
                  <MetricKPICard
                    title="Guards On Duty Now"
                    value="47"
                    delta={{ value: '+3 from yesterday', trend: 'up' }}
                    status="normal"
                    onClick={() => {}}
                  />
                  <MetricKPICard
                    title="Sites Covered"
                    value="18/20"
                    subtext="2 sites uncovered"
                    status="warning"
                    onClick={() => {}}
                  />
                  <MetricKPICard
                    title="Shifts Starting Soon"
                    value="8"
                    subtext="Next 2 hours: 3 | 6h: 5 | 24h: 8"
                    status="normal"
                    onClick={() => {}}
                  />
                </div>

                <div className="metrics-list-grid">
                  <MetricListCard
                    title="Late Check-ins"
                    count={2}
                    items={lateCheckIns}
                    emptyMessage="All guards checked in on time"
                    onViewItem={(id) => console.log('View', id)}
                  />
                  <MetricListCard
                    title="No-Show Flags"
                    count={1}
                    items={noShows}
                    emptyMessage="No no-shows today"
                    onViewItem={(id) => console.log('View', id)}
                  />
                  <MetricListCard
                    title="Early Check-outs"
                    count={1}
                    items={earlyCheckouts}
                    emptyMessage="No early check-outs"
                    onViewItem={(id) => console.log('View', id)}
                  />
                </div>

                <div className="metrics-single-kpi">
                  <MetricKPICard
                    title="Overtime Risk"
                    value="3"
                    subtext="Guards scheduled >48 hours in 7 days"
                    status="warning"
                    onClick={() => {}}
                  />
                </div>
              </div>

              {/* Guard Accountability */}
              <div className="metrics-section">
                <h2 className="metrics-section-title">Guard Accountability Metrics</h2>
                <div className="metrics-kpi-grid">
                  <MetricKPICard
                    title="On-time Check-in Rate"
                    value="94%"
                    delta={{ value: '+2% vs last week', trend: 'up' }}
                    sparklineData={[90, 91, 92, 91, 93, 94, 95]}
                    status="normal"
                    onClick={() => {}}
                  />
                  <MetricKPICard
                    title="Average Minutes Late"
                    value="12 min"
                    delta={{ value: '-3 min vs last week', trend: 'down' }}
                    subtext="For late check-ins only"
                    status="normal"
                    onClick={() => {}}
                  />
                  <MetricKPICard
                    title="Missed Check-ins"
                    value="3"
                    subtext="Last 7 days"
                    status="warning"
                    onClick={() => {}}
                  />
                  <MetricKPICard
                    title="Proof-of-Presence Events"
                    value="487"
                    subtext="Check-ins, checkpoints, acks"
                    delta={{ value: '+12% vs last week', trend: 'up' }}
                    status="normal"
                    onClick={() => {}}
                  />
                </div>

                <div className="metrics-chart-row">
                  <ChartCard
                    title="Check-in Compliance by Site"
                    subtitle="Ranked best to worst"
                  >
                    <BarChart data={siteComplianceData} />
                  </ChartCard>
                </div>
              </div>

              {/* Incident & Reporting */}
              <div className="metrics-section">
                <h2 className="metrics-section-title">Incident & Reporting Metrics</h2>
                <div className="metrics-kpi-grid">
                  <MetricKPICard
                    title="Open Incidents"
                    value="3"
                    status="warning"
                    onClick={() => {}}
                  />
                  <MetricKPICard
                    title="Incidents (7 days)"
                    value="8"
                    subtext="Today: 1 | Week: 8 | Month: 24"
                    status="normal"
                    onClick={() => {}}
                  />
                  <MetricKPICard
                    title="Reports Awaiting Review"
                    value="4"
                    subtext="Pending supervisor review"
                    status="warning"
                    onClick={() => {}}
                  />
                  <MetricKPICard
                    title="Client-Delivered Reports"
                    value="156"
                    delta={{ value: '+23 this week', trend: 'up' }}
                    status="normal"
                    onClick={() => {}}
                  />
                </div>
              </div>

              {/* Compliance Readiness - Highlighted Section */}
              <div className="metrics-section metrics-section-highlight">
                <div className="metrics-section-header-with-icon">
                  <Shield size={24} className="text-accent" />
                  <h2 className="metrics-section-title">Compliance Readiness</h2>
                </div>
                <div className="metrics-kpi-grid">
                  <MetricKPICard
                    title="Guards Fully Compliant"
                    value="92%"
                    delta={{ value: '+3% this month', trend: 'up' }}
                    subtext="43/47 eligible for assigned posts"
                    status="normal"
                    onClick={() => {}}
                  />
                  <MetricKPICard
                    title="Guards Expiring Soon"
                    value="5"
                    subtext="7 days: 2 | 30 days: 3 | 60 days: 5"
                    status="warning"
                    onClick={() => {}}
                  />
                  <MetricKPICard
                    title="Company Docs Expiring"
                    value="1"
                    subtext="COI, business license, etc."
                    status="warning"
                    onClick={() => {}}
                  />
                  <MetricKPICard
                    title="Bad Assignments Blocked"
                    value="12"
                    subtext="Prevented non-compliant assignments"
                    delta={{ value: 'Last 30 days', trend: 'neutral' }}
                    status="normal"
                    onClick={() => {}}
                  />
                </div>

                <div className="metrics-chart-row">
                  <ChartCard
                    title="Compliance Gaps by Type"
                    subtitle="Current non-compliant items"
                  >
                    <BarChart data={complianceGapsData} />
                  </ChartCard>
                </div>
              </div>

              {/* Scheduling Health */}
              <div className="metrics-section">
                <h2 className="metrics-section-title">Scheduling Health Metrics</h2>
                <div className="metrics-kpi-grid">
                  <MetricKPICard
                    title="Shifts Filled"
                    value="96%"
                    delta={{ value: '+2% vs last week', trend: 'up' }}
                    status="normal"
                    onClick={() => {}}
                  />
                  <MetricKPICard
                    title="Unfilled Shifts"
                    value="8"
                    subtext="Soonest: Tomorrow 6 AM"
                    status="warning"
                    onClick={() => {}}
                  />
                  <MetricKPICard
                    title="Last-Minute Fill Rate"
                    value="78%"
                    subtext="Filled within 12 hours"
                    delta={{ value: '+5% vs last week', trend: 'up' }}
                    status="normal"
                    onClick={() => {}}
                  />
                  <MetricKPICard
                    title="Cancellations"
                    value="4"
                    subtext="Last 7 days"
                    status="normal"
                    onClick={() => {}}
                  />
                </div>
              </div>

              {/* Document Vault */}
              <div className="metrics-section">
                <h2 className="metrics-section-title">Document Vault Metrics</h2>
                <div className="metrics-kpi-grid">
                  <MetricKPICard
                    title="Total Documents"
                    value="1,247"
                    delta={{ value: '+32 this week', trend: 'up' }}
                    status="normal"
                    onClick={() => {}}
                  />
                  <MetricKPICard
                    title="Documents Missing"
                    value="7"
                    subtext="Required docs not uploaded"
                    status="warning"
                    onClick={() => {}}
                  />
                  <MetricKPICard
                    title="Recent Uploads"
                    value="32"
                    subtext="Last 7 days"
                    status="normal"
                    onClick={() => {}}
                  />
                  <MetricKPICard
                    title="Audit Exports"
                    value="18"
                    subtext="Generated this month"
                    status="normal"
                    onClick={() => {}}
                  />
                </div>
              </div>

              {/* Client Experience */}
              <div className="metrics-section">
                <h2 className="metrics-section-title">Client Experience Metrics</h2>
                <div className="metrics-kpi-grid">
                  <MetricKPICard
                    title="Client Sites Active"
                    value="12"
                    delta={{ value: '+2 this month', trend: 'up' }}
                    status="normal"
                    onClick={() => {}}
                  />
                  <MetricKPICard
                    title="Client Satisfaction"
                    value="4.7/5"
                    subtext="Based on 24 ratings"
                    delta={{ value: '+0.3 vs last month', trend: 'up' }}
                    status="normal"
                    onClick={() => {}}
                  />
                  <MetricKPICard
                    title="Response Time"
                    value="2.4 hrs"
                    subtext="Avg time to acknowledge"
                    delta={{ value: '-0.8 hrs vs last week', trend: 'down' }}
                    status="normal"
                    onClick={() => {}}
                  />
                  <MetricKPICard
                    title="Disputes Open"
                    value="1"
                    status="warning"
                    onClick={() => {}}
                  />
                </div>
              </div>

              {/* Marketplace Readiness */}
              <div className="metrics-section metrics-section-prep">
                <div className="metrics-section-header-with-badge">
                  <h2 className="metrics-section-title">Marketplace Readiness (GuardNexus Prep)</h2>
                  <span className="metrics-prep-badge">Coming Soon</span>
                </div>
                <div className="metrics-kpi-grid">
                  <MetricKPICard
                    title="Eligible Provider Coverage"
                    value="6/120"
                    subtext="Companies / Guards in Newark area"
                    status="normal"
                    onClick={() => {}}
                  />
                  <MetricKPICard
                    title="Fill Capacity"
                    value="87%"
                    subtext="Available vs upcoming demand"
                    status="normal"
                    onClick={() => {}}
                  />
                  <MetricKPICard
                    title="Acceptance Speed"
                    value="4.2 min"
                    subtext="Avg time to accept job request"
                    status="normal"
                    onClick={() => {}}
                  />
                  <MetricKPICard
                    title="Provider Quality Score"
                    value="94/100"
                    subtext="On-time, completion, compliance"
                    delta={{ value: '+2 this month', trend: 'up' }}
                    status="normal"
                    onClick={() => {}}
                  />
                </div>
              </div>
            </>
          )}

          {activeTab !== 'overview' && (
            <Card className="empty-state-card">
              <div className="empty-state">
                <div className="empty-state-icon">
                  <TrendingUp size={32} />
                </div>
                <h3 className="empty-state-title">{metricTabs.find(t => t.id === activeTab)?.label}</h3>
                <p className="empty-state-description">
                  Detailed metrics for this section are being built. The Overview tab contains a comprehensive summary of all metrics.
                </p>
              </div>
            </Card>
          )}
        </div>

        {/* Alerts / Action Center - Right Rail */}
        <div className="metrics-sidebar">
          <div className="alerts-action-center">
            <div className="alerts-header">
              <div className="alerts-title-group">
                <AlertTriangle size={20} className="text-accent" />
                <h3>Alerts / Action Center</h3>
              </div>
              <span className="alerts-count">{filteredAlerts.length}</span>
            </div>

            <div className="alerts-filter-tabs">
              <button
                className={`alerts-filter-tab ${alertFilter === 'all' ? 'active' : ''}`}
                onClick={() => setAlertFilter('all')}
              >
                All
              </button>
              <button
                className={`alerts-filter-tab ${alertFilter === 'critical' ? 'active' : ''}`}
                onClick={() => setAlertFilter('critical')}
              >
                Critical
              </button>
              <button
                className={`alerts-filter-tab ${alertFilter === 'warning' ? 'active' : ''}`}
                onClick={() => setAlertFilter('warning')}
              >
                Warning
              </button>
              <button
                className={`alerts-filter-tab ${alertFilter === 'info' ? 'active' : ''}`}
                onClick={() => setAlertFilter('info')}
              >
                Info
              </button>
            </div>

            <div className="alerts-list-container">
              {filteredAlerts.map((alert) => (
                <AlertItem key={alert.id} alert={alert} />
              ))}
            </div>

            <button className="alerts-view-all">View All Alerts</button>
          </div>

          {/* At a Glance KPIs */}
          <Card className="glance-kpis-card">
            <h3 className="glance-kpis-title">At a Glance</h3>
            <div className="glance-kpis-list">
              <div className="glance-kpi-item">
                <div className="glance-kpi-icon success">
                  <CheckCircle size={16} />
                </div>
                <div className="glance-kpi-content">
                  <span className="glance-kpi-value">98%</span>
                  <span className="glance-kpi-label">Compliance Rate</span>
                </div>
              </div>
              <div className="glance-kpi-item">
                <div className="glance-kpi-icon normal">
                  <Users size={16} />
                </div>
                <div className="glance-kpi-content">
                  <span className="glance-kpi-value">47</span>
                  <span className="glance-kpi-label">Active Guards</span>
                </div>
              </div>
              <div className="glance-kpi-item">
                <div className="glance-kpi-icon warning">
                  <Clock size={16} />
                </div>
                <div className="glance-kpi-content">
                  <span className="glance-kpi-value">8</span>
                  <span className="glance-kpi-label">Unfilled Shifts</span>
                </div>
              </div>
              <div className="glance-kpi-item">
                <div className="glance-kpi-icon success">
                  <FileText size={16} />
                </div>
                <div className="glance-kpi-content">
                  <span className="glance-kpi-value">1,247</span>
                  <span className="glance-kpi-label">Documents</span>
                </div>
              </div>
            </div>
          </Card>

          <div className="metrics-last-updated">
            <Clock size={12} />
            <span>Updated 2 min ago</span>
          </div>
        </div>
      </div>
    </div>
  );
}