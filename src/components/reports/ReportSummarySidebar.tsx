import React from 'react';
import { FileText, AlertTriangle, Wrench, UserX, ClipboardList, MoreHorizontal } from 'lucide-react';

interface ReportTypeCount {
  type: string;
  count: number;
  label: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

interface ReportSummarySidebarProps {
  pendingCounts: ReportTypeCount[];
  selectedType: string | null;
  onTypeClick: (type: string) => void;
}

export const ReportSummarySidebar: React.FC<ReportSummarySidebarProps> = ({
  pendingCounts,
  selectedType,
  onTypeClick
}) => {
  return (
    <div className="report-summary-sidebar">
      <div className="summary-header">
        <h3>Report Summary</h3>
        <p className="summary-subtext">Pending by type</p>
      </div>

      <div className="summary-cards">
        {pendingCounts.map((item) => (
          <button
            key={item.type}
            className={`summary-card ${selectedType === item.type ? 'active' : ''}`}
            onClick={() => onTypeClick(item.type)}
          >
            <div className="summary-card-icon" style={{ 
              background: item.bgColor,
              color: item.color 
            }}>
              {item.icon}
            </div>
            <div className="summary-card-content">
              <div className="summary-card-count">{item.count}</div>
              <div className="summary-card-label">{item.label}</div>
              <div className="summary-card-caption">Pending review</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
