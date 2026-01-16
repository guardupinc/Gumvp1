import React, { useState, useEffect } from 'react';
import { Building2, DollarSign, Activity, Shield, AlertTriangle, TrendingUp, Lock } from 'lucide-react';
import { PageHeader } from '../../ui/PageHeader';
import { Card } from '../../ui/Card';
import { KPICard } from '../../ui/KPICard';
import { Table, Column } from '../../ui/Table';
import { BreakGlassModal } from '../modals/BreakGlassModal';
import { toast } from 'sonner';

interface RecentActivity {
  id: number;
  timestamp: string;
  tenant: string;
  action: string;
  performedBy: string;
}

interface TenantAlert {
  id: number;
  tenant: string;
  issue: string;
  severity: 'high' | 'medium' | 'low';
  iconType: 'dollar' | 'alert' | 'activity' | 'shield';
}

const recentActivities: RecentActivity[] = [
  { id: 1, timestamp: '2 min ago', tenant: 'Acme Corporation', action: 'Plan upgraded to Enterprise', performedBy: 'John Smith (Acme Admin)' },
  { id: 2, timestamp: '8 min ago', tenant: 'SecureGuard LLC', action: 'Invoice paid - $2,499', performedBy: 'Auto-payment' },
  { id: 3, timestamp: '15 min ago', tenant: 'Metro Security', action: 'Feature enabled: Advanced Analytics', performedBy: 'Sarah Johnson (Guard Up Support)' },
  { id: 4, timestamp: '23 min ago', tenant: 'Elite Protection', action: 'Access request approved', performedBy: 'Mike Chen (Guard Up Admin)' },
  { id: 5, timestamp: '1 hour ago', tenant: 'Summit Security', action: 'New user added (5 total)', performedBy: 'Admin Portal' },
  { id: 6, timestamp: '2 hours ago', tenant: 'Guardian Services', action: 'Vault document uploaded (147 MB)', performedBy: 'Lisa Martinez (Guardian Admin)' },
];

const tenantsNeedingAttention: TenantAlert[] = [
  { id: 1, tenant: 'Downtown Security Inc.', issue: 'Payment past due (14 days)', severity: 'high', iconType: 'dollar' },
  { id: 2, tenant: 'Nightwatch Services', issue: 'High error rate (12% API failures)', severity: 'high', iconType: 'alert' },
  { id: 3, tenant: 'Fortress Security Group', issue: 'Unusually high vault downloads (3,247 in 24h)', severity: 'medium', iconType: 'activity' },
  { id: 4, tenant: 'Sentinel Protection', issue: 'Expiring documents spike (89 expiring in 7 days)', severity: 'medium', iconType: 'alert' },
];

const activityColumns: Column<RecentActivity>[] = [
  {
    key: 'timestamp',
    header: 'Time',
    render: (row) => <span className="text-muted">{row.timestamp}</span>,
    width: '120px',
  },
  {
    key: 'tenant',
    header: 'Tenant',
    render: (row) => <span style={{ fontWeight: 500 }}>{row.tenant}</span>,
    width: '200px',
  },
  {
    key: 'action',
    header: 'Action',
    render: (row) => row.action,
  },
  {
    key: 'performedBy',
    header: 'Performed By',
    render: (row) => <span className="text-muted">{row.performedBy}</span>,
    hideOnMobile: true,
  },
];

interface OverviewProps {
  breakGlassActive: boolean;
  onBreakGlassChange: (active: boolean) => void;
}

export function Overview({ breakGlassActive, onBreakGlassChange }: OverviewProps) {
  const [showBreakGlass, setShowBreakGlass] = useState(false);
  const [breakGlassInfo, setBreakGlassInfo] = useState<{
    tenant: string;
    reason: string;
    activatedAt: number;
    expiresAt: number;
  } | null>(null);

  // Auto-expire break-glass access
  useEffect(() => {
    if (!breakGlassInfo) return;

    const checkExpiration = () => {
      if (Date.now() >= breakGlassInfo.expiresAt) {
        onBreakGlassChange(false);
        setBreakGlassInfo(null);
        toast.info('Break-glass access has expired', {
          description: `Access to ${breakGlassInfo.tenant} automatically revoked`
        });
      }
    };

    const interval = setInterval(checkExpiration, 1000);
    return () => clearInterval(interval);
  }, [breakGlassInfo, onBreakGlassChange]);

  const handleActivateBreakGlass = (tenant: string, reason: string, duration: number) => {
    const now = Date.now();
    const expiresAt = now + duration * 60 * 1000;
    
    setBreakGlassInfo({
      tenant,
      reason,
      activatedAt: now,
      expiresAt
    });
    
    onBreakGlassChange(true);
    
    // TODO: Log to audit trail via API
    console.log('Break-glass access activated:', {
      tenant,
      reason,
      duration,
      timestamp: new Date().toISOString()
    });
  };

  const handleDeactivateBreakGlass = () => {
    if (breakGlassInfo) {
      onBreakGlassChange(false);
      toast.success('Break-glass access manually revoked', {
        description: `Access to ${breakGlassInfo.tenant} ended early`
      });
      setBreakGlassInfo(null);
    }
  };

  const getRemainingTime = () => {
    if (!breakGlassInfo) return '';
    const remaining = Math.max(0, breakGlassInfo.expiresAt - Date.now());
    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="page-container">
      <PageHeader
        title="Internal Admin Portal"
        description="Internal operations, billing, security, and tenant oversight"
        actions={
          <div className="flex gap-2">
            {breakGlassActive && breakGlassInfo && (
              <div 
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium"
                style={{
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#FCA5A5'
                }}
              >
                <Lock size={14} />
                <span>Active: {breakGlassInfo.tenant}</span>
                <span className="text-xs opacity-75">({getRemainingTime()})</span>
              </div>
            )}
            <button 
              className={breakGlassActive ? "button-secondary" : "button-danger"}
              onClick={breakGlassActive ? handleDeactivateBreakGlass : () => setShowBreakGlass(true)}
            >
              <Lock size={16} />
              {breakGlassActive ? 'End Break-glass' : 'Break-glass Access'}
            </button>
          </div>
        }
      />

      {/* KPI Cards Grid */}
      <div className="kpi-grid">
        <KPICard
          title="Total Tenants"
          value="247"
          icon={<Building2 size={20} />}
          change={{ value: '+8 this month', trend: 'up' }}
          iconColor="blue"
        />
        <KPICard
          title="MRR / ARR"
          value="$847K"
          icon={<DollarSign size={20} />}
          change={{ value: '+12% MoM', trend: 'up' }}
          iconColor="green"
        />
        <KPICard
          title="Platform Status"
          value="Operational"
          icon={<Activity size={20} />}
          change={{ value: '99.98% uptime', trend: 'up' }}
          iconColor="green"
        />
        <KPICard
          title="Security Alerts"
          value="12"
          icon={<Shield size={20} />}
          change={{ value: '8 failed logins', trend: 'neutral' }}
          iconColor="amber"
        />
      </div>

      {/* Tenants Needing Attention */}
      <Card className="mt-6">
        <div className="card-header">
          <h3>Tenants Needing Attention</h3>
          <span className="text-muted">{tenantsNeedingAttention.length} items</span>
        </div>
        <div className="attention-list">
          {tenantsNeedingAttention.map((alert) => (
            <div key={alert.id} className={`attention-item severity-${alert.severity}`}>
              <div className="attention-icon">
                {alert.iconType === 'dollar' && <DollarSign size={18} />}
                {alert.iconType === 'alert' && <AlertTriangle size={18} />}
                {alert.iconType === 'activity' && <Activity size={18} />}
                {alert.iconType === 'shield' && <Shield size={18} />}
              </div>
              <div className="attention-content">
                <div className="attention-tenant">{alert.tenant}</div>
                <div className="attention-issue">{alert.issue}</div>
              </div>
              <span className={`status-badge ${alert.severity === 'high' ? 'expired' : alert.severity === 'medium' ? 'pending' : 'success'}`}>
                {alert.severity}
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* Recent Activity Table */}
      <Card className="mt-6">
        <div className="card-header">
          <h3>Recent Activity</h3>
        </div>
        <Table 
          columns={activityColumns} 
          data={recentActivities}
        />
      </Card>

      {showBreakGlass && (
        <BreakGlassModal 
          onClose={() => setShowBreakGlass(false)}
          onActivate={handleActivateBreakGlass}
        />
      )}
    </div>
  );
}
