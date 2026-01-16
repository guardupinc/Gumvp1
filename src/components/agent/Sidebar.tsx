import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Building2,
  DollarSign,
  Activity,
  Shield,
  Headphones,
  Settings as SettingsIcon,
  X,
  ChevronLeft,
  LogOut
} from 'lucide-react';
import type { AgentPageId } from './AgentPortal';

interface NavItem {
  id: AgentPageId;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

const navItems: NavItem[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'tenants', label: 'Tenants', icon: Building2 },
  { id: 'billing-revenue', label: 'Billing & Revenue', icon: DollarSign },
  { id: 'platform-health', label: 'Platform Health', icon: Activity },
  { id: 'security-audit', label: 'Security & Audit Logs', icon: Shield },
  { id: 'support-requests', label: 'Support Access Requests', icon: Headphones },
  { id: 'settings', label: 'Settings', icon: SettingsIcon },
];

interface SidebarProps {
  currentPage: AgentPageId;
  onNavigate: (page: AgentPageId) => void;
  collapsed: boolean;
  open: boolean;
  onClose: () => void;
  onLogout: () => void;
  onToggle?: () => void;
}

export function Sidebar({ currentPage, onNavigate, collapsed, open, onClose, onLogout, onToggle }: SidebarProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleNavigate = (pageId: AgentPageId) => {
    onNavigate(pageId);
    if (isMobile) {
      onClose();
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isMobile && open && (
        <div className="sidebar-overlay" onClick={onClose} />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${collapsed ? 'collapsed' : 'expanded'} ${open ? 'mobile-open' : ''}`}>
        {/* Header */}
        <div className="sidebar-header">
          <div className="sidebar-header-content">
            <div className="sidebar-logo">
              <Shield size={24} className="logo-icon" />
              {!collapsed && <span className="logo-text">Guard Up</span>}
              {collapsed && <span className="logo-text-collapsed">GU</span>}
            </div>
            {isMobile && (
              <button className="sidebar-close" onClick={onClose} aria-label="Close sidebar">
                <X size={20} />
              </button>
            )}
          </div>
          {/* Desktop Collapse Arrow - only show when sidebar is EXPANDED */}
          {!isMobile && !collapsed && onToggle && (
            <button 
              className="sidebar-collapse-arrow"
              onClick={onToggle}
              aria-label="Collapse sidebar"
              title="Collapse sidebar"
            >
              <ChevronLeft size={16} />
            </button>
          )}
          {!collapsed && (
            <div className="sidebar-badge">Internal Admin</div>
          )}
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <SidebarNavItem
              key={item.id}
              item={item}
              active={currentPage === item.id}
              collapsed={collapsed}
              onClick={() => handleNavigate(item.id)}
            />
          ))}
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          <LogoutButton collapsed={collapsed} onLogout={onLogout} />
        </div>
      </aside>
    </>
  );
}

interface SidebarNavItemProps {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
  onClick: () => void;
}

function SidebarNavItem({ item, active, collapsed, onClick }: SidebarNavItemProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const Icon = item.icon;

  return (
    <div
      className="nav-item-wrapper"
      onMouseEnter={() => collapsed && setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <button
        className={`nav-item ${active ? 'active' : ''}`}
        onClick={onClick}
        title={collapsed ? item.label : ''}
      >
        <Icon size={20} className="nav-icon" />
        {!collapsed && <span className="nav-label">{item.label}</span>}
      </button>
      {collapsed && showTooltip && (
        <div className="nav-tooltip">{item.label}</div>
      )}
    </div>
  );
}

interface LogoutButtonProps {
  collapsed: boolean;
  onLogout: () => void;
}

function LogoutButton({ collapsed, onLogout }: LogoutButtonProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div
      className="nav-item-wrapper"
      onMouseEnter={() => collapsed && setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <button 
        className="nav-item logout-button" 
        onClick={onLogout}
        title={collapsed ? 'Logout' : ''}
      >
        <LogOut size={20} className="nav-icon" />
        {!collapsed && <span className="nav-label">Logout</span>}
      </button>
      {collapsed && showTooltip && (
        <div className="nav-tooltip">Logout</div>
      )}
    </div>
  );
}