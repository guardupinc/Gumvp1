import React from 'react';
import { PageHeader } from '../../ui/PageHeader';
import { Card } from '../../ui/Card';

export function PlatformHealth() {
  return (
    <div className="page-container">
      <PageHeader
        title="Platform Health"
        description="System status and performance monitoring"
      />
      <Card>
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <p className="text-muted">Platform Health page coming soon...</p>
        </div>
      </Card>
    </div>
  );
}
