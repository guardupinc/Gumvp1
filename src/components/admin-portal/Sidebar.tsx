import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Calendar, 
  BarChart3, 
  Users, 
  FolderLock, 
  Settings as SettingsIcon,
  X,
  ChevronLeft,
  LogOut,
  Shield,
  Radio,
  FileText,
  UserCog,
  CreditCard,
  ChevronDown,
  Wallet,
  Zap
} from 'lucide-react';
import type { AdminPageId } from './AdminPortal';

interface NavItem {
  id: AdminPageId | 'guard-matrix';
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  children?: NavItem[];
  comingSoon?: boolean;
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { 
    id: 'guard-matrix', 
    label: 'Guard Matrix', 
    icon: Shield,
    children: [
      { id: 'scheduling', label: 'Scheduling', icon: Calendar },
      { id: 'operations', label: 'Operations', icon: Radio },
      { id: 'reports', label: 'Reports', icon: FileText },
      { id: 'metrics', label: 'Metrics', icon: BarChart3 },
      { id: 'workforce-management', label: 'Workforce Management', icon: Users },
      { id: 'hr', label: 'HR', icon: UserCog },
      { id: 'billing', label: 'Billing', icon: CreditCard },
    ]
  },
  { id: 'vault', label: 'Guard Vault', icon: FolderLock },
  { id: 'guard-card', label: 'Guard Card', icon: Wallet, comingSoon: true },
  { id: 'guard-nexus', label: 'Guard Nexus', icon: Zap, comingSoon: true },
  { id: 'settings', label: 'Settings', icon: SettingsIcon },
];

interface SidebarProps {
  currentPage: AdminPageId;
  onNavigate: (page: AdminPageId) => void;
  collapsed: boolean;
  open: boolean;
  onClose: () => void;
  onLogout: () => void;
  onToggle?: () => void;
}

export function Sidebar({ currentPage, onNavigate, collapsed, open, onClose, onLogout, onToggle }: SidebarProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [expandedAccordions, setExpandedAccordions] = useState<Set<string>>(new Set(['guard-matrix']));

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Auto-expand Guard Matrix accordion if current page is a child
  useEffect(() => {
    const guardMatrixItem = navItems.find(item => item.id === 'guard-matrix');
    if (guardMatrixItem?.children) {
      const isChildActive = guardMatrixItem.children.some(child => child.id === currentPage);
      if (isChildActive) {
        setExpandedAccordions(prev => new Set([...prev, 'guard-matrix']));
      }
    }
  }, [currentPage]);

  const handleNavigate = (pageId: AdminPageId) => {
    onNavigate(pageId);
    if (isMobile) {
      onClose();
    }
  };

  const handleAccordionToggle = (itemId: string) => {
    // If sidebar is collapsed, expand it first
    if (collapsed && !isMobile && onToggle) {
      onToggle();
      // Open the accordion after expanding
      setTimeout(() => {
        setExpandedAccordions(prev => {
          const newSet = new Set(prev);
          newSet.add(itemId);
          return newSet;
        });
      }, 50);
    } else {
      // Toggle accordion
      setExpandedAccordions(prev => {
        const newSet = new Set(prev);
        if (newSet.has(itemId)) {
          newSet.delete(itemId);
        } else {
          newSet.add(itemId);
        }
        return newSet;
      });
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
            activeChild={item.children?.some(child => child.id === currentPage)}
            collapsed={collapsed && !isMobile}
            expanded={expandedAccordions.has(item.id)}
            onToggle={() => handleAccordionToggle(item.id)}
            onClick={(pageId) => handleNavigate(pageId as AdminPageId)}
            currentPage={currentPage}
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
  activeChild?: boolean;
  collapsed: boolean;
  expanded?: boolean;
  onToggle?: () => void;
  onClick: (id: string) => void;
  currentPage: AdminPageId;
}

function SidebarNavItem({ item, active, activeChild, collapsed, expanded, onToggle, onClick, currentPage }: SidebarNavItemProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const Icon = item.icon;
  const hasChildren = item.children && item.children.length > 0;

  const handleClick = () => {
    if (hasChildren) {
      onToggle?.();
    } else if (!item.comingSoon) {
      onClick(item.id);
    }
  };

  return (
    <div className="nav-item-wrapper">
      <div
        onMouseEnter={() => collapsed && setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <button
          className={`nav-item ${active ? 'active' : ''} ${activeChild ? 'active-parent' : ''} ${hasChildren ? 'nav-item-parent' : ''} ${item.comingSoon ? 'nav-item-coming-soon' : ''}`}
          onClick={handleClick}
          aria-label={item.label}
          aria-current={active ? 'page' : undefined}
          aria-expanded={hasChildren ? expanded : undefined}
          disabled={item.comingSoon}
        >
          {active && <span className="active-indicator" />}
          <span className="nav-icon">
            <Icon size={20} />
          </span>
          {!collapsed && (
            <>
              <span className="nav-label">{item.label}</span>
              {item.comingSoon && (
                <span className="coming-soon-badge">Soon</span>
              )}
            </>
          )}
          {!collapsed && hasChildren && (
            <span className={`nav-chevron ${expanded ? 'expanded' : ''}`}>
              <ChevronDown size={16} />
            </span>
          )}
        </button>
        {collapsed && showTooltip && (
          <div className="nav-tooltip">
            {item.label}
            {item.comingSoon && <span className="text-muted text-xs ml-1">(Soon)</span>}
          </div>
        )}
      </div>

      {/* Child Items */}
      {hasChildren && !collapsed && expanded && (
        <div className="nav-children">
          {item.children!.map((child) => (
            <button
              key={child.id}
              className={`nav-item nav-item-child ${currentPage === child.id ? 'active' : ''}`}
              onClick={() => onClick(child.id)}
              aria-label={child.label}
              aria-current={currentPage === child.id ? 'page' : undefined}
            >
              {currentPage === child.id && <span className="active-indicator" />}
              <span className="nav-icon">
                <child.icon size={18} />
              </span>
              <span className="nav-label">{child.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}