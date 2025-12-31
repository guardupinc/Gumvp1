import React from 'react';
import { ShieldCheck, BadgeCheck, Lock, CheckCircle, Shield } from 'lucide-react';
import '../../incident-report-pdf.css';

interface IncidentReportPDFProps {
  report: {
    referenceId: string;
    type: 'DAR' | 'Incident';
    guardName: string;
    site: string;
    timestamp: string;
    content: string;
    incidentType?: string;
    clientName?: string;
  };
  evidencePhotos?: string[];
}

export function IncidentReportPDF({ report, evidencePhotos = [] }: IncidentReportPDFProps) {
  const generatedDate = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  // Check client context
  const isGlobalLogistics = report.clientName === 'Global Logistics';
  const isTechInnovations = report.clientName === 'Tech Innovations';

  // Completed tasks/patrols for the checklist - context-aware
  const completedTasks = isGlobalLogistics ? [
    { task: 'Gate A Locked', detail: 'Verified at 06:00, 14:00, 22:00', status: 'complete' },
    { task: 'Trailer Seals Verified', detail: '12 trailers, all seals intact', status: 'complete' },
    { task: 'Refrigeration Unit Check', detail: 'Temp: -18°C (compliant)', status: 'complete' },
    { task: 'Perimeter Fence Patrol', detail: 'No breaches detected', status: 'complete' }
  ] : isTechInnovations ? [
    { task: 'Server Room Access', detail: 'All entries authorized & logged', status: 'complete' },
    { task: 'Fire Panel Check', detail: 'Systems operational', status: 'complete' },
    { task: 'HVAC Inspection', detail: 'NOISE DETECTED', status: 'warning' },
    { task: 'Exit Paths', detail: 'Clear and unobstructed', status: 'complete' }
  ] : [
    { task: 'Perimeter Patrol (Main Campus)', detail: '09:00, 12:00, 15:00', status: 'complete' },
    { task: 'Building A Interior Check', detail: 'All levels secure', status: 'complete' },
    { task: 'Parking Structure B Patrol', detail: '47 vehicles, no issues', status: 'complete' },
    { task: 'Safety Hazard Inspection', detail: 'All clear', status: 'complete' },
    { task: 'Access Control Verification', detail: 'All entry points secured', status: 'complete' },
    { task: 'Fire Exit Inspection', detail: 'No obstructions found', status: 'complete' }
  ];

  // Team roster - context-aware
  const teamRoster = isGlobalLogistics ? (
    <>
      <div>Robert Brown (Lead)</div>
      <div>Lisa Wang (Gate)</div>
      <div>Mike Ross (Patrol)</div>
    </>
  ) : isTechInnovations ? (
    <>
      <div>David Lee (Roving)</div>
      <div>Sarah Chen (Supervisor)</div>
    </>
  ) : (
    <>
      <div>John Smith (Armed Lead)</div>
      <div>Maria Garcia (Patrol)</div>
      <div>David Lee (Perimeter)</div>
    </>
  );

  // Location display - context-aware
  const locationDisplay = isGlobalLogistics ? 'Distribution Center - Zone 4' : 
                          isTechInnovations ? 'HQ - Server Room B' : 
                          report.site;

  // Extract first 2-3 sentences from narrative for summary
  const getIncidentSummary = (content: string) => {
    const sentences = content.match(/[^.!?]+[.!?]+/g) || [];
    return sentences.slice(0, 3).join(' ').trim();
  };

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
            <h1 className="pdf-report-title">{report.referenceId}</h1>
            {report.clientName && <p className="pdf-client-name">Client: {report.clientName}</p>}
            <p className="pdf-generated-date">Generated: {generatedDate}</p>
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
              <div className="fact-value">{locationDisplay}</div>
            </div>
            <div className="fact-item">
              <div className="fact-label">On-Duty Team</div>
              <div className="fact-value fact-value-team">
                {teamRoster}
              </div>
            </div>
            <div className="fact-item">
              <div className="fact-label">Shift Date</div>
              <div className="fact-value">{report.timestamp}</div>
            </div>
            <div className="fact-item">
              <div className="fact-label">Status</div>
              <div className="fact-value">Completed</div>
            </div>
          </div>
        </div>

        {/* Patrol & Task Checklist */}
        <div className="pdf-section">
          <h2 className="pdf-section-title">Completed Patrols & Tasks</h2>
          <div className="pdf-checklist-grid">
            {completedTasks.map((item, index) => (
              <div key={index} className="checklist-item">
                <div className={`checklist-icon ${item.status === 'warning' ? 'checklist-icon-warning' : ''}`}>
                  {item.status === 'warning' ? '⚠' : '✓'}
                </div>
                <div className="checklist-content">
                  <div className="checklist-task">{item.task}</div>
                  <div className={`checklist-detail ${item.status === 'warning' ? 'checklist-detail-warning' : ''}`}>
                    {item.detail}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Conditional: Clean Sheet for Logistics, Maintenance Alert for Tech, Incident for others */}
        {isGlobalLogistics ? (
          <div className="pdf-section">
            <h2 className="pdf-section-title">Shift Summary</h2>
            <div className="clean-sheet-block">
              <div className="clean-sheet-header">
                <CheckCircle size={20} className="clean-sheet-icon" />
                <h3 className="clean-sheet-title">SHIFT SUMMARY</h3>
              </div>
              <div className="clean-sheet-content">
                All logistics protocols verified. No unauthorized vehicles or seal breaches detected.
              </div>
            </div>
          </div>
        ) : isTechInnovations ? (
          <div className="pdf-section">
            <h2 className="pdf-section-title">Maintenance Alerts</h2>
            
            <div className="maintenance-block">
              <h3 className="maintenance-title">Maintenance Alert #M-554</h3>
              <div className="maintenance-meta">
                <span className="maintenance-meta-item"><strong>Type:</strong> Facility Hazard</span>
                <span className="maintenance-meta-divider">|</span>
                <span className="maintenance-meta-item"><strong>Time:</strong> 02:15</span>
                <span className="maintenance-meta-divider">|</span>
                <span className="maintenance-meta-item"><strong>Location:</strong> Server Room B</span>
              </div>
              <div className="maintenance-summary">
                <strong>Summary:</strong> Officer Lee detected loud grinding noise from cooling unit 4. Facilities Manager notified via portal at 02:15.
              </div>
              
              {/* Maintenance Photo */}
              <div className="incident-evidence">
                <p className="evidence-label">Documentation:</p>
                <div className="incident-evidence-grid">
                  <div className="incident-evidence-item">
                    <img src="https://images.unsplash.com/photo-1759148414485-5f624fe9d1ea?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbmR1c3RyaWFsJTIwZ2VhciUyMG1hY2hpbmVyeXxlbnwxfHx8fDE3NjcxNTg4MjJ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral" alt="Cooling Unit" />
                    <p className="incident-evidence-caption">Cooling Unit 4 - Mechanical Issue</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="pdf-section">
            <h2 className="pdf-section-title">Reported Incidents</h2>
            
            <div className="incident-block">
              <h3 className="incident-title">Incident #IR-2024-1156</h3>
              <div className="incident-meta">
                <span className="incident-meta-item"><strong>Type:</strong> {report.incidentType || 'Security Breach'}</span>
                <span className="incident-meta-divider">|</span>
                <span className="incident-meta-item"><strong>Time:</strong> {report.timestamp}</span>
                <span className="incident-meta-divider">|</span>
                <span className="incident-meta-item"><strong>Location:</strong> {report.site}</span>
              </div>
              <div className="incident-summary">
                <strong>Summary:</strong> {getIncidentSummary(report.content)}
              </div>
              
              {/* Evidence Photos */}
              {evidencePhotos.length > 0 && (
                <div className="incident-evidence">
                  <p className="evidence-label">Evidence:</p>
                  <div className="incident-evidence-grid">
                    {evidencePhotos.slice(0, 2).map((photo, index) => (
                      <div key={index} className="incident-evidence-item">
                        <img src={photo} alt={`Evidence ${index + 1}`} />
                        <p className="incident-evidence-caption">Photo {index + 1}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Signature Footer - Banking Contract Style */}
        <div className="signature-footer">
          {/* Left Column - Security Officer */}
          <div className="signature-column">
            <div className="signature-role-title">
              {isTechInnovations ? 'ROVING SECURITY OFFICER' : 'UNARMED SECURITY GUARD'}
            </div>
            <div className="signature-printed-name">
              {isTechInnovations ? 'David Lee' : 'Maria Garcia'}
            </div>
            <div className="signature-badge signature-badge-green">
              <CheckCircle size={14} className="signature-badge-icon" />
              <span>Digitally Signed</span>
            </div>
          </div>

          {/* Right Column - Shift Supervisor */}
          <div className="signature-column">
            <div className="signature-role-title">
              {isTechInnovations ? 'OPERATIONS MANAGER' : 'SHIFT SUPERVISOR'}
            </div>
            <div className="signature-printed-name">
              {isTechInnovations ? 'James Wilson' : 'Sarah Chen'}
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