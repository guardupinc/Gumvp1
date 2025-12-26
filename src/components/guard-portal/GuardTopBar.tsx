import React, { useState, useRef, useEffect } from 'react';
import { Menu, Search, Bell, ChevronDown, User, LogOut } from 'lucide-react';
import type { GuardPageId } from './GuardPortal';

const pageTitles: Record<GuardPageId, string> = {
  'dashboard': 'Dashboard',
  'my-schedule': 'My Schedule',
  'active-shift': 'Active Shift',
  'reports': 'My Reports',
  'my-documents': 'My Documents',
};

interface GuardTopBarProps {
  currentPage: GuardPageId;
  onToggleSidebar: () => void;
  userRole: string;
}

export function GuardTopBar({ currentPage, onToggleSidebar, userRole }: GuardTopBarProps) {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setUserMenuOpen(false);
        setNotificationsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button 
          className="icon-button hamburger"
          onClick={onToggleSidebar}
          aria-label="Toggle sidebar"
        >
          <Menu size={20} />
        </button>
        <h2 className="topbar-title">{pageTitles[currentPage]}</h2>
      </div>

      <div className="topbar-right">
        <div className="search-container">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search..."
            className="search-input"
            aria-label="Search"
          />
        </div>

        <div className="notifications-wrapper" ref={notificationsRef}>
          <button
            className="icon-button notifications"
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            aria-label="Notifications"
          >
            <Bell size={20} />
            <span className="notification-badge">2</span>
          </button>
          {notificationsOpen && (
            <div className="dropdown notifications-dropdown">
              <div className="dropdown-header">
                <h3>Notifications</h3>
              </div>
              <div className="notification-list">
                <div className="notification-item">
                  <div className="notification-dot" />
                  <div className="notification-content">
                    <p className="notification-title">Shift reminder: Tomorrow 8:00 AM</p>
                    <p className="notification-time">2 hours ago</p>
                  </div>
                </div>
                <div className="notification-item">
                  <div className="notification-dot" />
                  <div className="notification-content">
                    <p className="notification-title">Document requires your signature</p>
                    <p className="notification-time">1 day ago</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="user-menu-wrapper" ref={userMenuRef}>
          <button
            className="user-menu-button"
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            aria-label="User menu"
            aria-expanded={userMenuOpen}
          >
            <div className="user-avatar">
              <User size={16} />
            </div>
            <div className="user-info-desktop">
              <span className="user-name">John Smith</span>
              <span className="user-role">{userRole}</span>
            </div>
            <ChevronDown size={16} className={`chevron ${userMenuOpen ? 'open' : ''}`} />
          </button>
          {userMenuOpen && (
            <div className="dropdown user-dropdown">
              <button className="dropdown-item">
                <User size={16} />
                <span>My Profile</span>
              </button>
              <div className="dropdown-divider" />
              <button className="dropdown-item logout">
                <LogOut size={16} />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
