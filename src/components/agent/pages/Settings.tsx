import React from 'react';
import { PageHeader } from '../../ui/PageHeader';
import { Card } from '../../ui/Card';

export function Settings() {
  return (
    <div className="page-container">
      <PageHeader
        title="Settings"
        description="Agent configuration"
      />
      <Card>
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <p className="text-muted">Settings page coming soon...</p>
        </div>
      </Card>
    </div>
  );
}
