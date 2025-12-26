import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Calendar, 
  ClipboardCheck, 
  FileText, 
  FolderOpen,
  X,
  ChevronLeft,
  LogOut
} from 'lucide-react';
import type { GuardPageId } from './GuardPortal';

interface NavItem {
  id: GuardPageId;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'my-schedule', label: 'My Schedule', icon: Calendar },
  { id: 'active-shift', label: 'Active Shift', icon: ClipboardCheck },
  { id: 'reports', label: 'My Reports', icon: FileText },
  { id: 'my-documents', label: 'My Documents', icon: FolderOpen },
];

interface GuardSidebarProps {
  currentPage: GuardPageId;
  onNavigate: (page: GuardPageId) => void;
  collapsed: boolean;
  open: boolean;
  onClose: () => void;
  onLogout: () => void;
}

export function GuardSidebar({ currentPage, onNavigate, collapsed, open, onClose, onLogout }: GuardSidebarProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleNavigate = (pageId: GuardPageId) => {
    onNavigate(pageId);
    if (isMobile) {
      onClose();
    }
  };

  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    if (isMobile && open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobile, open]);

  const sidebarContent = (
    <>
      <div className="sidebar-header">
        <div className="sidebar-logo">
          {(!collapsed || isMobile) && <span className="logo-text">Guard Up</span>}
          {collapsed && !isMobile && <span className="logo-icon">GU</span>}
        </div>
        {isMobile && (
          <button className="close-button" onClick={onClose} aria-label="Close menu">
            <X size={20} />
          </button>
        )}
        {!isMobile && !collapsed && (
          <button 
            className="close-button collapse-button" 
            onClick={onClose} 
            aria-label="Collapse sidebar"
            title="Collapse sidebar"
          >
            <ChevronLeft size={20} />
          </button>
        )}
      </div>
      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <SidebarNavItem
            key={item.id}
            item={item}
            active={currentPage === item.id}
            collapsed={collapsed && !isMobile}
            onClick={() => handleNavigate(item.id)}
          />
        ))}
      </nav>
      <div className="sidebar-footer">
        <button 
          className="sidebar-logout-button"
          onClick={onLogout}
          title="Switch Portal"
        >
          <LogOut size={20} />
          {(!collapsed || isMobile) && <span>Switch Portal</span>}
        </button>
      </div>
    </>
  );

  if (isMobile) {
    return (
      <>
        {open && <div className="sidebar-overlay" onClick={onClose} />}
        <aside className={`sidebar mobile ${open ? 'open' : ''}`}>
          {sidebarContent}
        </aside>
      </>
    );
  }

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : 'expanded'}`}>
      {sidebarContent}
    </aside>
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
        aria-label={item.label}
        aria-current={active ? 'page' : undefined}
      >
        {active && <span className="active-indicator" />}
        <span className="nav-icon">
          <Icon size={20} />
        </span>
        {!collapsed && <span className="nav-label">{item.label}</span>}
      </button>
      {collapsed && showTooltip && (
        <div className="nav-tooltip">{item.label}</div>
      )}
    </div>
  );
}
