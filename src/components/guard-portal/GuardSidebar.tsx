import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Calendar, 
  Radio,
  FileText, 
  BarChart3,
  CreditCard,
  FolderOpen,
  Settings as SettingsIcon,
  X,
  ChevronLeft,
  LogOut,
  Shield,
  ChevronDown
} from 'lucide-react';
import type { GuardPageId } from './GuardPortal';

interface NavItem {
  id: GuardPageId | 'guard-matrix';
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  children?: NavItem[];
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { 
    id: 'guard-matrix', 
    label: 'Guard Matrix', 
    icon: Shield,
    children: [
      { id: 'my-schedule', label: 'My Schedule', icon: Calendar },
      { id: 'patrol-ops', label: 'Operations', icon: Radio },
      { id: 'my-reports', label: 'My Reports', icon: FileText },
      { id: 'my-metrics', label: 'My Metrics', icon: BarChart3 },
    ]
  },
  { id: 'my-guardcard', label: 'My GuardCard', icon: CreditCard },
  { id: 'guard-vault', label: 'Guard Vault', icon: FolderOpen },
  { id: 'settings', label: 'Settings', icon: SettingsIcon },
];

interface GuardSidebarProps {
  currentPage: GuardPageId;
  onNavigate: (page: GuardPageId) => void;
  collapsed: boolean;
  open: boolean;
  onClose: () => void;
  onToggle?: () => void;
  onLogout: () => void;
}

export function GuardSidebar({ currentPage, onNavigate, collapsed, open, onClose, onToggle, onLogout }: GuardSidebarProps) {
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

  const handleNavigate = (pageId: GuardPageId) => {
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
      </div>
      <nav className="sidebar-nav">
        {navItems.map((item) => (
          item.children ? (
            <AccordionNavItem
              key={item.id}
              item={item}
              currentPage={currentPage}
              collapsed={collapsed && !isMobile}
              expanded={expandedAccordions.has(item.id)}
              onToggle={() => handleAccordionToggle(item.id)}
              onNavigate={handleNavigate}
            />
          ) : (
            <SidebarNavItem
              key={item.id}
              item={item as NavItem & { id: GuardPageId }}
              active={currentPage === item.id}
              collapsed={collapsed && !isMobile}
              onClick={() => handleNavigate(item.id as GuardPageId)}
            />
          )
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

interface AccordionNavItemProps {
  item: NavItem;
  currentPage: GuardPageId;
  collapsed: boolean;
  expanded: boolean;
  onToggle: () => void;
  onNavigate: (page: GuardPageId) => void;
}

function AccordionNavItem({ item, currentPage, collapsed, expanded, onToggle, onNavigate }: AccordionNavItemProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const Icon = item.icon;
  const hasActiveChild = item.children?.some(child => child.id === currentPage);

  return (
    <div className="nav-accordion">
      <div
        className="nav-item-wrapper"
        onMouseEnter={() => collapsed && setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <button
          className={`nav-item accordion-header ${hasActiveChild ? 'has-active-child' : ''}`}
          onClick={onToggle}
          aria-label={item.label}
          aria-expanded={expanded}
        >
          <span className="nav-icon">
            <Icon size={20} />
          </span>
          {!collapsed && (
            <>
              <span className="nav-label">{item.label}</span>
              <ChevronDown 
                size={16} 
                className={`accordion-chevron ${expanded ? 'expanded' : ''}`}
              />
            </>
          )}
        </button>
        {collapsed && showTooltip && (
          <div className="nav-tooltip">{item.label}</div>
        )}
      </div>
      {!collapsed && expanded && item.children && (
        <div className="nav-children">
          {item.children.map((child) => (
            <SidebarNavItem
              key={child.id}
              item={child as NavItem & { id: GuardPageId }}
              active={currentPage === child.id}
              collapsed={false}
              onClick={() => onNavigate(child.id as GuardPageId)}
              isChild
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface SidebarNavItemProps {
  item: NavItem & { id: GuardPageId };
  active: boolean;
  collapsed: boolean;
  onClick: () => void;
  isChild?: boolean;
}

function SidebarNavItem({ item, active, collapsed, onClick, isChild }: SidebarNavItemProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const Icon = item.icon;

  return (
    <div
      className="nav-item-wrapper"
      onMouseEnter={() => collapsed && setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <button
        className={`${isChild ? 'nav-item-child' : 'nav-item'} ${active ? 'active' : ''}`}
        onClick={onClick}
        aria-label={item.label}
        aria-current={active ? 'page' : undefined}
      >
        {active && !isChild && <span className="active-indicator" />}
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