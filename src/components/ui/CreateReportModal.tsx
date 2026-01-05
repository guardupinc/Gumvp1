import React, { useState, useEffect, useRef } from 'react';
import { X, AlertTriangle, Calendar, Clock, Upload, Search } from 'lucide-react';

interface CreateReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportType: 'incident' | 'dar' | 'maintenance' | 'disciplinary' | 'shift-passon';
  officerName: string;
  caseId?: string;  // Auto-generated Case ID (e.g., "#IR-2026-8492")
  onSubmit: (data: { 
    content: string; 
    site: string; 
    priority: 'normal' | 'high';
    location?: string;
    attachments?: Array<{ id: number; url: string; name: string }>;
    time?: string;
    incidentType?: string;
    urgency?: string;
    policeCalled?: string;
    narrativeOnly?: string;
    // DAR-specific fields
    date?: string;
    shiftStart?: string;
    shiftEnd?: string;
    reliefGuard?: string;
    equipmentStatus?: string;
    // Maintenance-specific fields
    maintenanceDate?: string;
    maintenanceTime?: string;
    maintenanceCategory?: string;
    specificArea?: string;
    assetId?: string;
  }) => void;
}

export function CreateReportModal({ isOpen, onClose, reportType, officerName, caseId, onSubmit }: CreateReportModalProps) {
  // State for incident report form
  const [incidentDate, setIncidentDate] = useState('');
  const [incidentTime, setIncidentTime] = useState('');
  const [incidentType, setIncidentType] = useState('');
  const [urgency, setUrgency] = useState('High');
  const [narrative, setNarrative] = useState('');
  const [actionTaken, setActionTaken] = useState(''); // New field for IR
  const [policeCalled, setPoliceCalled] = useState(false); // Changed default from true to false
  const [caseNumber, setCaseNumber] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  
  // State for DAR-specific fields
  const [shiftStartTime, setShiftStartTime] = useState('');
  const [shiftEndTime, setShiftEndTime] = useState('');
  const [shiftType, setShiftType] = useState('');
  const [reliefGuard, setReliefGuard] = useState('');
  const [equipmentStatus, setEquipmentStatus] = useState('');
  
  // State for Maintenance-specific fields
  const [maintenanceDate, setMaintenanceDate] = useState('');
  const [maintenanceTime, setMaintenanceTime] = useState('');
  const [maintenanceCategory, setMaintenanceCategory] = useState('');
  const [specificArea, setSpecificArea] = useState('');
  const [assetId, setAssetId] = useState('');
  
  // Location searchable dropdown state
  const [location, setLocation] = useState('');
  const [locationSearch, setLocationSearch] = useState('');
  const [isLocationDropdownOpen, setIsLocationDropdownOpen] = useState(false);
  const locationDropdownRef = useRef<HTMLDivElement>(null);

  // State for other report types
  const [site, setSite] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState<'normal' | 'high'>('normal');

  // Auto-fill date and time when modal opens
  useEffect(() => {
    if (isOpen) {
      const now = new Date();
      if (reportType === 'incident') {
        setIncidentDate(now.toISOString().split('T')[0]); // YYYY-MM-DD
        setIncidentTime(now.toTimeString().slice(0, 5)); // HH:MM
      } else if (reportType === 'dar') {
        setIncidentDate(now.toISOString().split('T')[0]); // YYYY-MM-DD for DAR
        // Default shift times based on current time
        const currentHour = now.getHours();
        if (currentHour >= 6 && currentHour < 14) {
          setShiftType('Day');
          setShiftStartTime('06:00');
          setShiftEndTime('14:00');
        } else if (currentHour >= 14 && currentHour < 22) {
          setShiftType('Swing');
          setShiftStartTime('14:00');
          setShiftEndTime('22:00');
        } else {
          setShiftType('Night');
          setShiftStartTime('22:00');
          setShiftEndTime('06:00');
        }
        setEquipmentStatus('All Accounted For');
      } else if (reportType === 'maintenance') {
        setMaintenanceDate(now.toISOString().split('T')[0]); // YYYY-MM-DD
        setMaintenanceTime(now.toTimeString().slice(0, 5)); // HH:MM
      }
    }
  }, [isOpen, reportType]);

  if (!isOpen) return null;

  const getReportTitle = () => {
    switch (reportType) {
      case 'incident':
        return 'Incident Report (IR)';
      case 'dar':
        return 'Daily Activity Report (DAR)';
      case 'maintenance':
        return 'Maintenance Request';
      case 'disciplinary':
        return 'Disciplinary Form';
      case 'shift-passon':
        return 'Shift Pass-On Log';
      default:
        return 'New Report';
    }
  };

  const getReportIcon = () => {
    switch (reportType) {
      case 'incident':
        return '⚠️';
      case 'dar':
        return '📋';
      case 'maintenance':
        return '🛠️';
      case 'disciplinary':
        return '👮';
      case 'shift-passon':
        return '📝';
      default:
        return '📄';
    }
  };

  const handleIncidentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!incidentDate || !incidentTime || !incidentType || !narrative) {
      return;
    }
    
    // Pass structured data - NO concatenation
    onSubmit({ 
      content: narrative, // Use pure narrative only for backwards compatibility
      site: location || 'Unknown Location',
      priority: urgency === 'Critical' ? 'high' : 'normal',
      location: location || 'Unknown Location',
      attachments: attachments.map((file, index) => ({ id: index, url: URL.createObjectURL(file), name: file.name })),
      date: incidentDate,              // Date of Incident (e.g., "2026-01-04")
      time: incidentTime,
      incidentType: incidentType,
      urgency: urgency,
      policeCalled: policeCalled ? 'Yes' : 'No',
      narrativeOnly: narrative
    });
    
    // Reset form
    resetIncidentForm();
    onClose();
  };

  const handleStandardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!site || !content) {
      return;
    }
    onSubmit({ content, site, priority });
    // Reset form
    setSite('');
    setContent('');
    setPriority('normal');
    onClose();
  };

  const resetIncidentForm = () => {
    setIncidentDate('');
    setIncidentTime('');
    setIncidentType('');
    setUrgency('High');
    setNarrative('');
    setActionTaken(''); // Reset action taken
    setPoliceCalled(false); // Reset to false
    setCaseNumber('');
    setAttachments([]);
    setLocation('');
    setLocationSearch('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments(prev => [...prev, ...Array.from(e.target.files || [])]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files) {
      setAttachments(prev => [...prev, ...Array.from(e.dataTransfer.files)]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  // Handle location dropdown
  const handleLocationSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocationSearch(e.target.value);
    setIsLocationDropdownOpen(true); // Open dropdown when typing
  };

  const handleLocationSelect = (loc: string) => {
    setLocation(loc);
    setLocationSearch(loc); // Show selected location in the input
    setIsLocationDropdownOpen(false);
  };

  const handleLocationInputFocus = () => {
    setIsLocationDropdownOpen(true); // Open dropdown on focus
  };

  const handleLocationDropdownBlur = () => {
    setTimeout(() => {
      setIsLocationDropdownOpen(false);
    }, 200);
  };

  const locationOptions = [
    'Building A - Main Entrance',
    'Building B - Reception Area',
    'Building C - Conference Room',
    'Building D - Storage Area',
    'Building E - Office Suite',
    'Building F - Kitchen',
    'Building G - Gym',
    'Building H - Library',
    'Building I - Auditorium',
    'Building J - Cafeteria',
    'Building K - Workshop',
    'Building L - Laboratory',
    'Building M - Medical Center',
    'Building N - Security Room',
    'Building O - Maintenance Room',
    'Building P - Archive Room',
    'Building Q - Training Room',
    'Building R - Research Lab',
    'Building S - Data Center',
    'Building T - Server Room',
    'Building U - IT Support Room',
    'Building V - Customer Service Room',
    'Building W - Sales Room',
    'Building X - Marketing Room',
    'Building Y - Human Resources Room',
    'Building Z - Finance Room'
  ];

  const filteredLocationOptions = locationOptions.filter(loc =>
    loc.toLowerCase().includes(locationSearch.toLowerCase())
  );

  // Render comprehensive incident report form
  if (reportType === 'incident') {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="create-report-modal incident-form-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <div className="modal-title-with-icon">
              <span className="report-type-emoji">{getReportIcon()}</span>
              <h2>{getReportTitle()}</h2>
            </div>
            <button className="modal-close-btn" onClick={onClose}>
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleIncidentSubmit} className="modal-body incident-form-body">
            {/* HEADER: Reporting Officer & Case ID (Read-only) */}
            <div className="form-section header-context-section">
              <div className="form-row-2col">
                <div className="form-group-incident">
                  <label htmlFor="reporting-officer" className="form-label-incident">
                    Reporting Officer
                  </label>
                  <input
                    type="text"
                    id="reporting-officer"
                    value={officerName}
                    disabled
                    className="form-input-incident form-input-disabled"
                  />
                </div>
                <div className="form-group-incident">
                  <label htmlFor="case-id" className="form-label-incident">
                    Incident Case ID
                  </label>
                  <input
                    type="text"
                    id="case-id"
                    value={caseId || 'Generating...'}
                    disabled
                    className="form-input-incident form-input-disabled"
                    style={{ backgroundColor: '#1a2332', color: '#6b7280', fontWeight: '500' }}
                  />
                </div>
              </div>
            </div>

            {/* SECTION: Location (Full Width) */}
            <div className="form-section">
              <div className="form-group-incident">
                <label htmlFor="location" className="form-label-incident">
                  Location
                </label>
                <div className="searchable-dropdown" ref={locationDropdownRef}>
                  <input
                    type="text"
                    id="location"
                    value={locationSearch}
                    onChange={handleLocationSearchChange}
                    placeholder="Search for site..."
                    className="form-input-incident"
                    onFocus={handleLocationInputFocus}
                    onBlur={handleLocationDropdownBlur}
                  />
                  <button type="button" className="dropdown-toggle">
                    <Search size={16} />
                  </button>
                  {isLocationDropdownOpen && (
                    <div className="dropdown-menu">
                      {filteredLocationOptions.map(loc => (
                        <div key={loc} className="dropdown-item" onClick={() => handleLocationSelect(loc)}>
                          {loc}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* SECTION 1: Timeline (2 columns) */}
            <div className="form-section">
              <div className="form-row-2col">
                <div className="form-group-incident">
                  <label htmlFor="incident-date" className="form-label-incident">
                    <Calendar size={16} className="label-icon-incident" />
                    Date of Incident
                  </label>
                  <input
                    type="date"
                    id="incident-date"
                    value={incidentDate}
                    onChange={(e) => setIncidentDate(e.target.value)}
                    className="form-input-incident"
                    required
                  />
                </div>
                <div className="form-group-incident">
                  <label htmlFor="incident-time" className="form-label-incident">
                    <Clock size={16} className="label-icon-incident" />
                    Time of Incident
                  </label>
                  <input
                    type="time"
                    id="incident-time"
                    value={incidentTime}
                    onChange={(e) => setIncidentTime(e.target.value)}
                    className="form-input-incident"
                    required
                  />
                </div>
              </div>
            </div>

            {/* SECTION 2: Classification (2 columns) */}
            <div className="form-section">
              <div className="form-row-2col">
                <div className="form-group-incident">
                  <label htmlFor="incident-type" className="form-label-incident">
                    Incident Type
                  </label>
                  <select
                    id="incident-type"
                    value={incidentType}
                    onChange={(e) => setIncidentType(e.target.value)}
                    className="form-input-incident form-select-incident"
                    required
                  >
                    <option value="">Select type...</option>
                    <option value="Theft">Theft</option>
                    <option value="Trespassing">Trespassing</option>
                    <option value="Vandalism">Vandalism</option>
                    <option value="Medical Emergency">Medical Emergency</option>
                    <option value="Fire Alarm">Fire Alarm</option>
                    <option value="Assault">Assault</option>
                    <option value="Noise Complaint">Noise Complaint</option>
                    <option value="Suspicious Activity">Suspicious Activity</option>
                    <option value="Property Damage">Property Damage</option>
                    <option value="Unauthorized Access">Unauthorized Access</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="form-group-incident">
                  <label htmlFor="urgency" className="form-label-incident">
                    Urgency
                  </label>
                  <select
                    id="urgency"
                    value={urgency}
                    onChange={(e) => setUrgency(e.target.value)}
                    className="form-input-incident form-select-incident"
                    required
                  >
                    <option value="Normal">Normal</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
              </div>
            </div>

            {/* SECTION 3: The Narrative (Full Width) */}
            <div className="form-section">
              <div className="form-group-incident">
                <label htmlFor="narrative" className="form-label-incident">
                  Detailed Narrative
                </label>
                <textarea
                  id="narrative"
                  value={narrative}
                  onChange={(e) => setNarrative(e.target.value)}
                  placeholder="Who, what, where, when..."
                  className="form-textarea-incident"
                  rows={10}
                  required
                />
              </div>
            </div>

            {/* SECTION 3.5: Action Taken (Full Width) - NEW for IR */}
            <div className="form-section">
              <div className="form-group-incident">
                <label htmlFor="action-taken" className="form-label-incident">
                  Action Taken
                </label>
                <textarea
                  id="action-taken"
                  value={actionTaken}
                  onChange={(e) => setActionTaken(e.target.value)}
                  placeholder="Describe specific actions taken by security personnel..."
                  className="form-textarea-incident"
                  rows={5}
                />
              </div>
            </div>

            {/* SECTION 4: Legal Details (Row) */}
            <div className="form-section legal-section">
              <div className="legal-row">
                <div className="toggle-group-incident">
                  <label className="form-label-incident toggle-label-incident">Police Called?</label>
                  <button
                    type="button"
                    className={`toggle-switch-incident ${policeCalled ? 'toggle-active' : ''}`}
                    onClick={() => setPoliceCalled(!policeCalled)}
                  >
                    <span className="toggle-slider-incident"></span>
                    <span className="toggle-text-incident">{policeCalled ? 'Yes' : 'No'}</span>
                  </button>
                </div>
                <div className="form-group-incident case-number-group">
                  <label htmlFor="case-number" className="form-label-incident">
                    PD Case Number
                  </label>
                  <input
                    type="text"
                    id="case-number"
                    value={caseNumber}
                    onChange={(e) => setCaseNumber(e.target.value)}
                    placeholder="#"
                    className="form-input-incident"
                    disabled={!policeCalled}
                    style={!policeCalled ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                  />
                </div>
              </div>
            </div>

            {/* Attachments */}
            <div className="form-section evidence-footer-section">
              <h3 className="evidence-header">Evidence & Attachments</h3>
              <input
                type="file"
                id="evidence-upload"
                multiple
                accept="image/*,video/*"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
              <label
                htmlFor="evidence-upload"
                className="evidence-dropzone"
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                <Upload size={32} className="dropzone-icon" />
                <p className="dropzone-text">Drag & Drop Photos/Videos or Click to Browse</p>
                <p className="dropzone-subtext">Supports: JPG, PNG, MP4, MOV</p>
              </label>
              
              {attachments.length > 0 && (
                <div className="uploaded-files-list">
                  {attachments.map((file, index) => (
                    <div key={index} className="uploaded-file-item">
                      <Upload size={16} className="file-icon" />
                      <span className="file-name">{file.name}</span>
                      <button
                        type="button"
                        className="remove-file-btn"
                        onClick={() => removeAttachment(index)}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="modal-actions">
              <button type="button" className="button-secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="button-primary">
                Create Report
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Render DAR form with 3-column grid layout
  if (reportType === 'dar') {
    const handleDARSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!incidentDate || !narrative) {
        return;
      }
      
      onSubmit({ 
        content: narrative,
        site: location || 'Unknown Location',
        priority: 'normal',
        location: location || 'Unknown Location',
        attachments: attachments.map((file, index) => ({ id: index, url: URL.createObjectURL(file), name: file.name })),
        date: incidentDate,
        time: shiftStartTime,
        narrativeOnly: narrative,
        // DAR-specific fields - CRITICAL: Pass these to parent
        shiftStart: shiftStartTime,
        shiftEnd: shiftEndTime,
        reliefGuard: reliefGuard,
        equipmentStatus: equipmentStatus
      });
      
      // Reset form
      resetDARForm();
      onClose();
    };

    const resetDARForm = () => {
      setIncidentDate('');
      setShiftStartTime('');
      setShiftEndTime('');
      setShiftType('');
      setReliefGuard('');
      setEquipmentStatus('');
      setNarrative('');
      setAttachments([]);
      setLocation('');
      setLocationSearch('');
    };

    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="create-report-modal incident-form-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <div className="modal-title-with-icon">
              <span className="report-type-emoji">{getReportIcon()}</span>
              <h2>{getReportTitle()}</h2>
            </div>
            <button className="modal-close-btn" onClick={onClose}>
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleDARSubmit} className="modal-body incident-form-body">
            {/* HEADER: Reporting Officer & Case ID */}
            <div className="form-section header-context-section">
              <div className="form-row-2col">
                <div className="form-group-incident">
                  <label htmlFor="reporting-officer-dar" className="form-label-incident">
                    Reporting Guard
                  </label>
                  <input
                    type="text"
                    id="reporting-officer-dar"
                    value={officerName}
                    disabled
                    className="form-input-incident form-input-disabled"
                  />
                </div>
                <div className="form-group-incident">
                  <label htmlFor="case-id-dar" className="form-label-incident">
                    DAR Case ID
                  </label>
                  <input
                    type="text"
                    id="case-id-dar"
                    value={caseId || 'Generating...'}
                    disabled
                    className="form-input-incident form-input-disabled"
                    style={{ backgroundColor: '#1a2332', color: '#6b7280', fontWeight: '500' }}
                  />
                </div>
              </div>
            </div>

            {/* ROW 1: Location (Full Width) */}
            <div className="form-section">
              <div className="form-group-incident">
                <label htmlFor="location-dar" className="form-label-incident">
                  Location
                </label>
                <div className="searchable-dropdown" ref={locationDropdownRef}>
                  <input
                    type="text"
                    id="location-dar"
                    value={locationSearch}
                    onChange={handleLocationSearchChange}
                    placeholder="Search for site..."
                    className="form-input-incident"
                    onFocus={handleLocationInputFocus}
                    onBlur={handleLocationDropdownBlur}
                  />
                  <button type="button" className="dropdown-toggle">
                    <Search size={16} />
                  </button>
                  {isLocationDropdownOpen && (
                    <div className="dropdown-menu">
                      {filteredLocationOptions.map(loc => (
                        <div key={loc} className="dropdown-item" onClick={() => handleLocationSelect(loc)}>
                          {loc}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ROW 2: Date | Shift Start | Shift End (3-column grid) */}
            <div className="form-section">
              <div className="form-row-3col">
                <div className="form-group-incident">
                  <label htmlFor="dar-date" className="form-label-incident">
                    <Calendar size={16} className="label-icon-incident" />
                    Date
                  </label>
                  <input
                    type="date"
                    id="dar-date"
                    value={incidentDate}
                    onChange={(e) => setIncidentDate(e.target.value)}
                    className="form-input-incident"
                    required
                  />
                </div>
                <div className="form-group-incident">
                  <label htmlFor="shift-start" className="form-label-incident">
                    <Clock size={16} className="label-icon-incident" />
                    Shift Start Time
                  </label>
                  <input
                    type="time"
                    id="shift-start"
                    value={shiftStartTime}
                    onChange={(e) => setShiftStartTime(e.target.value)}
                    className="form-input-incident"
                    required
                  />
                </div>
                <div className="form-group-incident">
                  <label htmlFor="shift-end" className="form-label-incident">
                    <Clock size={16} className="label-icon-incident" />
                    Shift End Time
                  </label>
                  <input
                    type="time"
                    id="shift-end"
                    value={shiftEndTime}
                    onChange={(e) => setShiftEndTime(e.target.value)}
                    className="form-input-incident"
                    required
                  />
                </div>
              </div>
            </div>

            {/* ROW 3: Shift Type | Relief Guard | Equipment Status (3-column grid) */}
            <div className="form-section">
              <div className="form-row-3col">
                <div className="form-group-incident">
                  <label htmlFor="shift-type" className="form-label-incident">
                    Shift Type
                  </label>
                  <select
                    id="shift-type"
                    value={shiftType}
                    onChange={(e) => setShiftType(e.target.value)}
                    className="form-input-incident form-select-incident"
                    required
                  >
                    <option value="">Select shift...</option>
                    <option value="Day">Day</option>
                    <option value="Swing">Swing</option>
                    <option value="Night">Night</option>
                  </select>
                </div>
                <div className="form-group-incident">
                  <label htmlFor="relief-guard" className="form-label-incident">
                    Relief Guard
                  </label>
                  <input
                    type="text"
                    id="relief-guard"
                    value={reliefGuard}
                    onChange={(e) => setReliefGuard(e.target.value)}
                    placeholder="Name of next guard..."
                    className="form-input-incident"
                  />
                </div>
                <div className="form-group-incident">
                  <label htmlFor="equipment-status" className="form-label-incident">
                    Equipment Status
                  </label>
                  <select
                    id="equipment-status"
                    value={equipmentStatus}
                    onChange={(e) => setEquipmentStatus(e.target.value)}
                    className="form-input-incident form-select-incident"
                    required
                  >
                    <option value="">Select status...</option>
                    <option value="All Accounted For">All Accounted For</option>
                    <option value="Issues">Issues</option>
                  </select>
                </div>
              </div>
            </div>

            {/* ROW 4: Narrative (Full Width) */}
            <div className="form-section">
              <div className="form-group-incident">
                <label htmlFor="narrative-dar" className="form-label-incident">
                  Activity Summary
                </label>
                <textarea
                  id="narrative-dar"
                  value={narrative}
                  onChange={(e) => setNarrative(e.target.value)}
                  placeholder="Summarize key activities, observations, and notable events during the shift..."
                  className="form-textarea-incident"
                  rows={10}
                  required
                />
              </div>
            </div>

            {/* ROW 5: Evidence (Full Width) */}
            <div className="form-section evidence-footer-section">
              <h3 className="evidence-header">Evidence & Attachments</h3>
              <input
                type="file"
                id="evidence-upload-dar"
                multiple
                accept="image/*,video/*"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
              <label
                htmlFor="evidence-upload-dar"
                className="evidence-dropzone"
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                <Upload size={32} className="dropzone-icon" />
                <p className="dropzone-text">Drag & Drop Photos/Videos or Click to Browse</p>
                <p className="dropzone-subtext">Supports: JPG, PNG, MP4, MOV</p>
              </label>
              
              {attachments.length > 0 && (
                <div className="uploaded-files-list">
                  {attachments.map((file, index) => (
                    <div key={index} className="uploaded-file-item">
                      <Upload size={16} className="file-icon" />
                      <span className="file-name">{file.name}</span>
                      <button
                        type="button"
                        className="remove-file-btn"
                        onClick={() => removeAttachment(index)}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="modal-actions">
              <button type="button" className="button-secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="button-primary">
                Create Report
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Render Maintenance form with 5-column grid layout
  if (reportType === 'maintenance') {
    const handleMaintenanceSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!maintenanceDate || !narrative) {
        return;
      }
      
      onSubmit({ 
        content: narrative,
        site: location || 'Unknown Location',
        priority: priority,
        location: location || 'Unknown Location',
        attachments: attachments.map((file, index) => ({ id: index, url: URL.createObjectURL(file), name: file.name })),
        date: maintenanceDate,
        time: maintenanceTime,
        narrativeOnly: narrative,
        // Maintenance-specific fields
        maintenanceDate: maintenanceDate,
        maintenanceTime: maintenanceTime,
        maintenanceCategory: maintenanceCategory,
        specificArea: specificArea,
        assetId: assetId
      });
      
      // Reset form
      resetMaintenanceForm();
      onClose();
    };

    const resetMaintenanceForm = () => {
      setMaintenanceDate('');
      setMaintenanceTime('');
      setMaintenanceCategory('');
      setSpecificArea('');
      setAssetId('');
      setPriority('normal');
      setNarrative('');
      setAttachments([]);
      setLocation('');
      setLocationSearch('');
    };

    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="create-report-modal incident-form-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <div className="modal-title-with-icon">
              <span className="report-type-emoji">{getReportIcon()}</span>
              <h2>{getReportTitle()}</h2>
            </div>
            <button className="modal-close-btn" onClick={onClose}>
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleMaintenanceSubmit} className="modal-body incident-form-body">
            {/* HEADER: Reporting Officer & Request ID */}
            <div className="form-section header-context-section">
              <div className="form-row-2col">
                <div className="form-group-incident">
                  <label htmlFor="reporting-officer-maint" className="form-label-incident">
                    Reporting Officer
                  </label>
                  <input
                    type="text"
                    id="reporting-officer-maint"
                    value={officerName}
                    disabled
                    className="form-input-incident form-input-disabled"
                  />
                </div>
                <div className="form-group-incident">
                  <label htmlFor="case-id-maint" className="form-label-incident">
                    Request ID
                  </label>
                  <input
                    type="text"
                    id="case-id-maint"
                    value={caseId || 'Generating...'}
                    disabled
                    className="form-input-incident form-input-disabled"
                    style={{ backgroundColor: '#1a2332', color: '#6b7280', fontWeight: '500' }}
                  />
                </div>
              </div>
            </div>

            {/* ROW 1: Location (Full Width) */}
            <div className="form-section">
              <div className="form-group-incident">
                <label htmlFor="location-maint" className="form-label-incident">
                  Location
                </label>
                <div className="searchable-dropdown" ref={locationDropdownRef}>
                  <input
                    type="text"
                    id="location-maint"
                    value={locationSearch}
                    onChange={handleLocationSearchChange}
                    placeholder="Search for site..."
                    className="form-input-incident"
                    onFocus={handleLocationInputFocus}
                    onBlur={handleLocationDropdownBlur}
                  />
                  <button type="button" className="dropdown-toggle">
                    <Search size={16} />
                  </button>
                  {isLocationDropdownOpen && (
                    <div className="dropdown-menu">
                      {filteredLocationOptions.map(loc => (
                        <div key={loc} className="dropdown-item" onClick={() => handleLocationSelect(loc)}>
                          {loc}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ROW 2: Date | Time | Category | Specific Area | Priority (5-column grid) */}
            <div className="form-section">
              <div className="form-row-5col">
                <div className="form-group-incident">
                  <label htmlFor="maint-date" className="form-label-incident">
                    <Calendar size={16} className="label-icon-incident" />
                    Date
                  </label>
                  <input
                    type="date"
                    id="maint-date"
                    value={maintenanceDate}
                    onChange={(e) => setMaintenanceDate(e.target.value)}
                    className="form-input-incident"
                    required
                  />
                </div>
                <div className="form-group-incident">
                  <label htmlFor="maint-time" className="form-label-incident">
                    <Clock size={16} className="label-icon-incident" />
                    Time
                  </label>
                  <input
                    type="time"
                    id="maint-time"
                    value={maintenanceTime}
                    onChange={(e) => setMaintenanceTime(e.target.value)}
                    className="form-input-incident"
                    required
                  />
                </div>
                <div className="form-group-incident">
                  <label htmlFor="maint-category" className="form-label-incident">
                    Category
                  </label>
                  <select
                    id="maint-category"
                    value={maintenanceCategory}
                    onChange={(e) => setMaintenanceCategory(e.target.value)}
                    className="form-input-incident form-select-incident"
                    required
                  >
                    <option value="">Select...</option>
                    <option value="Electrical">Electrical</option>
                    <option value="Plumbing">Plumbing</option>
                    <option value="HVAC">HVAC</option>
                    <option value="Access Control">Access Control</option>
                    <option value="Safety Hazard">Safety Hazard</option>
                    <option value="General">General</option>
                  </select>
                </div>
                <div className="form-group-incident">
                  <label htmlFor="specific-area" className="form-label-incident">
                    Specific Area
                  </label>
                  <input
                    type="text"
                    id="specific-area"
                    value={specificArea}
                    onChange={(e) => setSpecificArea(e.target.value)}
                    placeholder="e.g., Room 204"
                    className="form-input-incident"
                  />
                </div>
                <div className="form-group-incident">
                  <label htmlFor="maint-priority" className="form-label-incident">
                    Priority
                  </label>
                  <select
                    id="maint-priority"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as 'normal' | 'high')}
                    className="form-input-incident form-select-incident"
                    required
                  >
                    <option value="normal">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="high">Critical</option>
                  </select>
                </div>
              </div>
            </div>

            {/* ROW 3: Asset ID / Tag (Full Width) */}
            <div className="form-section">
              <div className="form-group-incident">
                <label htmlFor="asset-id" className="form-label-incident">
                  Asset ID / Tag <span style={{ color: '#6b7280', fontWeight: '400' }}>(Optional)</span>
                </label>
                <input
                  type="text"
                  id="asset-id"
                  value={assetId}
                  onChange={(e) => setAssetId(e.target.value)}
                  placeholder="e.g., HVAC-B204-001"
                  className="form-input-incident"
                />
              </div>
            </div>

            {/* ROW 4: Issue Description (Full Width) */}
            <div className="form-section">
              <div className="form-group-incident">
                <label htmlFor="narrative-maint" className="form-label-incident">
                  Issue Description
                </label>
                <textarea
                  id="narrative-maint"
                  value={narrative}
                  onChange={(e) => setNarrative(e.target.value)}
                  placeholder="Describe the equipment issue, safety hazard, or maintenance need..."
                  className="form-textarea-incident"
                  rows={10}
                  required
                />
              </div>
            </div>

            {/* ROW 5: Evidence (Full Width) */}
            <div className="form-section evidence-footer-section">
              <h3 className="evidence-header">Evidence & Attachments</h3>
              <input
                type="file"
                id="evidence-upload-maint"
                multiple
                accept="image/*,video/*"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
              <label
                htmlFor="evidence-upload-maint"
                className="evidence-dropzone"
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                <Upload size={32} className="dropzone-icon" />
                <p className="dropzone-text">Drag & Drop Photos/Videos or Click to Browse</p>
                <p className="dropzone-subtext">Supports: JPG, PNG, MP4, MOV</p>
              </label>
              
              {attachments.length > 0 && (
                <div className="uploaded-files-list">
                  {attachments.map((file, index) => (
                    <div key={index} className="uploaded-file-item">
                      <Upload size={16} className="file-icon" />
                      <span className="file-name">{file.name}</span>
                      <button
                        type="button"
                        className="remove-file-btn"
                        onClick={() => removeAttachment(index)}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="modal-actions">
              <button type="button" className="button-secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="button-primary">
                Create Request
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Render standard form for other report types
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="create-report-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-with-icon">
            <span className="report-type-emoji">{getReportIcon()}</span>
            <h2>{getReportTitle()}</h2>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleStandardSubmit} className="modal-body">
          {/* Auto-filled Officer Name */}
          <div className="form-group">
            <label htmlFor="officer-name">Reporting Officer</label>
            <input
              type="text"
              id="officer-name"
              value={officerName}
              disabled
              className="form-input form-input-disabled"
            />
            <p className="form-help-text">Auto-filled with your name</p>
          </div>

          {/* Site/Location */}
          <div className="form-group">
            <label htmlFor="site">Site/Location *</label>
            <input
              type="text"
              id="site"
              value={site}
              onChange={(e) => setSite(e.target.value)}
              placeholder="e.g., Building A - Main Entrance"
              className="form-input"
              required
            />
          </div>

          {/* Priority (only for maintenance) */}
          {reportType === 'maintenance' && (
            <div className="form-group">
              <label htmlFor="priority">Priority Level</label>
              <div className="priority-selector">
                <button
                  type="button"
                  className={`priority-option ${priority === 'normal' ? 'active' : ''}`}
                  onClick={() => setPriority('normal')}
                >
                  Normal
                </button>
                <button
                  type="button"
                  className={`priority-option priority-high ${priority === 'high' ? 'active' : ''}`}
                  onClick={() => setPriority('high')}
                >
                  <AlertTriangle size={16} />
                  High Priority
                </button>
              </div>
            </div>
          )}

          {/* Report Content */}
          <div className="form-group">
            <label htmlFor="content">
              {reportType === 'dar' ? 'Activity Summary *' :
               reportType === 'maintenance' ? 'Issue Description *' :
               reportType === 'disciplinary' ? 'Incident Details *' :
               'Shift Notes *'}
            </label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={
                reportType === 'dar' ? 'Summarize the shift activities...' :
                reportType === 'maintenance' ? 'Describe the equipment issue or hazard...' :
                reportType === 'disciplinary' ? 'Describe the policy violation...' :
                'Notes for the incoming shift supervisor...'
              }
              className="form-textarea"
              rows={8}
              required
            />
          </div>

          {/* Action Buttons */}
          <div className="modal-actions">
            <button type="button" className="button-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="button-primary">
              Create Report
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}