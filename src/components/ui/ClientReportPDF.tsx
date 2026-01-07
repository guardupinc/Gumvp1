import React from 'react';
import { CheckCircle, AlertTriangle, Wrench, Shield } from 'lucide-react';
import '../../incident-report-pdf.css';

interface Report {
  id: number;
  referenceId: string;
  caseId?: string;
  type: 'DAR' | 'Incident' | 'Maintenance';
  priority: 'normal' | 'high';
  guardName: string;
  site: string;
  timestamp: string;
  content: string;
  status: 'pending' | 'approved' | 'rejected' | 'sent';
  location?: string;
  attachments?: Array<{ id: number; url: string; name: string }>;
  date?: string;
  time?: string;
  incidentType?: string;
  urgency?: string;
  policeCalled?: string;
  narrativeOnly?: string;
  actionTaken?: string;
  pdCaseNumber?: string;
  shiftStart?: string;
  shiftEnd?: string;
  reliefGuard?: string;
  equipmentStatus?: string;
  maintenanceCategory?: string;
  specificArea?: string;
  assetId?: string;
}

interface ClientPackage {
  id: number;
  clientName: string;
  siteName: string;
  reportCount: number;
  reports: {
    type: string;
    id: string;
    status: 'ready' | 'pending';
  }[];
}

interface ClientReportPDFProps {
  package: ClientPackage;
  allReports: Report[];
}

export function ClientReportPDF({ package: pkg, allReports }: ClientReportPDFProps) {
  const generatedDate = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  // Get actual Report objects from allReports based on package report IDs
  const packageReportIds = pkg.reports.map(r => r.id);
  const packageReports = allReports.filter(r => packageReportIds.includes(r.referenceId));

  // Extract unique guard names from all reports
  const uniqueGuardNames = [...new Set(packageReports.map(r => r.guardName))];

  // Filter reports by type
  const darReports = packageReports.filter(r => r.type === 'DAR');
  const incidentReports = packageReports.filter(r => r.type === 'Incident');
  const maintenanceReports = packageReports.filter(r => r.type === 'Maintenance');

  // Get supervisor name from context (hardcoded for now)
  const supervisorName = 'Sarah Chen';

  return (
    <div className="pdf-container">
      <div className="pdf-page">
        {/* Header Section */}
        <div className="pdf-header">
          <div className="pdf-logo-placeholder">
            <div className="logo-box">
              <span>CLIENT</span>
              <span>LOGO</span>
            </div>
          </div>
          <div className="pdf-title-block">
            <h1 className="pdf-report-title">Daily Shift Summary</h1>
            <p className="pdf-client-name">Client: {pkg.siteName}</p>
            <p className="pdf-generated-date">Report Date: {generatedDate}</p>
          </div>
        </div>

        {/* Separator Line */}
        <div className="pdf-separator"></div>

        {/* Service Overview */}
        <div className="pdf-section">
          <h2 className="pdf-section-title">Service Overview</h2>
          <div className="pdf-facts-grid">
            <div className="fact-item">
              <div className="fact-label">Location</div>
              <div className="fact-value">{pkg.siteName}</div>
            </div>
            <div className="fact-item">
              <div className="fact-label">On-Duty Team</div>
              <div className="fact-value fact-value-team">
                {uniqueGuardNames.map((name, idx) => (
                  <div key={idx}>{name}</div>
                ))}
              </div>
            </div>
            <div className="fact-item">
              <div className="fact-label">Date</div>
              <div className="fact-value">{generatedDate}</div>
            </div>
            <div className="fact-item">
              <div className="fact-label">Total Reports</div>
              <div className="fact-value">{packageReports.length}</div>
            </div>
          </div>
        </div>

        {/* Daily Activity Logs */}
        {darReports.length > 0 && (
          <div className="pdf-section">
            <h2 className="pdf-section-title">Daily Activity Logs</h2>
            {darReports.map((report, index) => (
              <div key={index} className="activity-log-block">
                <h3 className="activity-log-title">
                  {report.referenceId} - {report.guardName}
                </h3>
                <div className="activity-log-meta">
                  {report.shiftStart && report.shiftEnd && (
                    <>
                      <span className="activity-meta-item">
                        <strong>Shift:</strong> {report.shiftStart} - {report.shiftEnd}
                      </span>
                      <span className="activity-meta-divider">|</span>
                    </>
                  )}
                  <span className="activity-meta-item">
                    <strong>Location:</strong> {report.site}
                  </span>
                </div>
                
                <div className="activity-summary">
                  <strong>Activity Summary:</strong>
                  <p className="activity-narrative">{report.content}</p>
                </div>

                {report.equipmentStatus && (
                  <div className="equipment-status">
                    <strong>Equipment Status:</strong> {report.equipmentStatus}
                  </div>
                )}

                {report.reliefGuard && (
                  <div className="relief-guard">
                    <strong>Relief Guard:</strong> {report.reliefGuard}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Reported Incidents */}
        {incidentReports.length > 0 && (
          <div className="pdf-section">
            <h2 className="pdf-section-title">Reported Incidents</h2>
            {incidentReports.map((report, index) => (
              <div key={index} className="incident-block">
                <h3 className="incident-title">
                  {report.referenceId}
                </h3>
                <div className="incident-meta">
                  <span className="incident-meta-item">
                    <strong>Type:</strong> {report.incidentType || 'General Incident'}
                  </span>
                  <span className="incident-meta-divider">|</span>
                  <span className="incident-meta-item">
                    <strong>Urgency:</strong> {report.urgency || report.priority}
                  </span>
                  {report.time && (
                    <>
                      <span className="incident-meta-divider">|</span>
                      <span className="incident-meta-item">
                        <strong>Time:</strong> {report.time}
                      </span>
                    </>
                  )}
                </div>

                <div className="incident-summary">
                  <strong>Details:</strong>
                  <p className="incident-narrative">{report.content}</p>
                </div>

                {report.actionTaken && (
                  <div className="action-taken">
                    <strong>Action Taken:</strong>
                    <p className="action-taken-text">{report.actionTaken}</p>
                  </div>
                )}

                {report.policeCalled === 'yes' && report.pdCaseNumber && (
                  <div className="police-info">
                    <AlertTriangle size={16} className="police-icon" />
                    <strong>Police Case #:</strong> {report.pdCaseNumber}
                  </div>
                )}

                {report.location && (
                  <div className="incident-location">
                    <strong>Location:</strong> {report.location}
                  </div>
                )}

                {/* Evidence Photos */}
                {report.attachments && report.attachments.length > 0 && (
                  <div className="incident-evidence">
                    <p className="evidence-label">Evidence:</p>
                    <div className="incident-evidence-grid">
                      {report.attachments.slice(0, 2).map((attachment, idx) => (
                        <div key={idx} className="incident-evidence-item">
                          <img src={attachment.url} alt={attachment.name} />
                          <p className="incident-evidence-caption">{attachment.name}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Maintenance Requests */}
        {maintenanceReports.length > 0 && (
          <div className="pdf-section">
            <h2 className="pdf-section-title">Maintenance Requests</h2>
            {maintenanceReports.map((report, index) => (
              <div key={index} className="maintenance-block">
                <h3 className="maintenance-title">
                  {report.referenceId}
                </h3>
                <div className="maintenance-meta">
                  <span className="maintenance-meta-item">
                    <strong>Category:</strong> {report.maintenanceCategory || 'General'}
                  </span>
                  <span className="maintenance-meta-divider">|</span>
                  <span className="maintenance-meta-item">
                    <strong>Priority:</strong> {report.priority}
                  </span>
                  {report.specificArea && (
                    <>
                      <span className="maintenance-meta-divider">|</span>
                      <span className="maintenance-meta-item">
                        <strong>Area:</strong> {report.specificArea}
                      </span>
                    </>
                  )}
                </div>

                <div className="maintenance-summary">
                  <strong>Issue Description:</strong>
                  <p className="maintenance-narrative">{report.content}</p>
                </div>

                {report.assetId && (
                  <div className="asset-id">
                    <strong>Asset ID:</strong> {report.assetId}
                  </div>
                )}

                {/* Documentation Photos */}
                {report.attachments && report.attachments.length > 0 && (
                  <div className="incident-evidence">
                    <p className="evidence-label">Documentation:</p>
                    <div className="incident-evidence-grid">
                      {report.attachments.slice(0, 2).map((attachment, idx) => (
                        <div key={idx} className="incident-evidence-item">
                          <img src={attachment.url} alt={attachment.name} />
                          <p className="incident-evidence-caption">{attachment.name}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Signature Footer */}
        <div className="signature-footer">
          {/* Left Column - Security Officer */}
          <div className="signature-column">
            <div className="signature-role-title">
              SECURITY OFFICER
            </div>
            <div className="signature-printed-name">
              {uniqueGuardNames.length > 0 ? uniqueGuardNames[0] : 'Security Team'}
            </div>
            <div className="signature-badge signature-badge-green">
              <CheckCircle size={14} className="signature-badge-icon" />
              <span>Digitally Signed</span>
            </div>
          </div>

          {/* Right Column - Supervisor */}
          <div className="signature-column">
            <div className="signature-role-title">
              SUPERVISOR
            </div>
            <div className="signature-printed-name">
              {supervisorName}
            </div>
            <div className="signature-badge signature-badge-blue">
              <Shield size={14} className="signature-badge-icon" />
              <span>Digitally Authorized</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
