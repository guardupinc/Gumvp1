import React from 'react';
import { PageHeader } from '../../ui/PageHeader';
import { Card } from '../../ui/Card';

export function SupportAccessRequests() {
  return (
    <div className="page-container">
      <PageHeader
        title="Support Access Requests"
        description="Manage customer support escalations"
      />
      <Card>
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <p className="text-muted">Support Access Requests page coming soon...</p>
        </div>
      </Card>
    </div>
  );
}
