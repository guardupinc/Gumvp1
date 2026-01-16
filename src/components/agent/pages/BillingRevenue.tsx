import React from 'react';
import { PageHeader } from '../../ui/PageHeader';
import { Card } from '../../ui/Card';

export function BillingRevenue() {
  return (
    <div className="page-container">
      <PageHeader
        title="Billing & Revenue"
        description="Financial overview and revenue analytics"
      />
      <Card>
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <p className="text-muted">Billing & Revenue page coming soon...</p>
        </div>
      </Card>
    </div>
  );
}
