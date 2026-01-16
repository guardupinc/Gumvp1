import React from 'react';

interface PageHeaderProps {
  title: string;
  description: string;
  primaryAction?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
    dropdownContent?: React.ReactNode;  // New: optional dropdown content
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
}

export function PageHeader({ title, description, primaryAction, secondaryAction }: PageHeaderProps) {
  return (
    <div className="page-header">
      <div className="page-header-content">
        <h1>{title}</h1>
        <p className="page-description">{description}</p>
      </div>
      {(primaryAction || secondaryAction) && (
        <div className="page-header-actions">
          {secondaryAction && (
            <button className="button-secondary" onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </button>
          )}
          {primaryAction && (
            <div style={{ position: 'relative' }}>
              <button className="button-primary" onClick={primaryAction.onClick}>
                {primaryAction.icon}
                {primaryAction.label}
              </button>
              {primaryAction.dropdownContent}
            </div>
          )}
        </div>
      )}
    </div>
  );
}