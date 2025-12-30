import React, { useState, useEffect } from 'react';
import { X, Phone, Mail, MapPin, Calendar, Clock, User, FileText, Award, Shield, AlertTriangle, AlertCircle, CheckCircle, ChevronLeft, ChevronRight, Plus, Edit2, Trash2, TrendingUp, UploadCloud, File, Users, Eye, Download, ChevronDown, Upload } from 'lucide-react';
import { LogPerformanceModal } from './LogPerformanceModal';
import { ManualLicenseEntryModal } from './ManualLicenseEntryModal';
import { DocumentModal } from './DocumentModal';

interface Guard {
  id: number;
  name: string;
  role: string;
  status: 'active' | 'on-shift' | 'off-duty';
  phone: string;
  email: string;
  licenseExpiry: string;
  certExpiry: string;
  lastShift: string;
  location: string;
  shiftsThisWeek: number;
  hoursThisWeek: number;
  imageUrl?: string;
  isFrozen?: boolean;
  emergencyContact?: string;
  emergencyPhone?: string;
  badgeId?: string;
  dateOfHire?: string;
  roleClassification?: string;
  primarySite?: string;
}

interface GuardDetailSlideOverProps {
  guard: Guard | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: (updatedGuard: Guard) => void;
  shifts?: Shift[];
  onShiftsUpdate?: (shifts: Shift[]) => void;
  documents?: Record<number, Array<{
    id: number;
    name: string;
    category: 'legal' | 'training' | 'employment';
    uploadedDate: string;
    expiryDate?: string;
    status: 'valid' | 'expiring' | 'missing';
    daysUntilExpiry?: number;
    fileUrl?: string;
    fileSize?: string;
    required: boolean;
  }>>;
  onDocumentsUpdate?: (documents: Record<number, Array<{
    id: number;
    name: string;
    category: 'legal' | 'training' | 'employment';
    uploadedDate: string;
    expiryDate?: string;
    status: 'valid' | 'expiring' | 'missing';
    daysUntilExpiry?: number;
    fileUrl?: string;
    fileSize?: string;
    required: boolean;
  }>>) => void;
}

type TabId = 'overview' | 'schedule' | 'documents' | 'performance';

interface Shift {
  id: number;
  guardId?: number;
  site: string;
  date: string;
  startTime: string;
  endTime: string;
  instructions: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  hours: number;
  createdBy: string;
  createdAt: string;
}

export function GuardDetailSlideOver({ guard, isOpen, onClose, onUpdate, shifts: externalShifts, onShiftsUpdate, documents: externalDocuments, onDocumentsUpdate }: GuardDetailSlideOverProps) {
  const [activeTab, setActiveTab] = useState<TabId>('performance');
  const [isAccessFrozen, setIsAccessFrozen] = useState(false);
  const [showFreezeConfirm, setShowFreezeConfirm] = useState(false);
  const [showUnfreezeConfirm, setShowUnfreezeConfirm] = useState(false);

  // Sync isAccessFrozen with guard.isFrozen when guard changes
  useEffect(() => {
    if (guard) {
      setIsAccessFrozen(guard.isFrozen || false);
    }
  }, [guard]);

  // Schedule state
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0);
  const [showAddShiftModal, setShowAddShiftModal] = useState(false);
  const [showEditShiftModal, setShowEditShiftModal] = useState(false);
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);

  // Edit Profile state
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [editProfileForm, setEditProfileForm] = useState({
    name: '',
    phone: '',
    email: '',
    emergencyContact: '',
    emergencyPhone: '',
    badgeId: '',
    dateOfHire: '',
    roleClassification: '',
    primarySite: ''
  });

  // Performance Modal state
  const [showPerformanceModal, setShowPerformanceModal] = useState(false);
  const [editingLogId, setEditingLogId] = useState<number | null>(null);
  const [showDeleteLogConfirm, setShowDeleteLogConfirm] = useState(false);
  const [deletingLogId, setDeletingLogId] = useState<number | null>(null);

  // Manual License Entry Modal state
  const [showLicenseModal, setShowLicenseModal] = useState(false);
  const [editingLicenseId, setEditingLicenseId] = useState<number | null>(null);
  const [showDeleteLicenseConfirm, setShowDeleteLicenseConfirm] = useState(false);
  const [deletingLicenseId, setDeletingLicenseId] = useState<number | null>(null);

  // Profile Picture state
  const [profilePicture, setProfilePicture] = useState<string | null>(null);

  // Document accordion state
  const [legalAccordionOpen, setLegalAccordionOpen] = useState(true);
  const [trainingAccordionOpen, setTrainingAccordionOpen] = useState(true);
  const [employmentAccordionOpen, setEmploymentAccordionOpen] = useState(true);

  // Documents state - stored per guard ID
  const [allGuardDocuments, setAllGuardDocuments] = useState<Record<number, Array<{
    id: number;
    name: string;
    category: 'legal' | 'training' | 'employment';
    uploadedDate: string;
    expiryDate?: string;
    status: 'valid' | 'expiring' | 'missing';
    daysUntilExpiry?: number;
    fileUrl?: string;
    fileSize?: string;
    required: boolean;
    signedDate?: string;
    taxYear?: string;
    submittedDate?: string;
  }>>>(externalDocuments || {});

  const [documents, setDocuments] = useState<Array<{
    id: number;
    name: string;
    category: 'legal' | 'training' | 'employment';
    uploadedDate: string;
    expiryDate?: string;
    status: 'valid' | 'expiring' | 'missing';
    daysUntilExpiry?: number;
    fileUrl?: string;
    fileSize?: string;
    required: boolean;
    signedDate?: string;
    taxYear?: string;
    submittedDate?: string;
  }>>([]);

  // Initialize documents for each guard when they're first opened
  useEffect(() => {
    if (guard) {
      // If we don't have documents for this guard yet, initialize them
      if (!allGuardDocuments[guard.id]) {
        const defaultDocuments = [
          {
            id: 1,
            name: 'Security Guard Card',
            category: 'legal' as const,
            uploadedDate: 'Dec 15, 2024',
            expiryDate: '10/15/2025',
            status: 'valid' as const,
            daysUntilExpiry: 289,
            fileUrl: '#',
            fileSize: '2.4 MB',
            required: true
          },
          {
            id: 2,
            name: 'Driver License',
            category: 'legal' as const,
            uploadedDate: 'Dec 10, 2024',
            expiryDate: '01/10/2025',
            status: 'expiring' as const,
            daysUntilExpiry: 12,
            fileUrl: '#',
            fileSize: '1.8 MB',
            required: true
          },
          {
            id: 3,
            name: 'Passport / Work Visa',
            category: 'legal' as const,
            uploadedDate: '',
            status: 'missing' as const,
            required: true
          },
          {
            id: 4,
            name: 'First Aid / CPR Certificate',
            category: 'training' as const,
            uploadedDate: 'Nov 28, 2024',
            expiryDate: '05/22/2025',
            status: 'valid' as const,
            daysUntilExpiry: 145,
            fileUrl: '#',
            fileSize: '1.5 MB',
            required: true
          },
          {
            id: 5,
            name: 'Firearms Training Certificate',
            category: 'training' as const,
            uploadedDate: '',
            status: 'missing' as const,
            required: true
          },
          {
            id: 6,
            name: 'Signed Offer Letter',
            category: 'employment' as const,
            uploadedDate: 'Dec 12, 2024',
            status: 'valid' as const,
            fileUrl: '#',
            fileSize: '1.2 MB',
            required: true,
            signedDate: 'Dec 12, 2024'
          },
          {
            id: 7,
            name: 'W-4 Tax Form',
            category: 'employment' as const,
            uploadedDate: 'Dec 10, 2024',
            status: 'valid' as const,
            fileUrl: '#',
            fileSize: '0.8 MB',
            required: true,
            taxYear: '2024'
          },
          {
            id: 9,
            name: 'Direct Deposit Authorization',
            category: 'employment' as const,
            uploadedDate: '',
            status: 'missing' as const,
            required: true
          }
        ];
        
        setAllGuardDocuments(prev => ({
          ...prev,
          [guard.id]: defaultDocuments
        }));
        setDocuments(defaultDocuments);
      } else {
        // Load existing documents for this guard
        setDocuments(allGuardDocuments[guard.id]);
      }
    }
  }, [guard?.id]);

  // Sync documents back to parent component whenever they change
  useEffect(() => {
    if (onDocumentsUpdate && Object.keys(allGuardDocuments).length > 0) {
      onDocumentsUpdate(allGuardDocuments);
    }
  }, [allGuardDocuments, onDocumentsUpdate]);

  // Document modal state
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [editingDocumentId, setEditingDocumentId] = useState<number | null>(null);
  const [showDeleteDocumentConfirm, setShowDeleteDocumentConfirm] = useState(false);
  const [deletingDocumentId, setDeletingDocumentId] = useState<number | null>(null);
  const [showDocumentViewer, setShowDocumentViewer] = useState(false);
  const [viewingDocumentId, setViewingDocumentId] = useState<number | null>(null);

  // Notification modal state
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [notificationDocumentId, setNotificationDocumentId] = useState<number | null>(null);
  const [notificationSent, setNotificationSent] = useState(false);

  // Sync profile picture with guard's imageUrl when guard changes
  useEffect(() => {
    if (guard) {
      setProfilePicture(guard.imageUrl || null);
    }
  }, [guard]);

  // Licenses state (OLD - TO BE REMOVED)
  const [licensesOLD, setLicensesOLD] = useState<Array<{
    id: number;
    type: string;
    number: string;
    expiry: string;
    status: 'valid' | 'warning' | 'expired';
    daysUntilExpiry: number;
  }>>([
    {
      id: 1,
      type: 'Security Guard Card',
      number: 'G-882910',
      expiry: '12/31/2025',
      status: 'valid',
      daysUntilExpiry: 368
    },
    {
      id: 2,
      type: 'Firearm Permit',
      number: 'FP-12345',
      expiry: '03/15/2025',
      status: 'warning',
      daysUntilExpiry: 77
    },
    {
      id: 3,
      type: 'First Aid / CPR',
      number: 'RC-67890',
      expiry: '09/20/2025',
      status: 'valid',
      daysUntilExpiry: 266
    }
  ]);

  // Performance logs state (OLD - TO BE REMOVED)
  const [performanceLogsOLD, setPerformanceLogsOLD] = useState<Array<{
    id: number;
    sentiment: 'positive' | 'neutral' | 'negative';
    category: string;
    description: string;
    createdBy: string;
    createdAt: string;
    notifyGuard: boolean;
  }>>([
    {
      id: 1,
      sentiment: 'negative',
      category: 'attendance',
      description: 'Arrived 15 minutes late without prior notice.',
      createdBy: 'Sarah Admin',
      createdAt: 'Dec 15, 2024',
      notifyGuard: false
    },
    {
      id: 2,
      sentiment: 'positive',
      category: 'client-feedback',
      description: 'Client reported excellent response during emergency situation.',
      createdBy: 'Building A Manager',
      createdAt: 'Dec 10, 2024',
      notifyGuard: true
    }
  ]);

  // Licenses state - stored per guard ID  
  const [allGuardLicenses, setAllGuardLicenses] = useState<Record<number, Array<{
    id: number;
    type: string;
    number: string;
    expiry: string;
    status: 'valid' | 'warning' | 'expired';
    daysUntilExpiry: number;
  }>>>({});

  const [licenses, setLicenses] = useState<Array<{
    id: number;
    type: string;
    number: string;
    expiry: string;
    status: 'valid' | 'warning' | 'expired';
    daysUntilExpiry: number;
  }>>([]);

  // Performance logs state - stored per guard ID
  const [allGuardPerformanceLogs, setAllGuardPerformanceLogs] = useState<Record<number, Array<{
    id: number;
    sentiment: 'positive' | 'neutral' | 'negative';
    category: string;
    description: string;
    createdBy: string;
    createdAt: string;
    notifyGuard: boolean;
  }>>>({});

  const [performanceLogs, setPerformanceLogs] = useState<Array<{
    id: number;
    sentiment: 'positive' | 'neutral' | 'negative';
    category: string;
    description: string;
    createdBy: string;
    createdAt: string;
    notifyGuard: boolean;
  }>>([]);

  // Initialize licenses and performance logs for each guard
  useEffect(() => {
    if (guard) {
      // Initialize licenses
      if (!allGuardLicenses[guard.id]) {
        const defaultLicenses = [
          { id: 1, type: 'Security Guard Card', number: 'G-882910', expiry: '12/31/2025', status: 'valid' as const, daysUntilExpiry: 368 },
          { id: 2, type: 'Firearm Permit', number: 'FP-12345', expiry: '03/15/2025', status: 'warning' as const, daysUntilExpiry: 77 },
          { id: 3, type: 'First Aid / CPR', number: 'RC-67890', expiry: '09/20/2025', status: 'valid' as const, daysUntilExpiry: 266 }
        ];
        setAllGuardLicenses(prev => ({ ...prev, [guard.id]: defaultLicenses }));
        setLicenses(defaultLicenses);
      } else {
        setLicenses(allGuardLicenses[guard.id]);
      }

      // Initialize performance logs
      if (!allGuardPerformanceLogs[guard.id]) {
        const defaultLogs = [
          { id: 1, sentiment: 'negative' as const, category: 'attendance', description: 'Arrived 15 minutes late without prior notice.', createdBy: 'Sarah Admin', createdAt: 'Dec 15, 2024', notifyGuard: false },
          { id: 2, sentiment: 'positive' as const, category: 'client-feedback', description: 'Client reported excellent response during emergency situation.', createdBy: 'Building A Manager', createdAt: 'Dec 10, 2024', notifyGuard: true }
        ];
        setAllGuardPerformanceLogs(prev => ({ ...prev, [guard.id]: defaultLogs }));
        setPerformanceLogs(defaultLogs);
      } else {
        setPerformanceLogs(allGuardPerformanceLogs[guard.id]);
      }
    }
  }, [guard?.id]);

  // Add shift form
  const [newShift, setNewShift] = useState({
    site: 'Building A',
    date: '',
    startTime: '08:00',
    endTime: '16:00',
    instructions: ''
  });

  // Edit shift form
  const [editShiftForm, setEditShiftForm] = useState({
    site: '',
    date: '',
    startTime: '',
    endTime: '',
    instructions: '',
    status: 'scheduled' as Shift['status']
  });

  // Mock shifts data
  const [shifts, setShifts] = useState<Shift[]>([]);

  // Initialize shifts when guard changes or external shifts are provided
  useEffect(() => {
    if (guard) {
      if (externalShifts) {
        // Use external shifts filtered for this guard
        const guardShifts = externalShifts.filter(shift => shift.guardId === guard.id);
        setShifts(guardShifts);
      } else {
        // Fallback to mock data if no external shifts provided
        setShifts([
          {
            id: guard.id * 1000 + 1,
            site: 'Building A - Lobby',
            date: '2025-12-22',
            startTime: '08:00',
            endTime: '16:00',
            instructions: 'Monitor main lobby. Check IDs for all visitors.',
            status: 'completed',
            hours: 8,
            createdBy: 'Sarah Admin',
            createdAt: '2025-12-20'
          },
          {
            id: guard.id * 1000 + 2,
            site: 'Building B - Patrol',
            date: '2025-12-23',
            startTime: '08:00',
            endTime: '16:00',
            instructions: 'Complete all patrol checkpoints. Submit hourly logs.',
            status: 'in-progress',
            hours: 8,
            createdBy: 'Sarah Admin',
            createdAt: '2025-12-20'
          },
          {
            id: guard.id * 1000 + 3,
            site: 'Building C - Gate',
            date: '2025-12-24',
            startTime: '12:00',
            endTime: '20:00',
            instructions: 'Gate monitoring. Vehicle access control.',
            status: 'scheduled',
            hours: 8,
            createdBy: 'Sarah Admin',
            createdAt: '2025-12-20'
          }
        ]);
      }
    }
  }, [guard, externalShifts]);

  // Week navigation functions
  const getWeekDateRange = (offset: number): string => {
    // Start from Dec 22, 2025 (which is a Monday) as the base week
    const baseDate = new Date('2025-12-22');
    
    // Calculate the Monday of the current offset week
    const monday = new Date(baseDate);
    monday.setDate(baseDate.getDate() + (offset * 7));
    
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    
    const formatDate = (date: Date) => {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${months[date.getMonth()]} ${date.getDate()}`;
    };
    
    return `${formatDate(monday)} - ${formatDate(sunday)}, ${sunday.getFullYear()}`;
  };

  const getWeekStartDate = (offset: number): Date => {
    const baseDate = new Date('2025-12-22');
    const monday = new Date(baseDate);
    monday.setDate(baseDate.getDate() + (offset * 7));
    return monday;
  };

  const getWeekEndDate = (offset: number): Date => {
    const monday = getWeekStartDate(offset);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return sunday;
  };

  const isDateInCurrentWeek = (dateStr: string, offset: number): boolean => {
    // Parse date as local date to avoid timezone issues
    const [year, month, day] = dateStr.split('-').map(num => parseInt(num));
    const date = new Date(year, month - 1, day);
    const weekStart = getWeekStartDate(offset);
    const weekEnd = getWeekEndDate(offset);
    
    // Set times to midnight for accurate comparison
    date.setHours(0, 0, 0, 0);
    weekStart.setHours(0, 0, 0, 0);
    weekEnd.setHours(23, 59, 59, 999);
    
    return date >= weekStart && date <= weekEnd;
  };

  const handlePreviousWeek = () => setCurrentWeekOffset(prev => prev - 1);
  const handleNextWeek = () => setCurrentWeekOffset(prev => prev + 1);

  // Add shift functions
  const handleOpenAddShift = () => setShowAddShiftModal(true);
  
  const handleCloseAddShift = () => {
    setShowAddShiftModal(false);
    setNewShift({
      site: 'Building A',
      date: '',
      startTime: '08:00',
      endTime: '16:00',
      instructions: ''
    });
  };

  const handleAddShift = () => {
    const start = parseInt(newShift.startTime.split(':')[0]);
    const end = parseInt(newShift.endTime.split(':')[0]);
    const hours = end - start;

    // Determine shift status based on current date and time
    const now = new Date();
    const [shiftYear, shiftMonth, shiftDay] = newShift.date.split('-').map(num => parseInt(num));
    const [startHour, startMinute] = newShift.startTime.split(':').map(num => parseInt(num));
    const [endHour, endMinute] = newShift.endTime.split(':').map(num => parseInt(num));
    
    const shiftStartDateTime = new Date(shiftYear, shiftMonth - 1, shiftDay, startHour, startMinute);
    const shiftEndDateTime = new Date(shiftYear, shiftMonth - 1, shiftDay, endHour, endMinute);
    
    let status: Shift['status'];
    if (now > shiftEndDateTime) {
      status = 'completed';
    } else if (now >= shiftStartDateTime && now <= shiftEndDateTime) {
      status = 'in-progress';
    } else {
      status = 'scheduled';
    }

    const shift: Shift = {
      id: (guard?.id || 0) * 1000 + shifts.length + 1,
      guardId: guard?.id,
      site: newShift.site,
      date: newShift.date,
      startTime: newShift.startTime,
      endTime: newShift.endTime,
      instructions: newShift.instructions,
      status: status,
      hours: hours,
      createdBy: 'Sarah Admin',
      createdAt: new Date().toISOString().split('T')[0]
    };

    const updatedShifts = [...shifts, shift];
    setShifts(updatedShifts);
    
    // Notify parent component if callback provided
    if (onShiftsUpdate && externalShifts) {
      // Merge with other guards' shifts
      const otherShifts = externalShifts.filter(s => s.guardId !== guard?.id);
      onShiftsUpdate([...otherShifts, ...updatedShifts]);
    }
    
    handleCloseAddShift();
  };

  // Edit shift functions
  const handleOpenEditShift = (shift: Shift) => {
    setSelectedShift(shift);
    setEditShiftForm({
      site: shift.site,
      date: shift.date,
      startTime: shift.startTime,
      endTime: shift.endTime,
      instructions: shift.instructions,
      status: shift.status
    });
    setShowEditShiftModal(true);
  };

  const handleCloseEditShift = () => {
    setShowEditShiftModal(false);
    setSelectedShift(null);
  };

  const handleSaveShift = () => {
    if (!selectedShift) return;

    const start = parseInt(editShiftForm.startTime.split(':')[0]);
    const end = parseInt(editShiftForm.endTime.split(':')[0]);
    const hours = end - start;

    const updatedShifts = shifts.map(shift =>
      shift.id === selectedShift.id
        ? {
            ...shift,
            site: editShiftForm.site,
            date: editShiftForm.date,
            startTime: editShiftForm.startTime,
            endTime: editShiftForm.endTime,
            instructions: editShiftForm.instructions,
            status: editShiftForm.status,
            hours: hours
          }
        : shift
    );

    setShifts(updatedShifts);
    
    // Notify parent component if callback provided
    if (onShiftsUpdate && externalShifts) {
      const otherShifts = externalShifts.filter(s => s.guardId !== guard?.id);
      onShiftsUpdate([...otherShifts, ...updatedShifts]);
    }
    
    handleCloseEditShift();
  };

  const handleDeleteShift = () => {
    if (!selectedShift) return;
    const updatedShifts = shifts.filter(shift => shift.id !== selectedShift.id);
    setShifts(updatedShifts);
    
    // Notify parent component if callback provided
    if (onShiftsUpdate && externalShifts) {
      const otherShifts = externalShifts.filter(s => s.guardId !== guard?.id);
      onShiftsUpdate([...otherShifts, ...updatedShifts]);
    }
    
    handleCloseEditShift();
  };

  // Format functions
  const formatShiftDate = (dateStr: string): string => {
    // Parse date as local date to avoid timezone issues
    const [year, month, day] = dateStr.split('-').map(num => parseInt(num));
    const date = new Date(year, month - 1, day);
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    return `${months[date.getMonth()]} ${date.getDate()}`;
  };

  const formatShiftDateFull = (dateStr: string): string => {
    // Parse date as local date to avoid timezone issues
    const [year, month, day] = dateStr.split('-').map(num => parseInt(num));
    const date = new Date(year, month - 1, day);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[date.getMonth()]} ${date.getDate()}`;
  };

  const formatTime = (time: string): string => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  // Get upcoming and completed shifts
  const upcomingShifts = shifts
    .filter(shift => shift.status === 'scheduled' || shift.status === 'in-progress')
    .filter(shift => isDateInCurrentWeek(shift.date, currentWeekOffset))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const completedShifts = shifts
    .filter(shift => shift.status === 'completed')
    .filter(shift => isDateInCurrentWeek(shift.date, currentWeekOffset))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Calculate weekly utilization from all shifts in the current week
  const allWeekShifts = shifts.filter(shift => isDateInCurrentWeek(shift.date, currentWeekOffset));
  const weeklyHours = allWeekShifts.reduce((total, shift) => total + shift.hours, 0);
  const maxWeeklyHours = 40;
  const utilizationPercentage = Math.min((weeklyHours / maxWeeklyHours) * 100, 100);

  // Handle ESC key to close
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!guard) return null;

  const reliabilityScore = 98;
  const currentLocation = 'Building A - Main Entrance';
  const isOnSite = true;

  const getDaysUntilExpiry = (expiryDate: string): number => {
    // Parse the date string manually to avoid timezone issues
    const months: { [key: string]: number } = {
      'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
      'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
    };
    
    // Parse date in format "MMM DD, YYYY" (e.g., "Sep 15, 2025")
    const parts = expiryDate.split(' ');
    const month = months[parts[0]];
    const day = parseInt(parts[1].replace(',', ''));
    const year = parseInt(parts[2]);
    
    // Create dates at midnight in local timezone
    const expiry = new Date(year, month, day, 0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return Math.round((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  const licenseExpireDays = getDaysUntilExpiry(guard.licenseExpiry);
  const certExpireDays = getDaysUntilExpiry(guard.certExpiry);

  const recentActivity = [
    { time: '08:00 AM', activity: 'Checked in at Building A', icon: CheckCircle, color: 'success' },
    { time: '09:30 AM', activity: 'Patrol Log Submitted', icon: FileText, color: 'success' },
    { time: '11:15 AM', activity: 'Break Started', icon: Clock, color: 'neutral' },
    { time: '11:45 AM', activity: 'Break Ended', icon: Clock, color: 'neutral' },
  ];

  const existingDocuments = [
    { id: 1, name: 'Guard_Card.pdf', uploadedDate: 'Dec 15, 2024', size: '2.4 MB' },
    { id: 2, name: 'W4_Form.pdf', uploadedDate: 'Dec 10, 2024', size: '1.8 MB' },
    { id: 3, name: 'Background_Check.pdf', uploadedDate: 'Dec 5, 2024', size: '3.2 MB' },
    { id: 4, name: 'Training_Certificate.pdf', uploadedDate: 'Nov 28, 2024', size: '1.5 MB' },
  ];

  const handleToggleFreeze = () => {
    if (!isAccessFrozen) {
      // Show confirmation when trying to freeze
      setShowFreezeConfirm(true);
    } else {
      // Show confirmation when trying to unfreeze
      setShowUnfreezeConfirm(true);
    }
  };

  const handleConfirmFreeze = () => {
    setIsAccessFrozen(true);
    setShowFreezeConfirm(false);
    // Update the guard's isFrozen property
    if (onUpdate && guard) {
      onUpdate({
        ...guard,
        isFrozen: true
      });
    }
  };

  const handleCancelFreeze = () => {
    setShowFreezeConfirm(false);
  };

  const handleConfirmUnfreeze = () => {
    setIsAccessFrozen(false);
    setShowUnfreezeConfirm(false);
    // Update the guard's isFrozen property
    if (onUpdate && guard) {
      onUpdate({
        ...guard,
        isFrozen: false
      });
    }
  };

  const handleCancelUnfreeze = () => {
    setShowUnfreezeConfirm(false);
  };

  const handleOpenEditProfile = () => {
    setEditProfileForm({
      name: guard.name,
      phone: guard.phone,
      email: guard.email,
      emergencyContact: guard.emergencyContact || '',
      emergencyPhone: guard.emergencyPhone || '',
      badgeId: guard.badgeId || '',
      dateOfHire: guard.dateOfHire || '',
      roleClassification: guard.roleClassification || '',
      primarySite: guard.primarySite || ''
    });
    setShowEditProfileModal(true);
  };

  const handleCloseEditProfile = () => {
    setShowEditProfileModal(false);
    setShowSaveConfirm(false);
  };

  const handleSaveEditProfile = () => {
    // Show confirmation popup
    setShowSaveConfirm(true);
  };

  const handleConfirmSaveProfile = () => {
    // Update guard details
    if (onUpdate) {
      onUpdate({
        ...guard,
        name: editProfileForm.name,
        phone: editProfileForm.phone,
        email: editProfileForm.email,
        emergencyContact: editProfileForm.emergencyContact,
        emergencyPhone: editProfileForm.emergencyPhone,
        badgeId: editProfileForm.badgeId,
        dateOfHire: editProfileForm.dateOfHire,
        roleClassification: editProfileForm.roleClassification,
        primarySite: editProfileForm.primarySite
      });
    }
    setShowSaveConfirm(false);
    setShowEditProfileModal(false);
  };

  const handleCancelSaveProfile = () => {
    setShowSaveConfirm(false);
  };

  const handleSavePerformanceLog = (logData: {
    sentiment: 'positive' | 'neutral' | 'negative';
    category: string;
    description: string;
    notifyGuard: boolean;
  }) => {
    if (editingLogId) {
      // Update existing log
      const updatedLogs = performanceLogs.map(log =>
        log.id === editingLogId
          ? {
              ...log,
              sentiment: logData.sentiment,
              category: logData.category,
              description: logData.description,
              notifyGuard: logData.notifyGuard
            }
          : log
      );
      setPerformanceLogs(updatedLogs);
      // Update guard-specific logs
      if (guard) {
        setAllGuardPerformanceLogs(prev => ({ ...prev, [guard.id]: updatedLogs }));
      }
      setEditingLogId(null);
    } else {
      // Add new log
      const newLog = {
        id: performanceLogs.length + 1,
        sentiment: logData.sentiment,
        category: logData.category,
        description: logData.description,
        createdBy: 'Sarah Admin',
        createdAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        notifyGuard: logData.notifyGuard
      };
      
      const updatedLogs = [newLog, ...performanceLogs];
      setPerformanceLogs(updatedLogs);
      // Update guard-specific logs
      if (guard) {
        setAllGuardPerformanceLogs(prev => ({ ...prev, [guard.id]: updatedLogs }));
      }
    }
    setShowPerformanceModal(false);
  };

  const handleEditPerformanceLog = (logId: number) => {
    setEditingLogId(logId);
    setShowPerformanceModal(true);
  };

  const handleDeletePerformanceLog = (logId: number) => {
    setDeletingLogId(logId);
    setShowDeleteLogConfirm(true);
  };

  const handleConfirmDeleteLog = () => {
    if (deletingLogId) {
      const updatedLogs = performanceLogs.filter(log => log.id !== deletingLogId);
      setPerformanceLogs(updatedLogs);
      // Update guard-specific logs
      if (guard) {
        setAllGuardPerformanceLogs(prev => ({ ...prev, [guard.id]: updatedLogs }));
      }
      setDeletingLogId(null);
      setShowDeleteLogConfirm(false);
    }
  };

  const handleCancelDeleteLog = () => {
    setDeletingLogId(null);
    setShowDeleteLogConfirm(false);
  };

  const getCategoryLabel = (category: string): string => {
    const labels: { [key: string]: string } = {
      'attendance': 'Attendance',
      'conduct': 'Conduct',
      'performance': 'Performance',
      'client-feedback': 'Client Feedback',
      'training': 'Training',
      'incident': 'Incident',
      '': 'General Note'
    };
    return labels[category] || 'General Note';
  };

  const handleSaveLicense = (licenseData: { type: string; number: string; expiry: string }) => {
    // Calculate days until expiry - parse MM/DD/YYYY format
    const [month, day, year] = licenseData.expiry.split('/').map(num => parseInt(num));
    const expiryDate = new Date(year, month - 1, day, 0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const daysUntilExpiry = Math.round((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    // Determine status based on days until expiry
    let status: 'valid' | 'warning' | 'expired' = 'valid';
    if (daysUntilExpiry < 0) {
      status = 'expired';
    } else if (daysUntilExpiry <= 30) {
      status = 'warning';
    }
    
    if (editingLicenseId) {
      // Update existing license
      const updatedLicenses = licenses.map(license =>
        license.id === editingLicenseId
          ? {
              ...license,
              type: licenseData.type,
              number: licenseData.number,
              expiry: licenseData.expiry,
              status,
              daysUntilExpiry
            }
          : license
      );
      setLicenses(updatedLicenses);
      // Update guard-specific licenses
      if (guard) {
        setAllGuardLicenses(prev => ({ ...prev, [guard.id]: updatedLicenses }));
      }
      setEditingLicenseId(null);
    } else {
      // Create new license
      const newLicense = {
        id: licenses.length + 1,
        type: licenseData.type,
        number: licenseData.number,
        expiry: licenseData.expiry,
        status,
        daysUntilExpiry
      };
      
      // Add to licenses array
      const updatedLicenses = [...licenses, newLicense];
      setLicenses(updatedLicenses);
      // Update guard-specific licenses
      if (guard) {
        setAllGuardLicenses(prev => ({ ...prev, [guard.id]: updatedLicenses }));
      }
    }
  };

  const handleEditLicense = (licenseId: number) => {
    setEditingLicenseId(licenseId);
    setShowLicenseModal(true);
  };

  const handleDeleteLicense = (licenseId: number) => {
    setDeletingLicenseId(licenseId);
    setShowDeleteLicenseConfirm(true);
  };

  const handleConfirmDeleteLicense = () => {
    if (deletingLicenseId) {
      const updatedLicenses = licenses.filter(license => license.id !== deletingLicenseId);
      setLicenses(updatedLicenses);
      // Update guard-specific licenses
      if (guard) {
        setAllGuardLicenses(prev => ({ ...prev, [guard.id]: updatedLicenses }));
      }
      setDeletingLicenseId(null);
      setShowDeleteLicenseConfirm(false);
    }
  };

  const handleCancelDeleteLicense = () => {
    setDeletingLicenseId(null);
    setShowDeleteLicenseConfirm(false);
  };

  const handleProfilePictureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const imageUrl = reader.result as string;
        setProfilePicture(imageUrl);
        // Update guard with new profile picture
        if (guard && onUpdate) {
          onUpdate({ ...guard, imageUrl });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Document management functions
  const handleSaveDocument = (documentData: {
    name: string;
    category: 'legal' | 'training';
    expiryDate?: string;
    fileUrl?: string;
    fileName?: string;
    fileSize?: string;
  }) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let status: 'valid' | 'expiring' | 'missing' = 'missing';
    let daysUntilExpiry: number | undefined;

    if (documentData.fileUrl) {
      if (documentData.expiryDate) {
        // Parse YYYY-MM-DD format from date input
        const [year, month, day] = documentData.expiryDate.split('-').map(num => parseInt(num));
        const expiryDate = new Date(year, month - 1, day, 0, 0, 0, 0);
        daysUntilExpiry = Math.round((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysUntilExpiry < 0) {
          status = 'expiring'; // Expired
        } else if (daysUntilExpiry <= 30) {
          status = 'expiring';
        } else {
          status = 'valid';
        }
      } else {
        status = 'valid'; // No expiry means always valid
      }
    }

    const formatDate = (date: Date) => {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
    };

    const formatExpiryDate = (dateStr: string) => {
      // dateStr is in YYYY-MM-DD format from the date input
      const [year, month, day] = dateStr.split('-').map(num => parseInt(num));
      return `${String(month).padStart(2, '0')}/${String(day).padStart(2, '0')}/${year}`;
    };

    if (editingDocumentId) {
      // Update existing document
      const updatedDocuments = documents.map(doc =>
        doc.id === editingDocumentId
          ? {
              ...doc,
              name: documentData.name,
              category: documentData.category,
              uploadedDate: documentData.fileUrl ? formatDate(today) : doc.uploadedDate,
              expiryDate: documentData.expiryDate ? formatExpiryDate(documentData.expiryDate) : undefined,
              status,
              daysUntilExpiry,
              fileUrl: documentData.fileUrl || doc.fileUrl,
              fileSize: documentData.fileSize || doc.fileSize,
              signedDate: documentData.signedDate || doc.signedDate,
              taxYear: documentData.taxYear || doc.taxYear,
              submittedDate: documentData.submittedDate || doc.submittedDate
            }
          : doc
      );
      setDocuments(updatedDocuments);
      // Update the guard-specific documents
      if (guard) {
        setAllGuardDocuments(prev => ({
          ...prev,
          [guard.id]: updatedDocuments
        }));
      }
      setEditingDocumentId(null);
    } else {
      // Add new document
      const newDocument = {
        id: Math.max(...documents.map(d => d.id), 0) + 1,
        name: documentData.name,
        category: documentData.category,
        uploadedDate: documentData.fileUrl ? formatDate(today) : '',
        expiryDate: documentData.expiryDate ? formatExpiryDate(documentData.expiryDate) : undefined,
        status,
        daysUntilExpiry,
        fileUrl: documentData.fileUrl,
        fileSize: documentData.fileSize,
        required: false,
        signedDate: documentData.signedDate,
        taxYear: documentData.taxYear,
        submittedDate: documentData.submittedDate
      };
      const updatedDocuments = [...documents, newDocument];
      setDocuments(updatedDocuments);
      // Update the guard-specific documents
      if (guard) {
        setAllGuardDocuments(prev => ({
          ...prev,
          [guard.id]: updatedDocuments
        }));
      }
    }
    
    setShowDocumentModal(false);
  };

  const handleAddDocument = () => {
    setEditingDocumentId(null);
    setShowDocumentModal(true);
  };

  const handleEditDocument = (docId: number) => {
    setEditingDocumentId(docId);
    setShowDocumentModal(true);
  };

  const handleDeleteDocument = (docId: number) => {
    setDeletingDocumentId(docId);
    setShowDeleteDocumentConfirm(true);
  };

  // Helper function to check if a document can be deleted
  const canDeleteDocument = (documentName: string): boolean => {
    const nonDeletableDocuments = [
      'Security Guard Card',
      'Driver License',
      'Signed Offer Letter',
      'W-4 Tax Form',
      'Direct Deposit Authorization'
    ];
    return !nonDeletableDocuments.includes(documentName);
  };

  const handleConfirmDeleteDocument = () => {
    if (deletingDocumentId) {
      // If it's a required document, convert it to missing status instead of deleting
      const documentToDelete = documents.find(doc => doc.id === deletingDocumentId);
      if (documentToDelete?.required) {
        const updatedDocuments = documents.map(doc =>
          doc.id === deletingDocumentId
            ? {
                ...doc,
                uploadedDate: '',
                expiryDate: undefined,
                status: 'missing' as const,
                daysUntilExpiry: undefined,
                fileUrl: undefined,
                fileSize: undefined
              }
            : doc
        );
        setDocuments(updatedDocuments);
        // Update the guard-specific documents
        if (guard) {
          setAllGuardDocuments(prev => ({
            ...prev,
            [guard.id]: updatedDocuments
          }));
        }
      } else {
        const updatedDocuments = documents.filter(doc => doc.id !== deletingDocumentId);
        setDocuments(updatedDocuments);
        // Update the guard-specific documents
        if (guard) {
          setAllGuardDocuments(prev => ({
            ...prev,
            [guard.id]: updatedDocuments
          }));
        }
      }
      setDeletingDocumentId(null);
      setShowDeleteDocumentConfirm(false);
    }
  };

  const handleCancelDeleteDocument = () => {
    setDeletingDocumentId(null);
    setShowDeleteDocumentConfirm(false);
  };

  const handleViewDocument = (docId: number) => {
    setViewingDocumentId(docId);
    setShowDocumentViewer(true);
  };

  const handleDownloadDocument = (docId: number) => {
    const document = documents.find(doc => doc.id === docId);
    if (document?.fileUrl) {
      // Create a temporary link and trigger download
      const link = window.document.createElement('a');
      link.href = document.fileUrl;
      link.download = `${document.name}.pdf`;
      link.click();
    }
  };

  const handleRequestUpload = (docId: number) => {
    // Show notification confirmation modal
    setNotificationDocumentId(docId);
    setShowNotificationModal(true);
  };

  const handleSendNotification = () => {
    // Simulate sending notification to guard
    // In a real app, this would trigger an API call to send push notification/email
    console.log(`Notification sent to ${guard.name} for document ID: ${notificationDocumentId}`);
    
    // Show success state
    setNotificationSent(true);
    
    // Reset after 2 seconds
    setTimeout(() => {
      setShowNotificationModal(false);
      setNotificationSent(false);
      setNotificationDocumentId(null);
    }, 2000);
  };

  const handleCancelNotification = () => {
    setShowNotificationModal(false);
    setNotificationDocumentId(null);
    setNotificationSent(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      // Handle file upload
      console.log('File dropped:', file.name);
      // You can add logic here to automatically create a new document
      setShowDocumentModal(true);
    }
  };

  // Get documents by category
  const legalDocuments = documents.filter(doc => doc.category === 'legal');
  const trainingDocuments = documents.filter(doc => doc.category === 'training');
  const employmentDocuments = documents.filter(doc => doc.category === 'employment');

  // Calculate completion badges
  const legalRequired = legalDocuments.filter(doc => doc.required).length;
  const legalCompleted = legalDocuments.filter(doc => doc.required && doc.status !== 'missing').length;
  
  const trainingRequired = trainingDocuments.filter(doc => doc.required).length;
  const trainingCompleted = trainingDocuments.filter(doc => doc.required && doc.status !== 'missing').length;

  const employmentRequired = employmentDocuments.filter(doc => doc.required).length;
  const employmentCompleted = employmentDocuments.filter(doc => doc.required && doc.status !== 'missing').length;

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div 
          className="slideover-overlay" 
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Slide-Over Panel */}
      <div className={`slideover-panel ${isOpen ? 'open' : ''}`}>
        {/* Sticky Header */}
        <div className="slideover-header">
          <button className="slideover-close-button" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
          <div className="slideover-header-content">
            <div className="slideover-avatar-section">
              <div className="slideover-avatar-large" style={{ position: 'relative' }}>
                {profilePicture ? (
                  <img src={profilePicture} alt={guard.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }} />
                ) : (
                  <Users size={36} />
                )}
                <input
                  type="file"
                  id="profile-picture-upload"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleProfilePictureUpload}
                />
                <label
                  htmlFor="profile-picture-upload"
                  style={{
                    position: 'absolute',
                    bottom: '0',
                    right: '0',
                    backgroundColor: '#FF7A18',
                    borderRadius: '50%',
                    width: '28px',
                    height: '28px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    border: '2px solid #0B1220'
                  }}
                  title="Change profile picture"
                >
                  <Edit2 size={14} color="#FFFFFF" />
                </label>
              </div>
              <div className="slideover-header-info">
                <h2 className="slideover-title">{guard.name}</h2>
                <p className="slideover-subtitle">{guard.role}</p>
                <div className="slideover-status-badge">
                  {isAccessFrozen ? (
                    <>
                      <span className="status-dot" style={{ backgroundColor: '#D32F2F' }} />
                      <span className="status-text" style={{ color: '#D32F2F' }}>Frozen</span>
                    </>
                  ) : (
                    <>
                      <span className={`status-dot ${guard.status === 'on-shift' ? 'success' : guard.status === 'active' ? 'warning' : ''}`} />
                      <span className="status-text">{guard.status === 'on-shift' ? 'On-Shift' : guard.status === 'active' ? 'Active' : 'Off-Duty'}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="slideover-header-actions">
              <a href={`tel:${guard.phone}`} className="icon-button-outline" title="Call">
                <Phone size={18} />
              </a>
              <a href={`mailto:${guard.email}`} className="icon-button-outline" title="Email">
                <Mail size={18} />
              </a>
            </div>
          </div>
        </div>

        {/* Tabbed Navigation */}
        <div className="slideover-tabs">
          <button
            className={`slideover-tab ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button
            className={`slideover-tab ${activeTab === 'schedule' ? 'active' : ''}`}
            onClick={() => setActiveTab('schedule')}
          >
            Schedule
          </button>
          <button
            className={`slideover-tab ${activeTab === 'documents' ? 'active' : ''}`}
            onClick={() => setActiveTab('documents')}
          >
            Documents
          </button>
          <button
            className={`slideover-tab ${activeTab === 'performance' ? 'active' : ''}`}
            onClick={() => setActiveTab('performance')}
          >
            Performance
          </button>
        </div>

        {/* Tab Content */}
        <div className="slideover-content">
          {activeTab === 'overview' && (
            <>
              {/* Guard Profile Section */}
              <div className="slideover-section">
                <div className="slideover-section-header">
                  <h3 className="slideover-section-title">Guard Profile</h3>
                  <button className="button-outline-small" onClick={handleOpenEditProfile}>
                    <Edit2 size={16} />
                    Edit
                  </button>
                </div>
                <div className="guard-profile-grid">
                  {/* Left Column - Personal Details */}
                  <div className="guard-profile-column">
                    <h4 className="guard-profile-column-title">Personal Details</h4>
                    <div className="guard-profile-field">
                      <span className="guard-profile-label">Name</span>
                      <span className="guard-profile-value">{guard.name}</span>
                    </div>
                    <div className="guard-profile-field">
                      <span className="guard-profile-label">Contact Phone</span>
                      <span className="guard-profile-value">{guard.phone}</span>
                    </div>
                    <div className="guard-profile-field">
                      <span className="guard-profile-label">Email</span>
                      <span className="guard-profile-value">{guard.email}</span>
                    </div>
                    <div className="guard-profile-field">
                      <span className="guard-profile-label">Emergency Contact</span>
                      <span className="guard-profile-value">{guard.emergencyContact || 'Not set'}</span>
                    </div>
                    <div className="guard-profile-field">
                      <span className="guard-profile-label">Emergency Phone</span>
                      <span className="guard-profile-value">{guard.emergencyPhone || 'Not set'}</span>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="guard-profile-divider"></div>

                  {/* Right Column - Employment Data */}
                  <div className="guard-profile-column">
                    <h4 className="guard-profile-column-title">Employment Data</h4>
                    <div className="guard-profile-field">
                      <span className="guard-profile-label">Badge ID</span>
                      <span className="guard-profile-value">{guard.badgeId || 'Not set'}</span>
                    </div>
                    <div className="guard-profile-field">
                      <span className="guard-profile-label">Date of Hire</span>
                      <span className="guard-profile-value">{guard.dateOfHire || 'Not set'}</span>
                    </div>
                    <div className="guard-profile-field">
                      <span className="guard-profile-label">Role Classification</span>
                      <span className="guard-profile-value">{guard.roleClassification || 'Not set'}</span>
                    </div>
                    <div className="guard-profile-field">
                      <span className="guard-profile-label">Primary Site</span>
                      <span className="guard-profile-value">{guard.primarySite || 'Not set'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="slideover-section">
                <div className="danger-zone">
                  <div className="danger-zone-header">
                    <AlertTriangle size={20} className="danger-zone-icon" />
                    <h3 className="danger-zone-title">Access Control</h3>
                  </div>
                  <p className="danger-zone-description">
                    Freeze this guard's access to the platform. They will not be able to clock in.
                  </p>
                  <div className="danger-zone-action">
                    <span className="danger-zone-label">Freeze Access</span>
                    <button
                      className={`toggle-switch ${isAccessFrozen ? 'active' : ''}`}
                      onClick={handleToggleFreeze}
                      role="switch"
                      aria-checked={isAccessFrozen}
                    >
                      <span className="toggle-switch-track">
                        <span className="toggle-switch-thumb" />
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'schedule' && (
            <div className="slideover-section">
              {/* Schedule Control Bar - Weekly View */}
              <div className="schedule-control-bar">
                <div className="schedule-month-nav">
                  <button className="icon-button-ghost" aria-label="Previous week" onClick={handlePreviousWeek}>
                    <ChevronLeft size={18} />
                  </button>
                  <span className="schedule-month-text">{getWeekDateRange(currentWeekOffset)}</span>
                  <button className="icon-button-ghost" aria-label="Next week" onClick={handleNextWeek}>
                    <ChevronRight size={18} />
                  </button>
                </div>
                <button className="button-outline-small" onClick={handleOpenAddShift}>
                  <Plus size={16} />
                  Add Shift
                </button>
              </div>

              {/* Weekly Utilization Bar */}
              <div className="schedule-capacity-bar">
                <div className="capacity-header">
                  <span className="capacity-label">Weekly Utilization</span>
                  <span className="capacity-value">{weeklyHours} / {maxWeeklyHours} Hours</span>
                </div>
                <div className="capacity-progress-track">
                  <div className="capacity-progress-fill" style={{ width: `${utilizationPercentage}%` }} />
                </div>
              </div>

              {/* Shift List - Today & Upcoming */}
              <div className="schedule-shift-list">
                <h4 className="shift-group-title">Today & Upcoming</h4>
                
                {/* Active Shift Card - In Progress */}
                {upcomingShifts.map(shift => (
                  <div 
                    key={shift.id} 
                    className={`shift-card ${shift.status === 'in-progress' ? 'shift-card-active' : ''}`}
                    onClick={() => handleOpenEditShift(shift)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="shift-date-badge-wide">
                      <span className="shift-date-text">{formatShiftDate(shift.date)}</span>
                    </div>
                    <div className="shift-details">
                      <h5 className="shift-location">{shift.site}</h5>
                      <p className="shift-time">{formatTime(shift.startTime)} - {formatTime(shift.endTime)}</p>
                    </div>
                    <div className={`shift-status-pill ${shift.status}`}>
                      {shift.status === 'in-progress' ? (
                        <>
                          <span className="status-pulse" />
                          In Progress
                        </>
                      ) : (
                        'Scheduled'
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Shift List - Completed History */}
              <div className="schedule-shift-list">
                <h4 className="shift-group-title">Completed History</h4>
                
                {/* Completed Shift Card 1 */}
                {completedShifts.map(shift => (
                  <div 
                    key={shift.id} 
                    className="shift-card shift-card-completed"
                    onClick={() => handleOpenEditShift(shift)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="shift-date-badge-wide">
                      <span className="shift-date-text">{formatShiftDate(shift.date)}</span>
                    </div>
                    <div className="shift-details">
                      <h5 className="shift-location">{shift.site}</h5>
                      <p className="shift-time">{formatTime(shift.startTime)} - {formatTime(shift.endTime)} • <strong>{shift.hours}.0 Hrs</strong></p>
                    </div>
                    <div className="shift-status-pill completed">
                      Completed
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'documents' && (
            <>
              {/* Compliance Hub - Upload Area */}
              <div className="slideover-section">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h3 className="slideover-section-title" style={{ margin: 0 }}>Document Compliance</h3>
                  <button className="button-outline-small" onClick={handleAddDocument}>
                    <Plus size={16} />
                    Add Document
                  </button>
                </div>
                <div 
                  className="compliance-upload-zone"
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onClick={handleAddDocument}
                >
                  <UploadCloud size={40} style={{ color: '#64748B' }} />
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ color: '#F1F5F9', marginBottom: '4px' }}>Drag & drop files here</p>
                    <p style={{ color: '#64748B', fontSize: '13px' }}>Supports PDF, JPG, PNG</p>
                  </div>
                </div>
              </div>

              {/* Legal & Identity Group */}
              <div className="slideover-section">
                <div className="document-group">
                  <div 
                    className="document-group-header"
                    onClick={() => setLegalAccordionOpen(!legalAccordionOpen)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <ChevronDown 
                        size={18} 
                        style={{ 
                          color: '#94A3B8',
                          transform: legalAccordionOpen ? 'rotate(0deg)' : 'rotate(-90deg)',
                          transition: 'transform 0.2s ease'
                        }} 
                      />
                      <h3 className="document-group-title">Legal & Identity</h3>
                    </div>
                    <span className="document-group-badge">{legalCompleted}/{legalRequired} Required</span>
                  </div>
                  
                  {legalAccordionOpen && (
                    <div className="document-group-content">
                      {legalDocuments.map(doc => (
                        <div key={doc.id} className={`document-row ${doc.status}`}>
                          <div className="document-row-icon" style={{ 
                            color: doc.status === 'missing' ? '#DC2626' : doc.status === 'expiring' ? '#FFA500' : '#3B82F6' 
                          }}>
                            {doc.status === 'missing' ? <AlertTriangle size={20} /> : <File size={20} />}
                          </div>
                          <div className="document-row-info">
                            <span className="document-row-name" style={{ 
                              color: doc.status === 'missing' ? '#64748B' : '#F1F5F9' 
                            }}>
                              {doc.name}
                            </span>
                            <div className="document-row-status">
                              {doc.status === 'missing' ? (
                                <span style={{ color: '#94A3B8', fontSize: '13px' }}>Required document missing</span>
                              ) : doc.daysUntilExpiry !== undefined && doc.daysUntilExpiry < 0 ? (
                                <>
                                  <AlertCircle size={14} style={{ color: '#EF4444' }} />
                                  <span style={{ color: '#EF4444' }}>Expired {Math.abs(doc.daysUntilExpiry)} days ago</span>
                                </>
                              ) : doc.status === 'expiring' ? (
                                <>
                                  <Clock size={14} style={{ color: '#FF7A18' }} />
                                  <span style={{ color: '#FF7A18' }}>Expires in {doc.daysUntilExpiry} days</span>
                                </>
                              ) : (
                                <>
                                  <CheckCircle size={14} style={{ color: '#3BD16F' }} />
                                  <span style={{ color: '#3BD16F' }}>
                                    {doc.daysUntilExpiry ? `Expires in ${doc.daysUntilExpiry} days` : 'Valid'}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                          {doc.status === 'missing' ? (
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button 
                                className="button-outline-small" 
                                style={{ fontSize: '12px', padding: '6px 12px' }}
                                onClick={() => handleEditDocument(doc.id)}
                              >
                                <Upload size={14} style={{ marginRight: '4px' }} />
                                Upload
                              </button>
                              <button 
                                className="button-outline-small" 
                                style={{ fontSize: '12px', padding: '6px 12px' }}
                                onClick={() => handleRequestUpload(doc.id)}
                              >
                                Request Upload
                              </button>
                            </div>
                          ) : (
                            <div className="document-row-actions">
                              <button className="icon-button-ghost" title="Preview" onClick={() => handleViewDocument(doc.id)}>
                                <Eye size={16} />
                              </button>
                              <button className="icon-button-ghost" title="Download" onClick={() => handleDownloadDocument(doc.id)}>
                                <Download size={16} />
                              </button>
                              <button className="icon-button-edit" title="Edit" onClick={() => handleEditDocument(doc.id)}>
                                <Edit2 size={16} />
                              </button>
                              {canDeleteDocument(doc.name) && (
                                <button className="icon-button-delete" title="Delete" onClick={() => handleDeleteDocument(doc.id)}>
                                  <Trash2 size={16} />
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Training & Certifications Group */}
              <div className="slideover-section">
                <div className="document-group">
                  <div 
                    className="document-group-header"
                    onClick={() => setTrainingAccordionOpen(!trainingAccordionOpen)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <ChevronDown 
                        size={18} 
                        style={{ 
                          color: '#94A3B8',
                          transform: trainingAccordionOpen ? 'rotate(0deg)' : 'rotate(-90deg)',
                          transition: 'transform 0.2s ease'
                        }} 
                      />
                      <h3 className="document-group-title">Training & Certifications</h3>
                    </div>
                    <span className="document-group-badge">{trainingCompleted}/{trainingRequired} Required</span>
                  </div>
                  
                  {trainingAccordionOpen && (
                    <div className="document-group-content">
                      {trainingDocuments.map(doc => (
                        <div key={doc.id} className={`document-row ${doc.status}`}>
                          <div className="document-row-icon" style={{ 
                            color: doc.status === 'missing' ? '#DC2626' : doc.status === 'expiring' ? '#FFA500' : '#3B82F6' 
                          }}>
                            {doc.status === 'missing' ? <AlertTriangle size={20} /> : <File size={20} />}
                          </div>
                          <div className="document-row-info">
                            <span className="document-row-name" style={{ 
                              color: doc.status === 'missing' ? '#64748B' : '#F1F5F9' 
                            }}>
                              {doc.name}
                            </span>
                            <div className="document-row-status">
                              {doc.status === 'missing' ? (
                                <span style={{ color: '#94A3B8', fontSize: '13px' }}>Required document missing</span>
                              ) : doc.daysUntilExpiry !== undefined && doc.daysUntilExpiry < 0 ? (
                                <>
                                  <AlertCircle size={14} style={{ color: '#EF4444' }} />
                                  <span style={{ color: '#EF4444' }}>Expired {Math.abs(doc.daysUntilExpiry)} days ago</span>
                                </>
                              ) : doc.status === 'expiring' ? (
                                <>
                                  <Clock size={14} style={{ color: '#FF7A18' }} />
                                  <span style={{ color: '#FF7A18' }}>Expires in {doc.daysUntilExpiry} days</span>
                                </>
                              ) : (
                                <>
                                  <CheckCircle size={14} style={{ color: '#3BD16F' }} />
                                  <span style={{ color: '#3BD16F' }}>
                                    {doc.daysUntilExpiry ? `Expires in ${doc.daysUntilExpiry} days` : 'Valid'}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                          {doc.status === 'missing' ? (
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button 
                                className="button-outline-small" 
                                style={{ fontSize: '12px', padding: '6px 12px' }}
                                onClick={() => handleEditDocument(doc.id)}
                              >
                                <Upload size={14} style={{ marginRight: '4px' }} />
                                Upload
                              </button>
                              <button 
                                className="button-outline-small" 
                                style={{ fontSize: '12px', padding: '6px 12px' }}
                                onClick={() => handleRequestUpload(doc.id)}
                              >
                                Request Upload
                              </button>
                            </div>
                          ) : (
                            <div className="document-row-actions">
                              <button className="icon-button-ghost" title="Preview" onClick={() => handleViewDocument(doc.id)}>
                                <Eye size={16} />
                              </button>
                              <button className="icon-button-ghost" title="Download" onClick={() => handleDownloadDocument(doc.id)}>
                                <Download size={16} />
                              </button>
                              <button className="icon-button-edit" title="Edit" onClick={() => handleEditDocument(doc.id)}>
                                <Edit2 size={16} />
                              </button>
                              {canDeleteDocument(doc.name) && (
                                <button className="icon-button-delete" title="Delete" onClick={() => handleDeleteDocument(doc.id)}>
                                  <Trash2 size={16} />
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Employment & HR Group */}
              <div className="slideover-section">
                <div className="document-group">
                  <div 
                    className="document-group-header"
                    onClick={() => setEmploymentAccordionOpen(!employmentAccordionOpen)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <ChevronDown 
                        size={18} 
                        style={{ 
                          color: '#94A3B8',
                          transform: employmentAccordionOpen ? 'rotate(0deg)' : 'rotate(-90deg)',
                          transition: 'transform 0.2s ease'
                        }} 
                      />
                      <h3 className="document-group-title">Employment & HR</h3>
                    </div>
                    <span className="document-group-badge">{employmentCompleted}/{employmentRequired} Required</span>
                  </div>
                  
                  {employmentAccordionOpen && (
                    <div className="document-group-content">
                      {employmentDocuments.map(doc => (
                        <div 
                          key={doc.id} 
                          className={`document-row ${doc.status}`}
                          style={{
                            opacity: doc.status === 'missing' ? 0.6 : 1,
                            border: doc.status === 'missing' ? '1px dashed #EF4444' : undefined
                          }}
                        >
                          <div className="document-row-icon" style={{ 
                            color: doc.status === 'missing' ? '#DC2626' : doc.status === 'expiring' ? '#FFA500' : '#3B82F6' 
                          }}>
                            {doc.status === 'missing' ? <AlertTriangle size={20} /> : <File size={20} />}
                          </div>
                          <div className="document-row-info">
                            <span className="document-row-name" style={{ 
                              color: doc.status === 'missing' ? '#64748B' : '#F1F5F9' 
                            }}>
                              {doc.name}
                            </span>
                            <div className="document-row-status">
                              {doc.status === 'missing' ? (
                                <span style={{ color: '#94A3B8', fontSize: '13px' }}>Required document missing</span>
                              ) : doc.name === 'Signed Offer Letter' ? (
                                <>
                                  <CheckCircle size={14} style={{ color: '#3BD16F' }} />
                                  <span style={{ color: '#3BD16F' }}>
                                    {doc.signedDate ? `Signed on ${doc.signedDate}` : 'Valid'}
                                  </span>
                                </>
                              ) : doc.name === 'W-4 Tax Form' ? (
                                <>
                                  <CheckCircle size={14} style={{ color: '#3BD16F' }} />
                                  <span style={{ color: '#3BD16F' }}>
                                    {doc.taxYear ? `Valid for ${doc.taxYear}` : 'Valid'}
                                  </span>
                                </>
                              ) : doc.name === 'Direct Deposit Authorization' && doc.submittedDate ? (
                                <>
                                  <CheckCircle size={14} style={{ color: '#3BD16F' }} />
                                  <span style={{ color: '#3BD16F' }}>
                                    Submitted on {doc.submittedDate}
                                  </span>
                                </>
                              ) : (
                                <>
                                  <CheckCircle size={14} style={{ color: '#3BD16F' }} />
                                  <span style={{ color: '#3BD16F' }}>Valid</span>
                                </>
                              )}
                            </div>
                          </div>
                          {doc.status === 'missing' ? (
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button 
                                className="button-outline-small" 
                                style={{ fontSize: '12px', padding: '6px 12px' }}
                                onClick={() => handleEditDocument(doc.id)}
                              >
                                <Upload size={14} style={{ marginRight: '4px' }} />
                                Upload
                              </button>
                              <button 
                                className="button-outline-small" 
                                style={{ fontSize: '12px', padding: '6px 12px' }}
                                onClick={() => handleRequestUpload(doc.id)}
                              >
                                Request Upload
                              </button>
                            </div>
                          ) : (
                            <div className="document-row-actions">
                              <button className="icon-button-ghost" title="Preview" onClick={() => handleViewDocument(doc.id)}>
                                <Eye size={16} />
                              </button>
                              <button className="icon-button-ghost" title="Download" onClick={() => handleDownloadDocument(doc.id)}>
                                <Download size={16} />
                              </button>
                              <button className="icon-button-edit" title="Edit" onClick={() => handleEditDocument(doc.id)}>
                                <Edit2 size={16} />
                              </button>
                              {canDeleteDocument(doc.name) && (
                                <button className="icon-button-delete" title="Delete" onClick={() => handleDeleteDocument(doc.id)}>
                                  <Trash2 size={16} />
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {activeTab === 'performance' && (
            <>
              {/* Performance Summary Cards */}
              <div className="slideover-section">
                <div className="slideover-vitals-grid">
                  {/* Attendance Score Card */}
                  <div className="vital-card">
                    <div className="vital-card-header">
                      <div className="vital-icon success">
                        <CheckCircle size={20} />
                      </div>
                      <span className="vital-label">Attendance Score</span>
                    </div>
                    <div className="vital-value success" style={{ color: '#3BD16F' }}>98%</div>
                    <p className="vital-subtext">Excellent attendance record</p>
                  </div>

                  {/* Reported Incidents Card */}
                  <div className="vital-card">
                    <div className="vital-card-header">
                      <div className="vital-icon" style={{ backgroundColor: 'rgba(255, 193, 7, 0.1)' }}>
                        <AlertCircle size={20} style={{ color: '#FFC107' }} />
                      </div>
                      <span className="vital-label">Reported Incidents</span>
                    </div>
                    <div className="vital-value" style={{ color: '#FFC107' }}>1</div>
                    <p className="vital-subtext">This quarter</p>
                  </div>
                </div>
              </div>

              {/* Recent Feedback Section */}
              <div className="slideover-section">
                <h3 className="slideover-section-title">Recent Feedback</h3>
                <div className="compliance-list">
                  {performanceLogs.map((log) => (
                    <div 
                      key={log.id} 
                      className={`compliance-item ${log.sentiment === 'positive' ? 'valid' : log.sentiment === 'negative' ? 'warning' : ''}`}
                    >
                      <div 
                        className="compliance-icon" 
                        style={{ 
                          backgroundColor: log.sentiment === 'positive' 
                            ? 'rgba(34, 197, 94, 0.1)' 
                            : log.sentiment === 'negative' 
                            ? 'rgba(255, 193, 7, 0.1)' 
                            : 'rgba(59, 130, 246, 0.1)' 
                        }}
                      >
                        {log.sentiment === 'positive' ? (
                          <CheckCircle size={20} style={{ color: '#22c55e' }} />
                        ) : log.sentiment === 'negative' ? (
                          <AlertTriangle size={20} style={{ color: '#FFC107' }} />
                        ) : (
                          <AlertCircle size={20} style={{ color: '#3b82f6' }} />
                        )}
                      </div>
                      <div className="compliance-content">
                        <span className="compliance-label">
                          {getCategoryLabel(log.category)} - {log.description}
                        </span>
                        <span className="compliance-sublabel">{log.createdAt} • {log.createdBy}</span>
                      </div>
                      <div className="compliance-actions">
                        <button className="icon-button-edit" title="Edit" onClick={() => handleEditPerformanceLog(log.id)}>
                          <Edit2 size={16} />
                        </button>
                        <button className="icon-button-delete" title="Delete" onClick={() => handleDeletePerformanceLog(log.id)}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Log Performance Note Button */}
              <div className="slideover-section">
                <button className="button-secondary" style={{ width: '100%' }} onClick={() => setShowPerformanceModal(true)}>
                  Log Performance Note
                </button>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="slideover-footer">
          <button className="button-secondary" style={{ width: '100%' }} onClick={handleOpenEditProfile}>
            Edit Profile
          </button>
        </div>
      </div>

      {/* Freeze Confirmation Modal */}
      {showFreezeConfirm && (
        <>
          <div className="confirm-modal-overlay" onClick={handleCancelFreeze} />
          <div className="confirm-modal">
            <div className="confirm-modal-header">
              <div className="confirm-modal-icon-wrapper danger">
                <AlertTriangle size={24} />
              </div>
              <h3 className="confirm-modal-title">Freeze Guard Access?</h3>
              <p className="confirm-modal-description">
                You are about to freeze <strong>{guard.name}'s</strong> access to the platform. 
                They will not be able to clock in or access their account until unfrozen.
              </p>
            </div>
            <div className="confirm-modal-footer">
              <button className="button-secondary" onClick={handleCancelFreeze}>
                Cancel
              </button>
              <button 
                className="button-danger" 
                onClick={handleConfirmFreeze}
                style={{ 
                  backgroundColor: '#D32F2F', 
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                Freeze Access
              </button>
            </div>
          </div>
        </>
      )}

      {/* Unfreeze Confirmation Modal */}
      {showUnfreezeConfirm && (
        <>
          <div className="confirm-modal-overlay" onClick={handleCancelUnfreeze} />
          <div className="confirm-modal">
            <div className="confirm-modal-header">
              <div className="confirm-modal-icon-wrapper danger">
                <AlertTriangle size={24} />
              </div>
              <h3 className="confirm-modal-title">Unfreeze Guard Access?</h3>
              <p className="confirm-modal-description">
                You are about to unfreeze <strong>{guard.name}'s</strong> access to the platform. 
                They will be able to clock in and access their account.
              </p>
            </div>
            <div className="confirm-modal-footer">
              <button className="button-secondary" onClick={handleCancelUnfreeze}>
                Cancel
              </button>
              <button className="button-success" onClick={handleConfirmUnfreeze}>
                Unfreeze Access
              </button>
            </div>
          </div>
        </>
      )}

      {/* Add Shift Modal */}
      {showAddShiftModal && (
        <>
          <div className="modal-overlay" onClick={handleCloseAddShift} />
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">Assign Shift to {guard.name}</h3>
              <button className="modal-close-button" onClick={handleCloseAddShift} aria-label="Close">
                <X size={20} />
              </button>
            </div>
            <div className="modal-content">
              <div className="form-group">
                <label className="form-label">Site</label>
                <select
                  className="form-select"
                  value={newShift.site}
                  onChange={(e) => setNewShift({ ...newShift, site: e.target.value })}
                >
                  <option value="Building A">Building A</option>
                  <option value="Building B">Building B</option>
                  <option value="Building C">Building C</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={newShift.date}
                  onChange={(e) => setNewShift({ ...newShift, date: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Start Time</label>
                <input
                  type="time"
                  className="form-input"
                  value={newShift.startTime}
                  onChange={(e) => setNewShift({ ...newShift, startTime: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">End Time</label>
                <input
                  type="time"
                  className="form-input"
                  value={newShift.endTime}
                  onChange={(e) => setNewShift({ ...newShift, endTime: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Instructions</label>
                <textarea
                  className="form-textarea"
                  value={newShift.instructions}
                  onChange={(e) => setNewShift({ ...newShift, instructions: e.target.value })}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="button-secondary" onClick={handleCloseAddShift}>
                Cancel
              </button>
              <button className="button-primary" onClick={handleAddShift}>
                Add Shift
              </button>
            </div>
          </div>
        </>
      )}

      {/* Edit Shift Modal */}
      {showEditShiftModal && (
        <>
          <div className="modal-overlay" onClick={handleCloseEditShift} />
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">Edit Shift Details</h3>
              <button className="modal-close-button" onClick={handleCloseEditShift} aria-label="Close">
                <X size={20} />
              </button>
            </div>
            <div className="modal-content">
              <div className="form-group">
                <label className="form-label">Site</label>
                <select
                  className="form-select"
                  value={editShiftForm.site}
                  onChange={(e) => setEditShiftForm({ ...editShiftForm, site: e.target.value })}
                >
                  <option value="Building A">Building A</option>
                  <option value="Building B">Building B</option>
                  <option value="Building C">Building C</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={editShiftForm.date}
                  onChange={(e) => setEditShiftForm({ ...editShiftForm, date: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Start Time</label>
                <input
                  type="time"
                  className="form-input"
                  value={editShiftForm.startTime}
                  onChange={(e) => setEditShiftForm({ ...editShiftForm, startTime: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">End Time</label>
                <input
                  type="time"
                  className="form-input"
                  value={editShiftForm.endTime}
                  onChange={(e) => setEditShiftForm({ ...editShiftForm, endTime: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Instructions</label>
                <textarea
                  className="form-textarea"
                  value={editShiftForm.instructions}
                  onChange={(e) => setEditShiftForm({ ...editShiftForm, instructions: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select
                  className="form-select"
                  value={editShiftForm.status}
                  onChange={(e) => setEditShiftForm({ ...editShiftForm, status: e.target.value as Shift['status'] })}
                >
                  <option value="scheduled">Scheduled</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="button-secondary" onClick={handleCloseEditShift}>
                Cancel
              </button>
              <button className="button-primary" onClick={handleSaveShift}>
                Save Changes
              </button>
              <button className="button-danger" onClick={handleDeleteShift}>
                Delete Shift
              </button>
            </div>
          </div>
        </>
      )}

      {/* Edit Profile Modal */}
      {showEditProfileModal && !showSaveConfirm && (
        <>
          <div className="modal-overlay" onClick={handleCloseEditProfile} />
          <div className="modal" style={{ maxWidth: '900px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Edit Guard Profile</h3>
              <button className="modal-close-button" onClick={handleCloseEditProfile} aria-label="Close">
                <X size={20} />
              </button>
            </div>
            <div className="modal-content">
              {/* Personal Details Section */}
              <div style={{ marginBottom: '24px' }}>
                <h4 style={{ color: '#FFFFFF', marginBottom: '16px', fontSize: '14px', fontWeight: 600 }}>Personal Details</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Name</label>
                    <input
                      type="text"
                      className="form-input"
                      value={editProfileForm.name}
                      onChange={(e) => setEditProfileForm({ ...editProfileForm, name: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Contact Phone</label>
                    <input
                      type="tel"
                      className="form-input"
                      value={editProfileForm.phone}
                      onChange={(e) => setEditProfileForm({ ...editProfileForm, phone: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      className="form-input"
                      value={editProfileForm.email}
                      onChange={(e) => setEditProfileForm({ ...editProfileForm, email: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Emergency Contact</label>
                    <input
                      type="text"
                      className="form-input"
                      value={editProfileForm.emergencyContact}
                      onChange={(e) => setEditProfileForm({ ...editProfileForm, emergencyContact: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Emergency Phone</label>
                    <input
                      type="tel"
                      className="form-input"
                      value={editProfileForm.emergencyPhone}
                      onChange={(e) => setEditProfileForm({ ...editProfileForm, emergencyPhone: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Employment Data Section */}
              <div>
                <h4 style={{ color: '#FFFFFF', marginBottom: '16px', fontSize: '14px', fontWeight: 600 }}>Employment Data</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Badge ID</label>
                    <input
                      type="text"
                      className="form-input"
                      value={editProfileForm.badgeId}
                      onChange={(e) => setEditProfileForm({ ...editProfileForm, badgeId: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Date of Hire</label>
                    <input
                      type="date"
                      className="form-input"
                      value={editProfileForm.dateOfHire}
                      onChange={(e) => setEditProfileForm({ ...editProfileForm, dateOfHire: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Role Classification</label>
                    <input
                      type="text"
                      className="form-input"
                      value={editProfileForm.roleClassification}
                      onChange={(e) => setEditProfileForm({ ...editProfileForm, roleClassification: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Primary Site</label>
                    <input
                      type="text"
                      className="form-input"
                      value={editProfileForm.primarySite}
                      onChange={(e) => setEditProfileForm({ ...editProfileForm, primarySite: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="button-secondary" onClick={handleCloseEditProfile}>
                Cancel
              </button>
              <button className="button-primary" onClick={handleSaveEditProfile}>
                Save Changes
              </button>
            </div>
          </div>
        </>
      )}

      {/* Save Profile Confirmation Modal */}
      {showSaveConfirm && (
        <>
          <div className="confirm-modal-overlay" onClick={handleCancelSaveProfile} />
          <div className="confirm-modal">
            <div className="confirm-modal-header">
              <div className="confirm-modal-icon-wrapper success">
                <CheckCircle size={24} />
              </div>
              <h3 className="confirm-modal-title">Save Profile Changes?</h3>
              <p className="confirm-modal-description">
                You are about to update the profile information for <strong>{guard.name}</strong>. 
                Please confirm to save these changes.
              </p>
            </div>
            <div className="confirm-modal-footer">
              <button className="button-secondary" onClick={handleCancelSaveProfile}>
                Cancel
              </button>
              <button className="button-primary" onClick={handleConfirmSaveProfile}>
                Confirm & Save
              </button>
            </div>
          </div>
        </>
      )}

      {/* Log Performance Modal */}
      {showPerformanceModal && (
        <LogPerformanceModal
          isOpen={showPerformanceModal}
          guardName={guard.name}
          onClose={() => {
            setShowPerformanceModal(false);
            setEditingLogId(null);
          }}
          onSave={handleSavePerformanceLog}
          getCategoryLabel={getCategoryLabel}
          editingLog={editingLogId ? performanceLogs.find(log => log.id === editingLogId) || null : null}
        />
      )}

      {/* Delete Log Confirmation Modal */}
      {showDeleteLogConfirm && (
        <>
          <div className="confirm-modal-overlay" onClick={handleCancelDeleteLog} />
          <div className="confirm-modal">
            <div className="confirm-modal-header">
              <div className="confirm-modal-icon-wrapper danger">
                <AlertTriangle size={24} />
              </div>
              <h3 className="confirm-modal-title">Delete Performance Log?</h3>
              <p className="confirm-modal-description">
                You are about to delete a performance log for <strong>{guard.name}</strong>. 
                This action cannot be undone.
              </p>
            </div>
            <div className="confirm-modal-footer">
              <button className="button-secondary" onClick={handleCancelDeleteLog}>
                Cancel
              </button>
              <button className="button-danger" onClick={handleConfirmDeleteLog}>
                Delete Log
              </button>
            </div>
          </div>
        </>
      )}

      {/* Manual License Entry Modal */}
      {showLicenseModal && (
        <ManualLicenseEntryModal
          isOpen={showLicenseModal}
          guardName={guard.name}
          onClose={() => {
            setShowLicenseModal(false);
            setEditingLicenseId(null);
          }}
          onSave={handleSaveLicense}
          editingLicense={editingLicenseId ? licenses.find(license => license.id === editingLicenseId) || null : null}
        />
      )}

      {/* Delete License Confirmation Modal */}
      {showDeleteLicenseConfirm && (
        <>
          <div className="confirm-modal-overlay" onClick={handleCancelDeleteLicense} />
          <div className="confirm-modal">
            <div className="confirm-modal-header">
              <div className="confirm-modal-icon-wrapper danger">
                <AlertTriangle size={24} />
              </div>
              <h3 className="confirm-modal-title">Delete License?</h3>
              <p className="confirm-modal-description">
                You are about to delete a license for <strong>{guard.name}</strong>. 
                This action cannot be undone.
              </p>
            </div>
            <div className="confirm-modal-footer">
              <button className="button-secondary" onClick={handleCancelDeleteLicense}>
                Cancel
              </button>
              <button className="button-danger" onClick={handleConfirmDeleteLicense}>
                Delete License
              </button>
            </div>
          </div>
        </>
      )}

      {/* Document Modal */}
      {showDocumentModal && (
        <DocumentModal
          isOpen={showDocumentModal}
          onClose={() => {
            setShowDocumentModal(false);
            setEditingDocumentId(null);
          }}
          onSave={handleSaveDocument}
          editingDocument={editingDocumentId ? documents.find(doc => doc.id === editingDocumentId) || null : null}
        />
      )}

      {/* Delete Document Confirmation Modal */}
      {showDeleteDocumentConfirm && (
        <>
          <div className="confirm-modal-overlay" onClick={handleCancelDeleteDocument} />
          <div className="confirm-modal">
            <div className="confirm-modal-header">
              <div className="confirm-modal-icon-wrapper danger">
                <AlertTriangle size={24} />
              </div>
              <h3 className="confirm-modal-title">Delete Document?</h3>
              <p className="confirm-modal-description">
                You are about to delete this document for <strong>{guard.name}</strong>. 
                {documents.find(doc => doc.id === deletingDocumentId)?.required 
                  ? ' This is a required document and will be marked as missing.' 
                  : ' This action cannot be undone.'}
              </p>
            </div>
            <div className="confirm-modal-footer">
              <button className="button-secondary" onClick={handleCancelDeleteDocument}>
                Cancel
              </button>
              <button className="button-danger" onClick={handleConfirmDeleteDocument}>
                {documents.find(doc => doc.id === deletingDocumentId)?.required ? 'Mark as Missing' : 'Delete Document'}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Document Viewer Modal */}
      {showDocumentViewer && viewingDocumentId && (
        <>
          <div className="modal-overlay" onClick={() => setShowDocumentViewer(false)} />
          <div className="modal-container" style={{ maxWidth: '900px', maxHeight: '90vh' }}>
            <div className="modal-header">
              <h2 className="modal-title">
                {documents.find(doc => doc.id === viewingDocumentId)?.name}
              </h2>
              <button className="modal-close-button" onClick={() => setShowDocumentViewer(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-content" style={{ padding: 0, height: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0F1729' }}>
              {documents.find(doc => doc.id === viewingDocumentId)?.fileUrl ? (
                <iframe
                  src={documents.find(doc => doc.id === viewingDocumentId)?.fileUrl}
                  style={{ width: '100%', height: '100%', border: 'none' }}
                  title="Document Preview"
                />
              ) : (
                <div style={{ textAlign: 'center', color: '#64748B' }}>
                  <File size={64} style={{ marginBottom: '16px', opacity: 0.5 }} />
                  <p>No preview available</p>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="button-secondary" onClick={() => setShowDocumentViewer(false)}>
                Close
              </button>
              <button 
                className="button-primary" 
                onClick={() => {
                  if (viewingDocumentId) {
                    handleDownloadDocument(viewingDocumentId);
                  }
                }}
              >
                <Download size={16} />
                Download
              </button>
            </div>
          </div>
        </>
      )}

      {/* Document Upload Notification Modal */}
      {showNotificationModal && notificationDocumentId && (
        <>
          <div className="modal-overlay" onClick={handleCancelNotification} />
          <div className="modal-container" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h2 className="modal-title">
                {notificationSent ? 'Notification Sent!' : 'Send Document Request'}
              </h2>
              {!notificationSent && (
                <button className="modal-close-button" onClick={handleCancelNotification}>
                  <X size={20} />
                </button>
              )}
            </div>
            <div className="modal-content">
              {notificationSent ? (
                <div style={{ textAlign: 'center', padding: '24px 0' }}>
                  <div style={{ 
                    width: '64px', 
                    height: '64px', 
                    borderRadius: '50%', 
                    backgroundColor: 'rgba(59, 209, 111, 0.1)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    margin: '0 auto 16px'
                  }}>
                    <CheckCircle size={32} style={{ color: '#3BD16F' }} />
                  </div>
                  <p style={{ color: '#F1F5F9', marginBottom: '8px' }}>
                    <strong>{guard.name}</strong> has been notified
                  </p>
                  <p style={{ color: '#64748B', fontSize: '14px' }}>
                    They can now upload "{documents.find(doc => doc.id === notificationDocumentId)?.name}" through their Guard Portal.
                  </p>
                </div>
              ) : (
                <div>
                  <div style={{ 
                    padding: '16px', 
                    backgroundColor: '#0F1729', 
                    border: '1px solid #1E293B',
                    borderRadius: '8px',
                    marginBottom: '16px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '12px' }}>
                      <div style={{ 
                        width: '40px', 
                        height: '40px', 
                        borderRadius: '50%', 
                        backgroundColor: '#1E293B',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <User size={20} style={{ color: '#64748B' }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ color: '#F1F5F9', marginBottom: '4px' }}>
                          <strong>{guard.name}</strong>
                        </p>
                        <p style={{ color: '#64748B', fontSize: '13px' }}>{guard.email}</p>
                      </div>
                    </div>
                    <div style={{ 
                      padding: '12px', 
                      backgroundColor: '#0B1220', 
                      borderRadius: '6px',
                      border: '1px solid #1E293B'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <AlertCircle size={16} style={{ color: '#FF7A18' }} />
                        <span style={{ color: '#FF7A18', fontSize: '13px' }}>Document Required</span>
                      </div>
                      <p style={{ color: '#F1F5F9', fontSize: '14px' }}>
                        {documents.find(doc => doc.id === notificationDocumentId)?.name}
                      </p>
                    </div>
                  </div>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'flex-start', 
                    gap: '8px',
                    padding: '12px',
                    backgroundColor: 'rgba(59, 130, 246, 0.05)',
                    border: '1px solid rgba(59, 130, 246, 0.2)',
                    borderRadius: '6px'
                  }}>
                    <AlertCircle size={16} style={{ color: '#3B82F6', marginTop: '2px', flexShrink: 0 }} />
                    <p style={{ color: '#94A3B8', fontSize: '13px', margin: 0 }}>
                      {guard.name} will receive an in-app notification and can upload this document directly from their Guard Portal profile.
                    </p>
                  </div>
                </div>
              )}
            </div>
            {!notificationSent && (
              <div className="modal-footer">
                <button className="button-secondary" onClick={handleCancelNotification}>
                  Cancel
                </button>
                <button className="button-primary" onClick={handleSendNotification}>
                  <UploadCloud size={16} />
                  Send Request
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}