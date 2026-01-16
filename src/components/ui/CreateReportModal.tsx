import React, { useState, useEffect, useRef } from 'react';
import { X, AlertTriangle, Calendar, Clock, Upload, Search, ChevronDown, Eye, Trash2, FileText, Image as ImageIcon, Film, File } from 'lucide-react';
import { GUSelect } from './GUSelect';
import { GUCombobox } from './GUCombobox';
import { toast } from 'sonner';
import { getTodayLocalDate, getCurrentLocalTime, formatTimestamp } from '../../utils/timezone';

interface CreateReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportType: 'incident' | 'dar' | 'maintenance' | 'disciplinary' | 'shift-passon';
  officerName: string;
  caseId?: string;  // Auto-generated Case ID (e.g., "#IR-2026-000001")
  initialData?: any;  // For editing drafts - pre-fill form with existing data
  isResubmission?: boolean;  // Flag to indicate this is a resubmission of a rejected report
  rejectionNote?: string;  // Admin's rejection feedback (LEGACY - use decision_note instead)
  // NEW: Enhanced revision metadata
  decision_note?: string;
  reviewed_by_name?: string;
  reviewed_by_role?: string;
  reviewed_at?: string;
  onSubmit: (data: { 
    content: string; 
    site: string; 
    priority: 'normal' | 'high';
    location?: string;
    attachments?: Array<{ id: number; url: string; name: string }>;
    time?: string;
    incidentType?: string;
    urgency?: string;
    police_called?: boolean;
    pd_case_number?: string;
    narrativeOnly?: string;
    actionTaken?: string;
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
    // Disciplinary-specific fields
    employeeName?: string;
    violationType?: string;
    disciplineLevel?: string;
    narrativeOfEvents?: string;
    correctiveAction?: string;
    disciplinaryDate?: string;
    disciplinaryTime?: string;
    // Shift Pass-On specific fields
    shift?: string;  // Day / Swing / Overnight
  }) => void;
  onSaveAsDraft?: (data: any) => void;  // Optional: Save as draft instead of submit
  onResubmitForReview?: (data: any) => void;  // Optional: Resubmit rejected report for review
}

export function CreateReportModal({ isOpen, onClose, reportType, officerName, caseId, initialData, isResubmission, rejectionNote, decision_note, reviewed_by_name, reviewed_by_role, reviewed_at, onSubmit, onSaveAsDraft, onResubmitForReview }: CreateReportModalProps) {
  // State for incident report form
  const [incidentDate, setIncidentDate] = useState('');
  const [incidentTime, setIncidentTime] = useState('');
  const [incidentType, setIncidentType] = useState('');
  const [urgency, setUrgency] = useState('High');
  const [narrative, setNarrative] = useState('');
  const [actionTaken, setActionTaken] = useState(''); // New field for IR
  const [policeCalled, setPoliceCalled] = useState(false); // Police called toggle
  const [pdCaseNumber, setPdCaseNumber] = useState(''); // PD case number
  
  // Enhanced attachment state with upload tracking
  interface AttachmentFile {
    file: File;
    preview: string;
    status: 'uploading' | 'success' | 'error';
    error?: string;
  }
  const [attachments, setAttachments] = useState<AttachmentFile[]>([]);
  
  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      attachments.forEach(attachment => {
        if (attachment.preview) {
          URL.revokeObjectURL(attachment.preview);
        }
      });
    };
  }, []);
  
  // Validation error states for date/time
  const [dateError, setDateError] = useState('');
  const [timeError, setTimeError] = useState('');
  
  // Validation error states for required fields
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
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
  
  // State for Disciplinary-specific fields
  const [employeeName, setEmployeeName] = useState('');
  const [violationType, setViolationType] = useState('');
  const [disciplineLevel, setDisciplineLevel] = useState('');
  const [narrativeOfEvents, setNarrativeOfEvents] = useState('');
  const [correctiveAction, setCorrectiveAction] = useState('');
  const [disciplinaryDate, setDisciplinaryDate] = useState('');
  const [disciplinaryTime, setDisciplinaryTime] = useState('');
  
  // State for Shift Pass-On specific fields
  const [shiftPassOnNotes, setShiftPassOnNotes] = useState('');
  const [shiftPassOnShift, setShiftPassOnShift] = useState('');
  
  // Location searchable dropdown state - using GUCombobox now
  const [location, setLocation] = useState('');

  // State for other report types
  const [site, setSite] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState<'normal' | 'high'>('normal');

  // Pre-fill form when editing a draft
  useEffect(() => {
    if (isOpen && initialData) {
      // Pre-fill common fields
      if (initialData.site) setSite(initialData.site);
      if (initialData.location) setLocation(initialData.location);
      if (initialData.content) setContent(initialData.content);
      if (initialData.priority) setPriority(initialData.priority);
      
      // Pre-fill incident-specific fields
      if (reportType === 'incident') {
        if (initialData.incidentDate) setIncidentDate(initialData.incidentDate); // Use incidentDate field
        if (initialData.time) setIncidentTime(initialData.time);
        if (initialData.incidentType) setIncidentType(initialData.incidentType);
        if (initialData.urgency) setUrgency(initialData.urgency);
        if (initialData.content) setNarrative(initialData.content);
        if (initialData.actionTaken) setActionTaken(initialData.actionTaken);
        // Handle both new (snake_case) and legacy (camelCase) field names
        if (initialData.pd_case_number) setPdCaseNumber(initialData.pd_case_number);
        else if (initialData.pdCaseNumber) setPdCaseNumber(initialData.pdCaseNumber);
        // Handle police_called as boolean or 'Yes'/'No' string
        if (initialData.police_called !== undefined) {
          setPoliceCalled(initialData.police_called === true || initialData.police_called === 'Yes');
        } else if (initialData.policeCalled !== undefined) {
          setPoliceCalled(initialData.policeCalled === true || initialData.policeCalled === 'Yes');
        }
      }
      
      // Pre-fill DAR-specific fields
      if (reportType === 'dar') {
        if (initialData.incidentDate) setIncidentDate(initialData.incidentDate); // Use incidentDate field
        if (initialData.shiftStart) setShiftStartTime(initialData.shiftStart);
        if (initialData.shiftEnd) setShiftEndTime(initialData.shiftEnd);
        if (initialData.shift) setShiftType(initialData.shift);
        if (initialData.reliefGuard) setReliefGuard(initialData.reliefGuard);
        if (initialData.equipmentStatus) setEquipmentStatus(initialData.equipmentStatus);
      }
      
      // Pre-fill maintenance-specific fields
      if (reportType === 'maintenance') {
        // Try specific field first, fall back to generic 'date'/'time'
        if (initialData.maintenanceDate) setMaintenanceDate(initialData.maintenanceDate);
        else if (initialData.date) setMaintenanceDate(initialData.date);
        
        if (initialData.maintenanceTime) setMaintenanceTime(initialData.maintenanceTime);
        else if (initialData.time) setMaintenanceTime(initialData.time);
        
        if (initialData.maintenanceCategory) setMaintenanceCategory(initialData.maintenanceCategory);
        if (initialData.specificArea) setSpecificArea(initialData.specificArea);
        if (initialData.assetId) setAssetId(initialData.assetId);
      }
      
      // Pre-fill disciplinary-specific fields
      if (reportType === 'disciplinary') {
        if (initialData.employeeName) setEmployeeName(initialData.employeeName);
        if (initialData.violationType) setViolationType(initialData.violationType);
        if (initialData.disciplineLevel) setDisciplineLevel(initialData.disciplineLevel);
        if (initialData.correctiveAction) setCorrectiveAction(initialData.correctiveAction);
        
        // Try specific field first, fall back to generic 'date'/'time'
        if (initialData.disciplinaryDate) setDisciplinaryDate(initialData.disciplinaryDate);
        else if (initialData.date) setDisciplinaryDate(initialData.date);
        
        if (initialData.disciplinaryTime) setDisciplinaryTime(initialData.disciplinaryTime);
        else if (initialData.time) setDisciplinaryTime(initialData.time);
        
        if (initialData.content) setNarrativeOfEvents(initialData.content);
      }
      
      // Pre-fill shift pass-on fields
      if (reportType === 'shift-passon') {
        if (initialData.shift) setShiftPassOnShift(initialData.shift);
        if (initialData.content) setShiftPassOnNotes(initialData.content);
      }
    }
  }, [isOpen, initialData, reportType]);

  // Auto-fill date and time when modal opens (only if NOT editing a draft)
  useEffect(() => {
    if (isOpen && !initialData) {
      // IMPORTANT: Use local date/time utilities to prevent UTC timezone bugs
      const localDate = getTodayLocalDate(); // Gets YYYY-MM-DD in local timezone
      const localTime = getCurrentLocalTime(); // Gets HH:MM in local timezone
      const now = new Date();
      const currentHour = now.getHours();
      
      if (reportType === 'incident') {
        setIncidentDate(localDate); // Local date, not UTC
        setIncidentTime(localTime); // Local time, not UTC
      } else if (reportType === 'dar') {
        setIncidentDate(localDate); // Local date for DAR
        // Default shift times based on current time
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
        setMaintenanceDate(localDate); // Local date
        setMaintenanceTime(localTime); // Local time
      } else if (reportType === 'disciplinary') {
        setDisciplinaryDate(localDate); // Local date
        setDisciplinaryTime(localTime); // Local time
      } else if (reportType === 'shift-passon') {
        // Auto-detect shift based on current time
        if (currentHour >= 6 && currentHour < 14) {
          setShiftPassOnShift('Day');
        } else if (currentHour >= 14 && currentHour < 22) {
          setShiftPassOnShift('Swing');
        } else {
          setShiftPassOnShift('Overnight');
        }
      }
    }
  }, [isOpen, reportType, initialData]);

  // ============================================================================
  // DATE/TIME VALIDATION - Prevent Future Dates/Times for Audit Integrity
  // ============================================================================
  
  const validateDate = (dateString: string): boolean => {
    if (!dateString) return true; // Empty is ok, required validation will catch it
    
    const selectedDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset to start of day for fair comparison
    
    if (selectedDate > today) {
      setDateError('Date cannot be in the future');
      return false;
    }
    
    setDateError('');
    return true;
  };
  
  const validateTime = (timeString: string, dateString: string): boolean => {
    if (!timeString || !dateString) return true; // Empty is ok
    
    const selectedDate = new Date(dateString);
    const today = new Date();
    
    // Only validate time if the selected date is today
    if (selectedDate.toDateString() === today.toDateString()) {
      const [hours, minutes] = timeString.split(':').map(Number);
      const selectedDateTime = new Date(selectedDate);
      selectedDateTime.setHours(hours, minutes, 0, 0);
      
      if (selectedDateTime > today) {
        setTimeError('Time cannot be in the future');
        return false;
      }
    }
    
    setTimeError('');
    return true;
  };
  
  const handleDateChange = (value: string, setter: (val: string) => void) => {
    setter(value);
    validateDate(value);
    // Also revalidate time when date changes
    if (incidentTime) validateTime(incidentTime, value);
    if (maintenanceTime) validateTime(maintenanceTime, value);
    if (disciplinaryTime) validateTime(disciplinaryTime, value);
  };
  
  const handleTimeChange = (value: string, dateValue: string, setter: (val: string) => void) => {
    setter(value);
    validateTime(value, dateValue);
  };

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

  // Helper function to render the revision banner (when supervisor requests changes)
  const renderRevisionBanner = () => {
    // Determine the reason text (priority: decision_note > rejectionNote > review_note)
    const reasonText = decision_note || rejectionNote || initialData?.review_note || 'No reason provided';
    
    // Determine who requested the revision
    const reviewerName = reviewed_by_name || initialData?.reviewed_by_name || 'Supervisor';
    const reviewerRole = reviewed_by_role || initialData?.reviewed_by_role || '';
    const reviewerDisplay = reviewerRole ? `${reviewerRole} ${reviewerName}` : reviewerName;
    
    // Determine when the revision was requested
    const reviewedTimestamp = reviewed_at || initialData?.reviewed_at;
    const reviewedTimeDisplay = reviewedTimestamp ? formatTimestamp(reviewedTimestamp) : 'Recently';
    
    return (
      <div style={{ 
        padding: '1rem', 
        backgroundColor: 'rgba(255, 165, 0, 0.1)', // Amber/orange warning color
        borderRadius: '8px',
        marginBottom: '1.5rem',
        border: '1px solid rgba(255, 165, 0, 0.3)'
      }}>
        <div style={{ 
          color: '#FFA500', 
          fontSize: '0.95rem', 
          fontWeight: 700, 
          marginBottom: '0.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <AlertTriangle size={18} />
          Supervisor Requested Changes
        </div>
        <div style={{ 
          fontSize: '0.75rem', 
          color: 'var(--text-muted)', 
          marginBottom: '0.75rem',
          fontStyle: 'italic'
        }}>
          Why was this returned? Please address the feedback below before resubmitting.
        </div>
        <div style={{ 
          fontSize: '0.875rem', 
          color: 'var(--text-primary)', 
          lineHeight: '1.6', 
          marginBottom: '0.75rem',
          padding: '0.75rem',
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '4px',
          borderLeft: '3px solid #FFA500'
        }}>
          {reasonText}
        </div>
        <div style={{ 
          display: 'flex', 
          gap: '1.5rem',
          fontSize: '0.75rem',
          color: 'var(--text-muted)'
        }}>
          <div>
            <strong style={{ color: 'var(--text-primary)' }}>Reviewed by:</strong> {reviewerDisplay}
          </div>
          <div>
            <strong style={{ color: 'var(--text-primary)' }}>When:</strong> {reviewedTimeDisplay}
          </div>
        </div>
      </div>
    );
  };

  const handleIncidentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('🔵 [CreateReportModal] Submit button clicked - Incident Report');
    
    // Clear previous validation errors
    setValidationErrors({});
    
    // Validate required fields
    const errors: Record<string, string> = {};
    
    if (!location) errors.location = 'Location is required';
    if (!incidentDate) errors.incidentDate = 'Date of incident is required';
    if (!incidentTime) errors.incidentTime = 'Time of incident is required';
    if (!incidentType) errors.incidentType = 'Incident type is required';
    if (!narrative || narrative.trim() === '') errors.narrative = 'Detailed narrative is required';
    
    // Check if there are any validation errors
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      toast.error('Please complete all required fields', {
        description: 'Required fields are highlighted in red'
      });
      console.log('❌ [CreateReportModal] Validation failed:', errors);
      
      // Scroll to first error
      const firstErrorField = Object.keys(errors)[0];
      const element = document.getElementById(firstErrorField);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.focus();
      }
      
      return;
    }
    
    // Validate date and time are not in the future
    if (!validateDate(incidentDate)) {
      toast.error('Invalid date', { description: dateError });
      return;
    }
    if (!validateTime(incidentTime, incidentDate)) {
      toast.error('Invalid time', { description: timeError });
      return;
    }
    
    // Set loading state
    setIsSubmitting(true);
    console.log('✅ [CreateReportModal] Validation passed, submitting report...');
    
    // ============================================================================
    // DEBUG: Log law enforcement fields before submission
    // ============================================================================
    console.log('='.repeat(80));
    console.log('[CreateReportModal - SUBMIT] Law Enforcement Fields:');
    console.log('policeCalled (state):', policeCalled);
    console.log('pdCaseNumber (state):', pdCaseNumber);
    console.log('About to submit with:');
    console.log('police_called:', policeCalled);
    console.log('pd_case_number:', pdCaseNumber);
    console.log('='.repeat(80));
    
    try {
      // Pass structured data - NO concatenation
      await onSubmit({ 
        caseId: caseId,                  // Pre-generated Case ID from parent (e.g., "IR-2026-000042")
        content: narrative, // Use pure narrative only for backwards compatibility
        site: location || 'Unknown Location',
        priority: urgency === 'Critical' ? 'high' : 'normal',
        location: location || 'Unknown Location',  // This is specificLocation in the canonical schema
        attachments: attachments.map((attachment, index) => ({ 
          id: index, 
          url: attachment.preview, 
          name: attachment.file.name 
        })),
        date: incidentDate,              // Date of Incident (e.g., "2026-01-04")
        time: incidentTime,
        incidentType: incidentType,
        urgency: urgency,
        narrativeOnly: narrative,        // Pure narrative text
        actionTaken: actionTaken,        // Actions taken by guard - ALWAYS INCLUDED
        police_called: policeCalled,     // boolean - canonical field name
        pd_case_number: pdCaseNumber     // string or empty - canonical field name
      });
      
      console.log('✅ [CreateReportModal] Report submitted successfully');
      
      // Reset form
      resetIncidentForm();
      setValidationErrors({});
      onClose();
    } catch (error) {
      console.error('❌ [CreateReportModal] Submit failed:', error);
      toast.error('Failed to create report', {
        description: error.message || 'Please try again'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Generic Save as Draft handler for all report types
  const handleSaveAsDraft = () => {
    if (!onSaveAsDraft) return;
    
    let draftData: any = { caseId: caseId };
    
    if (reportType === 'incident') {
      draftData = {
        ...draftData,
        content: narrative,
        site: location || '',
        priority: urgency === 'Critical' ? 'high' : 'normal',
        location: location || '',
        attachments: attachments.map((attachment, index) => ({ 
          id: index, 
          url: attachment.preview, 
          name: attachment.file.name 
        })),
        date: incidentDate, // YYYY-MM-DD format for rehydration
        time: incidentTime, // HH:mm format
        incidentDate: incidentDate, // Store with specific field name too
        incidentType: incidentType,
        urgency: urgency,
        police_called: policeCalled,
        pd_case_number: pdCaseNumber,
        narrativeOnly: narrative,
        actionTaken: actionTaken
      };
      resetIncidentForm();
    } else if (reportType === 'dar') {
      draftData = {
        ...draftData,
        content: narrative,
        site: location || '',
        location: location || '',
        date: incidentDate, // YYYY-MM-DD format for rehydration
        incidentDate: incidentDate, // Store with specific field name too
        priority: 'normal',
        shiftStart: shiftStartTime, // HH:mm format
        shiftEnd: shiftEndTime, // HH:mm format
        shift: shiftType,
        reliefGuard: reliefGuard,
        equipmentStatus: equipmentStatus
      };
    } else if (reportType === 'maintenance') {
      draftData = {
        ...draftData,
        content: narrative,
        site: location || '',
        location: location || '',
        priority: 'normal',
        date: maintenanceDate, // YYYY-MM-DD format for rehydration
        time: maintenanceTime, // HH:mm format
        maintenanceDate: maintenanceDate, // Store with specific field name too
        maintenanceTime: maintenanceTime,
        maintenanceCategory: maintenanceCategory,
        specificArea: specificArea,
        assetId: assetId
      };
    } else if (reportType === 'disciplinary') {
      draftData = {
        ...draftData,
        content: narrativeOfEvents,
        site: location || '',
        location: location || '',
        priority: 'normal',
        employeeName: employeeName,
        violationType: violationType,
        disciplineLevel: disciplineLevel,
        correctiveAction: correctiveAction,
        date: disciplinaryDate, // YYYY-MM-DD format for rehydration
        time: disciplinaryTime, // HH:mm format
        disciplinaryDate: disciplinaryDate, // Store with specific field name too
        disciplinaryTime: disciplinaryTime
      };
    } else if (reportType === 'shift-passon') {
      draftData = {
        ...draftData,
        content: shiftPassOnNotes,
        site: location || '',
        location: location || '',
        priority: 'normal',
        shift: shiftPassOnShift
      };
    }
    
    onSaveAsDraft(draftData);
    onClose();
  };

  const handleStandardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!site || !content) {
      return;
    }
    onSubmit({ caseId: caseId, content, site, priority });
    // Reset form
    setSite('');
    setContent('');
    setPriority('normal');
    onClose();
  };

  // Handler for Resubmit for Review button (resubmission flow)
  const handleResubmitForReview = () => {
    if (!onResubmitForReview) return;
    
    // Collect same data as Save as Draft, but will be submitted as 'pending'
    let reportData: any = { caseId: caseId };
    
    if (reportType === 'incident') {
      reportData = {
        ...reportData,
        content: narrative,
        site: location || '',
        priority: urgency === 'Critical' ? 'high' : 'normal',
        location: location || '',
        attachments: attachments.map((attachment, index) => ({ 
          id: index, 
          url: attachment.preview, 
          name: attachment.file.name 
        })),
        date: incidentDate,
        time: incidentTime,
        incidentDate: incidentDate,
        incidentType: incidentType,
        urgency: urgency,
        police_called: policeCalled,
        pd_case_number: pdCaseNumber,
        narrativeOnly: narrative,
        actionTaken: actionTaken,
        type: 'Incident',
        reportType: 'incident'
      };
    } else if (reportType === 'dar') {
      reportData = {
        ...reportData,
        content: darNotes,
        site: location || '',
        priority: 'normal',
        location: location || '',
        attachments: attachments.map((attachment, index) => ({ 
          id: index, 
          url: attachment.preview, 
          name: attachment.file.name 
        })),
        date: incidentDate,
        shiftStart: shiftStart,
        shiftEnd: shiftEnd,
        reliefGuard: reliefGuard,
        equipmentStatus: equipmentStatus,
        incidentDate: incidentDate,
        type: 'DAR',
        reportType: 'dar'
      };
    } else if (reportType === 'maintenance') {
      reportData = {
        ...reportData,
        content: narrative,
        site: location || '',
        priority: urgency === 'Critical' ? 'high' : 'normal',
        location: location || '',
        attachments: attachments.map((attachment, index) => ({ 
          id: index, 
          url: attachment.preview, 
          name: attachment.file.name 
        })),
        maintenanceCategory: maintenanceCategory,
        specificArea: specificArea,
        assetId: assetId,
        maintenanceDate: maintenanceDate,
        maintenanceTime: maintenanceTime,
        type: 'Maintenance',
        reportType: 'maintenance'
      };
    } else if (reportType === 'disciplinary') {
      reportData = {
        ...reportData,
        content: narrativeOfEvents,
        site: location || '',
        priority: 'high',
        location: location || '',
        employeeName: employeeName,
        violationType: violationType,
        disciplineLevel: disciplineLevel,
        correctiveAction: correctiveAction,
        disciplinaryDate: disciplinaryDate,
        disciplinaryTime: disciplinaryTime,
        narrativeOfEvents: narrativeOfEvents,
        type: 'Disciplinary',
        reportType: 'disciplinary'
      };
    }
    
    onResubmitForReview(reportData);
    resetIncidentForm();
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
    setPdCaseNumber('');
    setAttachments([]);
    setLocation('');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      processFiles(files);
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
      const files = Array.from(e.dataTransfer.files);
      processFiles(files);
    }
  };
  
  // Process uploaded files with simulated upload state
  const processFiles = async (files: File[]) => {
    const newAttachments: AttachmentFile[] = files.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      status: 'uploading' as const
    }));
    
    setAttachments(prev => [...prev, ...newAttachments]);
    
    // Simulate upload process
    newAttachments.forEach(async (attachment, index) => {
      try {
        // Simulate upload delay
        await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 500));
        
        // Update status to success
        setAttachments(prev => prev.map(item => 
          item.preview === attachment.preview 
            ? { ...item, status: 'success' as const }
            : item
        ));
      } catch (error) {
        // Update status to error
        setAttachments(prev => prev.map(item => 
          item.preview === attachment.preview 
            ? { ...item, status: 'error' as const, error: 'Upload failed' }
            : item
        ));
      }
    });
  };

  const removeAttachment = (index: number) => {
    // Revoke object URL to prevent memory leaks
    const attachment = attachments[index];
    if (attachment?.preview) {
      URL.revokeObjectURL(attachment.preview);
    }
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };
  
  const handlePreviewAttachment = (attachment: AttachmentFile) => {
    // Open preview in new tab
    window.open(attachment.preview, '_blank');
  };
  
  const retryUpload = (index: number) => {
    const attachment = attachments[index];
    if (attachment) {
      setAttachments(prev => prev.map((item, i) => 
        i === index ? { ...item, status: 'uploading' as const, error: undefined } : item
      ));
      
      // Retry upload
      setTimeout(() => {
        setAttachments(prev => prev.map((item, i) => 
          i === index ? { ...item, status: 'success' as const } : item
        ));
      }, 800);
    }
  };
  
  // Helper to get file icon based on type
  const getFileIcon = (file: File) => {
    const type = file.type;
    if (type.startsWith('image/')) return ImageIcon;
    if (type.startsWith('video/')) return Film;
    if (type.includes('pdf')) return FileText;
    return File;
  };
  
  // Helper to format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };
  
  // Reusable Uploaded Files List Component
  const UploadedFilesList = () => {
    if (attachments.length === 0) return null;
    
    return (
      <div className="uploaded-files-list">
        <h4 style={{ 
          fontSize: '0.875rem', 
          fontWeight: 600, 
          color: 'var(--text-secondary)',
          marginBottom: '12px'
        }}>
          Uploaded Files ({attachments.length})
        </h4>
        {attachments.map((attachment, index) => {
          const FileIcon = getFileIcon(attachment.file);
          const isUploading = attachment.status === 'uploading';
          const hasError = attachment.status === 'error';
          
          return (
            <div 
              key={index} 
              className="uploaded-file-item"
              style={{
                opacity: isUploading ? 0.7 : 1,
                borderColor: hasError ? '#EF4444' : 'var(--border)'
              }}
            >
              <div className="file-info-section">
                <FileIcon 
                  size={20} 
                  className="file-icon"
                  style={{ 
                    color: hasError ? '#EF4444' : 'var(--accent-orange)',
                    flexShrink: 0
                  }} 
                />
                <div className="file-details">
                  <span className="file-name">{attachment.file.name}</span>
                  <span className="file-metadata">
                    {attachment.file.type.split('/')[1]?.toUpperCase() || 'FILE'} • {formatFileSize(attachment.file.size)}
                    {isUploading && ' • Uploading...'}
                    {hasError && ` • ${attachment.error}`}
                  </span>
                </div>
              </div>
              
              <div className="file-actions">
                {isUploading && (
                  <div className="upload-spinner" />
                )}
                {attachment.status === 'success' && (
                  <button
                    type="button"
                    className="preview-file-btn"
                    onClick={() => handlePreviewAttachment(attachment)}
                    title="Preview in new tab"
                  >
                    <Eye size={16} />
                  </button>
                )}
                {hasError && (
                  <button
                    type="button"
                    className="retry-file-btn"
                    onClick={() => retryUpload(index)}
                    title="Retry upload"
                  >
                    Retry
                  </button>
                )}
                <button
                  type="button"
                  className="remove-file-btn"
                  onClick={() => removeAttachment(index)}
                  title="Remove file"
                  disabled={isUploading}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const locationOptions = [
    { value: 'Building A - Main Entrance', label: 'Building A - Main Entrance' },
    { value: 'Building B - Reception Area', label: 'Building B - Reception Area' },
    { value: 'Building C - Conference Room', label: 'Building C - Conference Room' },
    { value: 'Building D - Storage Area', label: 'Building D - Storage Area' },
    { value: 'Building E - Office Suite', label: 'Building E - Office Suite' },
    { value: 'Building F - Kitchen', label: 'Building F - Kitchen' },
    { value: 'Building G - Gym', label: 'Building G - Gym' },
    { value: 'Building H - Library', label: 'Building H - Library' },
    { value: 'Building I - Auditorium', label: 'Building I - Auditorium' },
    { value: 'Building J - Cafeteria', label: 'Building J - Cafeteria' },
    { value: 'Building K - Workshop', label: 'Building K - Workshop' },
    { value: 'Building L - Laboratory', label: 'Building L - Laboratory' },
    { value: 'Building M - Medical Center', label: 'Building M - Medical Center' },
    { value: 'Building N - Security Room', label: 'Building N - Security Room' },
    { value: 'Building O - Maintenance Room', label: 'Building O - Maintenance Room' },
    { value: 'Building P - Archive Room', label: 'Building P - Archive Room' },
    { value: 'Building Q - Training Room', label: 'Building Q - Training Room' },
    { value: 'Building R - Research Lab', label: 'Building R - Research Lab' },
    { value: 'Building S - Data Center', label: 'Building S - Data Center' },
    { value: 'Building T - Server Room', label: 'Building T - Server Room' },
    { value: 'Building U - IT Support Room', label: 'Building U - IT Support Room' },
    { value: 'Building V - Customer Service Room', label: 'Building V - Customer Service Room' },
    { value: 'Building W - Sales Room', label: 'Building W - Sales Room' },
    { value: 'Building X - Marketing Room', label: 'Building X - Marketing Room' },
    { value: 'Building Y - Human Resources Room', label: 'Building Y - Human Resources Room' },
    { value: 'Building Z - Finance Room', label: 'Building Z - Finance Room' }
  ];

  // Render comprehensive incident report form
  if (reportType === 'incident') {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="create-report-modal incident-form-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <div className="modal-title-with-icon">
              <span className="report-type-emoji">{getReportIcon()}</span>
              <h2>{isResubmission ? `Revise & Resubmit - ${getReportTitle()}` : getReportTitle()}</h2>
            </div>
            <button className="modal-close-btn" onClick={onClose}>
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleIncidentSubmit} className="modal-body incident-form-body">
            {/* Revision Banner - Only shown when resubmitting a rejected/needs_revision report */}
            {isResubmission && (decision_note || rejectionNote || initialData?.status === 'rejected' || initialData?.status === 'needs_revision') && renderRevisionBanner()}
            
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
              <div id="location">
                <GUCombobox
                  label="Location"
                  value={location}
                  onChange={(value) => {
                    setLocation(value);
                    if (validationErrors.location) {
                      setValidationErrors(prev => {
                        const newErrors = { ...prev };
                        delete newErrors.location;
                        return newErrors;
                      });
                    }
                  }}
                  options={locationOptions}
                  placeholder="Select location..."
                  searchPlaceholder="Search for site..."
                  required
                />
                {validationErrors.location && (
                  <span style={{ color: '#EF4444', fontSize: '0.875rem', marginTop: '0.25rem', display: 'block' }}>
                    {validationErrors.location}
                  </span>
                )}
              </div>
            </div>

            {/* SECTION 1: Timeline (2 columns) */}
            <div className="form-section">
              <div className="form-row-2col">
                <div className="form-group-incident" id="incidentDate">
                  <label htmlFor="incident-date" className="form-label-incident">
                    <Calendar size={16} className="label-icon-incident" />
                    Date of Incident
                  </label>
                  <input
                    type="date"
                    id="incident-date"
                    value={incidentDate}
                    max={getTodayLocalDate()}
                    onChange={(e) => {
                      handleDateChange(e.target.value, setIncidentDate);
                      if (validationErrors.incidentDate) {
                        setValidationErrors(prev => {
                          const newErrors = { ...prev };
                          delete newErrors.incidentDate;
                          return newErrors;
                        });
                      }
                    }}
                    className="form-input-incident"
                    style={validationErrors.incidentDate ? { borderColor: '#EF4444', outline: '2px solid rgba(239, 68, 68, 0.2)' } : {}}
                    required
                  />
                  {(dateError || validationErrors.incidentDate) && (
                    <span style={{ color: '#EF4444', fontSize: '0.875rem', marginTop: '0.25rem', display: 'block' }}>
                      {validationErrors.incidentDate || dateError}
                    </span>
                  )}
                </div>
                <div className="form-group-incident" id="incidentTime">
                  <label htmlFor="incident-time" className="form-label-incident">
                    <Clock size={16} className="label-icon-incident" />
                    Time of Incident
                  </label>
                  <input
                    type="time"
                    id="incident-time"
                    value={incidentTime}
                    onChange={(e) => {
                      handleTimeChange(e.target.value, incidentDate, setIncidentTime);
                      if (validationErrors.incidentTime) {
                        setValidationErrors(prev => {
                          const newErrors = { ...prev };
                          delete newErrors.incidentTime;
                          return newErrors;
                        });
                      }
                    }}
                    className="form-input-incident"
                    style={validationErrors.incidentTime ? { borderColor: '#EF4444', outline: '2px solid rgba(239, 68, 68, 0.2)' } : {}}
                    required
                  />
                  {(timeError || validationErrors.incidentTime) && (
                    <span style={{ color: '#EF4444', fontSize: '0.875rem', marginTop: '0.25rem', display: 'block' }}>
                      {validationErrors.incidentTime || timeError}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* SECTION 2: Classification (2 columns) */}
            <div className="form-section">
              <div className="form-row-2col">
                <div id="incidentType">
                  <GUSelect
                    label="Incident Type"
                    value={incidentType}
                    onChange={(value) => {
                      setIncidentType(value);
                      if (validationErrors.incidentType) {
                        setValidationErrors(prev => {
                          const newErrors = { ...prev };
                          delete newErrors.incidentType;
                          return newErrors;
                        });
                      }
                    }}
                  options={[
                    { value: '', label: 'Select type...' },
                    { value: 'Theft', label: 'Theft' },
                    { value: 'Trespassing', label: 'Trespassing' },
                    { value: 'Vandalism', label: 'Vandalism' },
                    { value: 'Medical Emergency', label: 'Medical Emergency' },
                    { value: 'Fire Alarm', label: 'Fire Alarm' },
                    { value: 'Assault', label: 'Assault' },
                    { value: 'Noise Complaint', label: 'Noise Complaint' },
                    { value: 'Suspicious Activity', label: 'Suspicious Activity' },
                    { value: 'Property Damage', label: 'Property Damage' },
                    { value: 'Unauthorized Access', label: 'Unauthorized Access' },
                    { value: 'Other', label: 'Other' }
                  ]}
                  placeholder="Select type..."
                  required
                />
                {validationErrors.incidentType && (
                  <span style={{ color: '#EF4444', fontSize: '0.875rem', marginTop: '0.25rem', display: 'block' }}>
                    {validationErrors.incidentType}
                  </span>
                )}
              </div>
                <GUSelect
                  label="Urgency"
                  value={urgency}
                  onChange={setUrgency}
                  options={[
                    { value: 'Normal', label: 'Normal' },
                    { value: 'High', label: 'High' },
                    { value: 'Critical', label: 'Critical' }
                  ]}
                  required
                />
              </div>
            </div>

            {/* SECTION 3: The Narrative (Full Width) */}
            <div className="form-section">
              <div className="form-group-incident" id="narrative">
                <label htmlFor="narrative" className="form-label-incident">
                  Detailed Narrative
                </label>
                <textarea
                  id="narrative"
                  value={narrative}
                  onChange={(e) => {
                    setNarrative(e.target.value);
                    if (validationErrors.narrative) {
                      setValidationErrors(prev => {
                        const newErrors = { ...prev };
                        delete newErrors.narrative;
                        return newErrors;
                      });
                    }
                  }}
                  placeholder="Who, what, where, when..."
                  className="form-textarea-incident"
                  style={validationErrors.narrative ? { borderColor: '#EF4444', outline: '2px solid rgba(239, 68, 68, 0.2)' } : {}}
                  rows={10}
                  required
                />
                {validationErrors.narrative && (
                  <span style={{ color: '#EF4444', fontSize: '0.875rem', marginTop: '0.25rem', display: 'block' }}>
                    {validationErrors.narrative}
                  </span>
                )}
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

            {/* SECTION 4: Police Response */}
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
                {policeCalled && (
                  <div className="form-group-incident case-number-group">
                    <label htmlFor="pd-case-number" className="form-label-incident">
                      PD Case # (Optional)
                    </label>
                    <input
                      type="text"
                      id="pd-case-number"
                      value={pdCaseNumber}
                      onChange={(e) => setPdCaseNumber(e.target.value)}
                      placeholder="Case #"
                      className="form-input-incident"
                    />
                  </div>
                )}
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
              
              <UploadedFilesList />
            </div>

            {/* Action Buttons */}
            <div className="modal-actions">
              <button type="button" className="button-secondary" onClick={onClose}>
                Cancel
              </button>
              
              {/* Resubmission Mode: Show Save Draft + Resubmit for Review */}
              {isResubmission && onResubmitForReview ? (
                <>
                  <button 
                    type="button" 
                    className="button-secondary" 
                    onClick={handleSaveAsDraft}
                    style={{ 
                      marginLeft: 'auto', 
                      background: 'rgba(59, 130, 246, 0.1)', 
                      color: '#3B82F6', 
                      border: '1px solid rgba(59, 130, 246, 0.3)'
                    }}
                  >
                    Save Draft
                  </button>
                  <button 
                    type="button"
                    className="button-primary"
                    onClick={handleResubmitForReview}
                    style={{ minWidth: '180px' }}
                  >
                    Resubmit for Review
                  </button>
                </>
              ) : (
                /* Normal Mode: Show Save as Draft (optional) + Submit/Create */
                <>
                  {onSaveAsDraft && (
                    <button 
                      type="button" 
                      className="button-secondary" 
                      onClick={handleSaveAsDraft}
                      style={{ 
                        marginLeft: 'auto', 
                        background: 'rgba(59, 130, 246, 0.1)', 
                        color: '#3B82F6', 
                        border: '1px solid rgba(59, 130, 246, 0.3)'
                      }}
                    >
                      Save as Draft
                    </button>
                  )}
                  <button 
                    type="submit" 
                    className="button-primary"
                    style={{ minWidth: '140px' }}
                  >
                    {isSubmitting ? 'Processing...' : (initialData ? 'Submit Report' : 'Create Report')}
                  </button>
                </>
              )}
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
      
      // Validate date is not in the future
      if (!validateDate(incidentDate)) {
        return;
      }
      
      onSubmit({ 
        caseId: caseId,  // Pre-generated Case ID from parent (e.g., "#DAR-2026-000005")
        content: narrative,
        site: location || 'Unknown Location',
        priority: 'normal',
        location: location || 'Unknown Location',
        attachments: attachments.map((attachment, index) => ({ 
          id: index, 
          url: attachment.preview, 
          name: attachment.file.name 
        })),
        date: incidentDate,
        time: shiftStartTime,
        narrativeOnly: narrative,
        // DAR-specific fields - CRITICAL: Pass these to parent
        shiftStart: shiftStartTime,
        shiftEnd: shiftEndTime,
        shift: shiftType,
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
              <GUCombobox
                label="Location"
                value={location}
                onChange={setLocation}
                options={locationOptions}
                placeholder="Select location..."
                searchPlaceholder="Search for site..."
                required
              />
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
                    max={getTodayLocalDate()}
                    onChange={(e) => handleDateChange(e.target.value, setIncidentDate)}
                    className="form-input-incident"
                    required
                  />
                  {dateError && (
                    <span style={{ color: '#EF4444', fontSize: '0.875rem', marginTop: '0.25rem', display: 'block' }}>
                      {dateError}
                    </span>
                  )}
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
                <GUSelect
                  label="Shift Type"
                  value={shiftType}
                  onChange={setShiftType}
                  options={[
                    { value: '', label: 'Select shift...' },
                    { value: 'Day', label: 'Day' },
                    { value: 'Swing', label: 'Swing' },
                    { value: 'Night', label: 'Night' }
                  ]}
                  placeholder="Select shift..."
                  required
                />
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
                <GUSelect
                  label="Equipment Status"
                  value={equipmentStatus}
                  onChange={setEquipmentStatus}
                  options={[
                    { value: '', label: 'Select status...' },
                    { value: 'All Accounted For', label: 'All Accounted For' },
                    { value: 'Issues', label: 'Issues' }
                  ]}
                  placeholder="Select status..."
                  required
                />
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
              
              <UploadedFilesList />
            </div>

            {/* Action Buttons */}
            <div className="modal-actions">
              <button type="button" className="button-secondary" onClick={onClose}>
                Cancel
              </button>
              
              {/* Resubmission Mode: Show Save Draft + Resubmit for Review */}
              {isResubmission && onResubmitForReview ? (
                <>
                  <button 
                    type="button" 
                    className="button-secondary" 
                    onClick={handleSaveAsDraft}
                    style={{ 
                      marginLeft: 'auto', 
                      background: 'rgba(59, 130, 246, 0.1)', 
                      color: '#3B82F6', 
                      border: '1px solid rgba(59, 130, 246, 0.3)'
                    }}
                  >
                    Save Draft
                  </button>
                  <button 
                    type="button"
                    className="button-primary"
                    onClick={handleResubmitForReview}
                    style={{ minWidth: '180px' }}
                  >
                    Resubmit for Review
                  </button>
                </>
              ) : (
                /* Normal Mode: Show Save as Draft (optional) + Submit/Create */
                <>
                  {onSaveAsDraft && (
                    <button 
                      type="button" 
                      className="button-secondary" 
                      onClick={handleSaveAsDraft}
                      style={{ marginLeft: 'auto', background: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6', border: '1px solid rgba(59, 130, 246, 0.3)' }}
                    >
                      Save as Draft
                    </button>
                  )}
                  <button type="submit" className="button-primary">
                    {initialData ? 'Submit Report' : 'Create Report'}
                  </button>
                </>
              )}
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
      
      // Validate date and time are not in the future
      if (!validateDate(maintenanceDate)) {
        return;
      }
      if (!validateTime(maintenanceTime, maintenanceDate)) {
        return;
      }
      
      onSubmit({ 
        caseId: caseId,  // Pre-generated Case ID from parent (e.g., "#MNT-2026-000003")
        content: narrative,
        site: location || 'Unknown Location',
        priority: priority,
        location: location || 'Unknown Location',
        attachments: attachments.map((attachment, index) => ({ 
          id: index, 
          url: attachment.preview, 
          name: attachment.file.name 
        })),
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
              <GUCombobox
                label="Location"
                value={location}
                onChange={setLocation}
                options={locationOptions}
                placeholder="Select location..."
                searchPlaceholder="Search for site..."
              />
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
                    max={getTodayLocalDate()}
                    onChange={(e) => handleDateChange(e.target.value, setMaintenanceDate)}
                    className="form-input-incident"
                    required
                  />
                  {dateError && (
                    <span style={{ color: '#EF4444', fontSize: '0.875rem', marginTop: '0.25rem', display: 'block' }}>
                      {dateError}
                    </span>
                  )}
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
                    onChange={(e) => handleTimeChange(e.target.value, maintenanceDate, setMaintenanceTime)}
                    className="form-input-incident"
                    required
                  />
                  {timeError && (
                    <span style={{ color: '#EF4444', fontSize: '0.875rem', marginTop: '0.25rem', display: 'block' }}>
                      {timeError}
                    </span>
                  )}
                </div>
                <GUSelect
                  label="Category"
                  value={maintenanceCategory}
                  onChange={setMaintenanceCategory}
                  options={[
                    { value: '', label: 'Select...' },
                    { value: 'Electrical', label: 'Electrical' },
                    { value: 'Plumbing', label: 'Plumbing' },
                    { value: 'HVAC', label: 'HVAC' },
                    { value: 'Access Control', label: 'Access Control' },
                    { value: 'Safety Hazard', label: 'Safety Hazard' },
                    { value: 'General', label: 'General' }
                  ]}
                  placeholder="Select..."
                  required
                />
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
                <GUSelect
                  label="Priority"
                  value={priority}
                  onChange={(val) => setPriority(val as 'normal' | 'high')}
                  options={[
                    { value: 'normal', label: 'Normal' },
                    { value: 'high', label: 'High' }
                  ]}
                  required
                />
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
              
              <UploadedFilesList />
            </div>

            {/* Action Buttons */}
            <div className="modal-actions">
              <button type="button" className="button-secondary" onClick={onClose}>
                Cancel
              </button>
              
              {/* Resubmission Mode: Show Save Draft + Resubmit for Review */}
              {isResubmission && onResubmitForReview ? (
                <>
                  <button 
                    type="button" 
                    className="button-secondary" 
                    onClick={handleSaveAsDraft}
                    style={{ 
                      marginLeft: 'auto', 
                      background: 'rgba(59, 130, 246, 0.1)', 
                      color: '#3B82F6', 
                      border: '1px solid rgba(59, 130, 246, 0.3)'
                    }}
                  >
                    Save Draft
                  </button>
                  <button 
                    type="button"
                    className="button-primary"
                    onClick={handleResubmitForReview}
                    style={{ minWidth: '180px' }}
                  >
                    Resubmit for Review
                  </button>
                </>
              ) : (
                /* Normal Mode: Show Save as Draft (optional) + Submit/Create */
                <>
                  {onSaveAsDraft && (
                    <button 
                      type="button" 
                      className="button-secondary" 
                      onClick={handleSaveAsDraft}
                      style={{ marginLeft: 'auto', background: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6', border: '1px solid rgba(59, 130, 246, 0.3)' }}
                    >
                      Save as Draft
                    </button>
                  )}
                  <button type="submit" className="button-primary">
                    {initialData ? 'Submit Request' : 'Create Request'}
                  </button>
                </>
              )}
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Render Disciplinary Form with complete HR instrument fields
  if (reportType === 'disciplinary') {
    // Mock guard list for Employee Name dropdown
    const guardList = [
      'John Smith',
      'Maria Garcia',
      'James Rodriguez',
      'Sarah Johnson',
      'Michael Chen',
      'Lisa Anderson'
    ];

    const handleDisciplinarySubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!employeeName || !violationType || !disciplineLevel || !narrativeOfEvents || !disciplinaryDate) {
        return;
      }
      
      // Validate date and time are not in the future
      if (!validateDate(disciplinaryDate)) {
        return;
      }
      if (!validateTime(disciplinaryTime, disciplinaryDate)) {
        return;
      }
      
      onSubmit({ 
        caseId: caseId,  // Pre-generated Case ID from parent (e.g., "#DIS-2026-000002")
        content: narrativeOfEvents,
        site: site || 'Unknown Location',
        priority: disciplineLevel.includes('Suspension') || disciplineLevel.includes('Termination') || disciplineLevel.includes('Final Warning') ? 'high' : 'normal',
        location: site || 'Unknown Location',
        date: disciplinaryDate,
        time: disciplinaryTime,
        narrativeOnly: narrativeOfEvents,
        // Disciplinary-specific fields
        employeeName: employeeName,
        violationType: violationType,
        disciplineLevel: disciplineLevel,
        narrativeOfEvents: narrativeOfEvents,
        correctiveAction: correctiveAction,
        disciplinaryDate: disciplinaryDate,
        disciplinaryTime: disciplinaryTime
      });
      
      // Reset form
      resetDisciplinaryForm();
      onClose();
    };

    const resetDisciplinaryForm = () => {
      setEmployeeName('');
      setViolationType('');
      setDisciplineLevel('');
      setNarrativeOfEvents('');
      setCorrectiveAction('');
      setDisciplinaryDate('');
      setDisciplinaryTime('');
      setSite('');
    };

    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="create-report-modal incident-form-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <div className="modal-title-with-icon">
              <span className="report-type-emoji">{getReportIcon()}</span>
              <h2>{isResubmission ? `Revise & Resubmit - ${getReportTitle()}` : getReportTitle()}</h2>
            </div>
            <button className="modal-close-btn" onClick={onClose}>
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleDisciplinarySubmit} className="modal-body incident-form-body">
            {/* Revision Banner - Only shown when resubmitting a rejected/needs_revision report */}
            {isResubmission && (decision_note || rejectionNote || initialData?.status === 'rejected' || initialData?.status === 'needs_revision') && renderRevisionBanner()}
            
            {/* HEADER ROW 1: Reporting Officer & Disciplinary Case ID (Read-only) */}
            <div className="form-section header-context-section">
              <div className="form-row-2col">
                <div className="form-group-incident">
                  <label htmlFor="reporting-officer-disc" className="form-label-incident">
                    Reporting Officer
                  </label>
                  <input
                    type="text"
                    id="reporting-officer-disc"
                    value={officerName}
                    disabled
                    className="form-input-incident form-input-disabled"
                  />
                </div>
                <div className="form-group-incident">
                  <label htmlFor="disciplinary-case-id" className="form-label-incident">
                    Disciplinary Case ID
                  </label>
                  <input
                    type="text"
                    id="disciplinary-case-id"
                    value={caseId || 'Generating...'}
                    disabled
                    className="form-input-incident form-input-disabled"
                    style={{ backgroundColor: '#1a2332', color: '#6b7280', fontWeight: '500' }}
                  />
                </div>
              </div>
            </div>

            {/* ROW 2: Date & Time */}
            <div className="form-section">
              <div className="form-row-2col">
                <div className="form-group-incident">
                  <label htmlFor="disc-date" className="form-label-incident">
                    <Calendar size={16} className="label-icon-incident" />
                    Date of Incident
                  </label>
                  <input
                    type="date"
                    id="disc-date"
                    value={disciplinaryDate}
                    max={getTodayLocalDate()}
                    onChange={(e) => handleDateChange(e.target.value, setDisciplinaryDate)}
                    className="form-input-incident"
                    required
                  />
                  {dateError && (
                    <span style={{ color: '#EF4444', fontSize: '0.875rem', marginTop: '0.25rem', display: 'block' }}>
                      {dateError}
                    </span>
                  )}
                </div>
                <div className="form-group-incident">
                  <label htmlFor="disc-time" className="form-label-incident">
                    <Clock size={16} className="label-icon-incident" />
                    Time of Incident
                  </label>
                  <input
                    type="time"
                    id="disc-time"
                    value={disciplinaryTime}
                    onChange={(e) => handleTimeChange(e.target.value, disciplinaryDate, setDisciplinaryTime)}
                    className="form-input-incident"
                    required
                  />
                  {timeError && (
                    <span style={{ color: '#EF4444', fontSize: '0.875rem', marginTop: '0.25rem', display: 'block' }}>
                      {timeError}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* ROW 3: Employee Name | Site/Location */}
            <div className="form-section">
              <div className="form-row-2col">
                <GUSelect
                  label="Employee Name"
                  value={employeeName}
                  onChange={setEmployeeName}
                  options={[
                    { value: '', label: 'Select guard...' },
                    ...guardList.map(guard => ({ value: guard, label: guard }))
                  ]}
                  placeholder="Select guard..."
                  required
                />
                <div className="form-group-incident">
                  <label htmlFor="site-disc" className="form-label-incident">
                    Site/Location
                  </label>
                  <input
                    type="text"
                    id="site-disc"
                    value={site}
                    onChange={(e) => setSite(e.target.value)}
                    placeholder="e.g., Building A - Main Entrance"
                    className="form-input-incident"
                    required
                  />
                </div>
              </div>
            </div>

            {/* ROW 2: Violation Type | Level of Discipline */}
            <div className="form-section">
              <div className="form-row-2col">
                <GUSelect
                  label="Violation Type"
                  value={violationType}
                  onChange={setViolationType}
                  options={[
                    { value: '', label: 'Select violation...' },
                    { value: 'Attendance / Lateness', label: 'Attendance / Lateness' },
                    { value: 'Uniform / Appearance', label: 'Uniform / Appearance' },
                    { value: 'Insubordination', label: 'Insubordination' },
                    { value: 'Performance / SOP Violation', label: 'Performance / SOP Violation' },
                    { value: 'Safety Violation', label: 'Safety Violation' },
                    { value: 'Conduct Unbecoming', label: 'Conduct Unbecoming' }
                  ]}
                  placeholder="Select violation..."
                  required
                />
                <GUSelect
                  label="Level of Discipline"
                  value={disciplineLevel}
                  onChange={setDisciplineLevel}
                  options={[
                    { value: '', label: 'Select level...' },
                    { value: 'Verbal Warning', label: 'Verbal Warning' },
                    { value: 'Written Warning (1st)', label: 'Written Warning (1st)' },
                    { value: 'Written Warning (2nd)', label: 'Written Warning (2nd)' },
                    { value: 'Final Warning', label: 'Final Warning' },
                    { value: 'Suspension', label: 'Suspension' },
                    { value: 'Termination Recommendation', label: 'Termination Recommendation' }
                  ]}
                  placeholder="Select level..."
                  required
                />
              </div>
            </div>

            {/* ROW 3: Narrative of Events (Large textarea) */}
            <div className="form-section">
              <div className="form-group-incident">
                <label htmlFor="narrative-of-events" className="form-label-incident">
                  Narrative of Events
                </label>
                <textarea
                  id="narrative-of-events"
                  value={narrativeOfEvents}
                  onChange={(e) => setNarrativeOfEvents(e.target.value)}
                  placeholder="Provide a detailed account of the policy violation, including dates, times, witnesses, and specific actions..."
                  className="form-textarea-incident"
                  rows={10}
                  required
                />
              </div>
            </div>

            {/* ROW 4: Corrective Action Plan (Medium textarea) */}
            <div className="form-section">
              <div className="form-group-incident">
                <label htmlFor="corrective-action" className="form-label-incident">
                  Corrective Action / Expected Improvement
                </label>
                <textarea
                  id="corrective-action"
                  value={correctiveAction}
                  onChange={(e) => setCorrectiveAction(e.target.value)}
                  placeholder="Describe steps the employee must take to correct this behavior..."
                  className="form-textarea-incident"
                  rows={6}
                  required
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="modal-actions">
              <button type="button" className="button-secondary" onClick={onClose}>
                Cancel
              </button>
              
              {/* Resubmission Mode: Show Save Draft + Resubmit for Review */}
              {isResubmission && onResubmitForReview ? (
                <>
                  <button 
                    type="button" 
                    className="button-secondary" 
                    onClick={handleSaveAsDraft}
                    style={{ 
                      marginLeft: 'auto', 
                      background: 'rgba(59, 130, 246, 0.1)', 
                      color: '#3B82F6', 
                      border: '1px solid rgba(59, 130, 246, 0.3)'
                    }}
                  >
                    Save Draft
                  </button>
                  <button 
                    type="button"
                    className="button-primary"
                    onClick={handleResubmitForReview}
                    style={{ minWidth: '180px' }}
                  >
                    Resubmit for Review
                  </button>
                </>
              ) : (
                /* Normal Mode: Show Save as Draft (optional) + Submit/Create */
                <>
                  {onSaveAsDraft && (
                    <button 
                      type="button" 
                      className="button-secondary" 
                      onClick={handleSaveAsDraft}
                      style={{ marginLeft: 'auto', background: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6', border: '1px solid rgba(59, 130, 246, 0.3)' }}
                    >
                      Save as Draft
                    </button>
                  )}
                  <button type="submit" className="button-primary">
                    {initialData ? 'Submit Disciplinary Action' : 'Submit Disciplinary Action'}
                  </button>
                </>
              )}
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Render Shift Pass-On Log form
  if (reportType === 'shift-passon') {
    const handleShiftPassOnSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!location || !shiftPassOnNotes) {
        return;
      }
      
      onSubmit({ 
        caseId: caseId,  // Pre-generated SPO ID from parent (e.g., "#SPO-2026-000001")
        content: shiftPassOnNotes,
        site: location,
        priority: 'normal',
        location: location,
        narrativeOnly: shiftPassOnNotes,
        shift: shiftPassOnShift
      });
      
      // Reset form
      resetShiftPassOnForm();
      onClose();
    };

    const resetShiftPassOnForm = () => {
      setShiftPassOnNotes('');
      setShiftPassOnShift('');
      setLocation('');
    };

    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="create-report-modal incident-form-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <div className="modal-title-with-icon">
              <span className="report-type-emoji">{getReportIcon()}</span>
              <h2>{isResubmission ? `Revise & Resubmit - ${getReportTitle()}` : getReportTitle()}</h2>
            </div>
            <button className="modal-close-btn" onClick={onClose}>
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleShiftPassOnSubmit} className="modal-body incident-form-body">
            {/* Revision Banner - Only shown when resubmitting a rejected/needs_revision report */}
            {isResubmission && (decision_note || rejectionNote || initialData?.status === 'rejected' || initialData?.status === 'needs_revision') && renderRevisionBanner()}
            
            {/* INTERNAL ONLY WARNING BANNER */}
            <div className="form-section" style={{ 
              background: 'rgba(239, 68, 68, 0.1)', 
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '8px',
              padding: '12px 16px',
              marginBottom: '20px'
            }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px',
                color: '#EF4444',
                fontSize: '13px',
                fontWeight: '600'
              }}>
                <span style={{ fontSize: '16px' }}>🔒</span>
                <span>INTERNAL ONLY</span>
              </div>
              <p style={{ 
                color: '#FCA5A5', 
                fontSize: '12px', 
                marginTop: '4px',
                marginLeft: '24px'
              }}>
                This internal log will NOT be sent to clients. Filed to Internal Ops Vault only.
              </p>
            </div>

            {/* HEADER: Reporting Officer & Pass-On Log ID (Read-only) */}
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
                    readOnly
                    className="form-input-incident form-input-disabled"
                    style={{ 
                      backgroundColor: '#1a2332', 
                      color: '#6b7280', 
                      cursor: 'default',
                      userSelect: 'text'
                    }}
                  />
                </div>
                <div className="form-group-incident">
                  <label htmlFor="pass-on-log-id" className="form-label-incident">
                    Pass-On Log ID
                  </label>
                  <input
                    type="text"
                    id="pass-on-log-id"
                    value={caseId || 'Generating...'}
                    readOnly
                    className="form-input-incident form-input-disabled"
                    style={{ 
                      backgroundColor: '#1a2332', 
                      color: '#6b7280', 
                      fontWeight: '500',
                      cursor: 'default',
                      userSelect: 'text'
                    }}
                  />
                </div>
              </div>
            </div>

            {/* ROW 2: Location/Site (Searchable Dropdown) */}
            <div className="form-section">
              <GUCombobox
                label="Site / Location"
                value={location}
                onChange={setLocation}
                options={locationOptions}
                placeholder="Select location..."
                searchPlaceholder="Search for site..."
                required
              />
            </div>

            {/* ROW 3: Shift Selection (Custom Themed Dropdown) */}
            <div className="form-section">
              <GUSelect
                label="Shift"
                value={shiftPassOnShift}
                onChange={setShiftPassOnShift}
                options={[
                  { value: 'Day', label: 'Day Shift' },
                  { value: 'Swing', label: 'Swing Shift' },
                  { value: 'Overnight', label: 'Overnight Shift' }
                ]}
              />
            </div>

            {/* ROW 4: Handover Notes (Full Width) */}
            <div className="form-section">
              <div className="form-group-incident">
                <label htmlFor="handover-notes" className="form-label-incident">
                  <span className="required-asterisk">* </span>Handover Notes
                </label>
                <textarea
                  id="handover-notes"
                  value={shiftPassOnNotes}
                  onChange={(e) => setShiftPassOnNotes(e.target.value)}
                  placeholder="Document key information for the incoming shift: ongoing situations, equipment status, notable observations, follow-up items..."
                  className="form-textarea-incident"
                  rows={10}
                  required
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="modal-actions">
              <button type="button" className="button-secondary" onClick={onClose}>
                Cancel
              </button>
              
              {/* Resubmission Mode: Show Save Draft + Resubmit for Review */}
              {isResubmission && onResubmitForReview ? (
                <>
                  <button 
                    type="button" 
                    className="button-secondary" 
                    onClick={handleSaveAsDraft}
                    style={{ 
                      marginLeft: 'auto', 
                      background: 'rgba(59, 130, 246, 0.1)', 
                      color: '#3B82F6', 
                      border: '1px solid rgba(59, 130, 246, 0.3)'
                    }}
                  >
                    Save Draft
                  </button>
                  <button 
                    type="button"
                    className="button-primary"
                    onClick={handleResubmitForReview}
                    style={{ minWidth: '180px' }}
                  >
                    Resubmit for Review
                  </button>
                </>
              ) : (
                /* Normal Mode: Show Save as Draft (optional) + Submit/Create */
                <>
                  {onSaveAsDraft && (
                    <button 
                      type="button" 
                      className="button-secondary" 
                      onClick={handleSaveAsDraft}
                      style={{ marginLeft: 'auto', background: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6', border: '1px solid rgba(59, 130, 246, 0.3)' }}
                    >
                      Save as Draft
                    </button>
                  )}
                  <button type="submit" className="button-primary">
                    {initialData ? 'Create Log' : 'Create Log'}
                  </button>
                </>
              )}
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
            <h2>{isResubmission ? `Revise & Resubmit - ${getReportTitle()}` : getReportTitle()}</h2>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleStandardSubmit} className="modal-body">
          {/* Revision Banner - Only shown when resubmitting a rejected/needs_revision report */}
          {isResubmission && (decision_note || rejectionNote || initialData?.status === 'rejected' || initialData?.status === 'needs_revision') && renderRevisionBanner()}
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