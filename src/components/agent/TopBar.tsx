import React from 'react';
import { Menu, Bell, Search, AlertTriangle, ChevronLeft } from 'lucide-react';
import type { AgentPageId } from './AgentPortal';

interface TopBarProps {
  currentPage: AgentPageId;
  onToggleSidebar: () => void;
  userRole: string;
  breakGlassActive?: boolean;
  sidebarCollapsed?: boolean;
}

const pageLabels: Record<AgentPageId, string> = {
  'overview': 'Overview',
  'tenants': 'Tenants',
  'billing-revenue': 'Billing & Revenue',
  'platform-health': 'Platform Health',
  'security-audit': 'Security & Audit Logs',
  'support-requests': 'Support Access Requests',
  'settings': 'Settings',
};

export function TopBar({ currentPage, onToggleSidebar, userRole, breakGlassActive = false, sidebarCollapsed }: TopBarProps) {
  return (
    <>
      {/* Break-glass active banner */}
      {breakGlassActive && (
        <div 
          className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold"
          style={{
            background: 'linear-gradient(90deg, rgba(239, 68, 68, 0.15) 0%, rgba(239, 68, 68, 0.25) 100%)',
            borderBottom: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#FCA5A5'
          }}
        >
          <AlertTriangle size={16} />
          <span>BREAK-GLASS ACCESS ACTIVE - All actions are being logged</span>
        </div>
      )}
      
      <header className="topbar">
        <div className="topbar-left">
          <button 
            className="menu-toggle" 
            onClick={onToggleSidebar}
            aria-label="Toggle sidebar"
          >
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <h1 className="page-title">{pageLabels[currentPage]}</h1>
            <span 
              className="px-2 py-0.5 text-[10px] font-bold tracking-wider rounded"
              style={{
                background: 'rgba(255, 122, 24, 0.15)',
                color: 'var(--accent)',
                border: '1px solid rgba(255, 122, 24, 0.3)'
              }}
            >
              INTERNAL
            </span>
          </div>
        </div>

        <div className="topbar-right">
          <div className="search-container">
            <Search size={16} className="search-icon" />
            <input 
              type="text" 
              placeholder="Search tenants..." 
              className="search-input"
            />
          </div>
          
          <button className="icon-button notification-button" aria-label="Notifications">
            <Bell size={20} />
            <span className="notification-badge">3</span>
          </button>

          <div className="user-menu">
            <div className="user-avatar">
              <span>AG</span>
            </div>
            <span className="user-role">{userRole}</span>
          </div>
        </div>
      </header>
    </>
  );
}