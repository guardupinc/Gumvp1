export async function generateReportPDF(report: any, organization: any) {
  // ============================================================================
  // DEBUG: Log PDF generation request
  // ============================================================================
  console.log('='.repeat(80));
  console.log('🏗️  SERVER-SIDE PDF GENERATION');
  console.log('='.repeat(80));
  console.log('[generateReportPDF] Generating PDF for report:');
  console.log('Report ID:', report.id);
  console.log('Report Code:', report.reportCode);
  console.log('Report Type:', report.reportType || 'unknown');
  console.log('Organization:', organization?.display_name || organization?.name || 'Not provided');
  console.log('Status:', report.status);
  console.log('Reviewer:', report.reviewed_by_name || 'Pending');
  console.log('Reviewed At:', report.reviewed_at || 'N/A');
  console.log('');
  
  // Type-specific field logging
  if (report.reportType === 'incident') {
    console.log('📋 INCIDENT REPORT FIELDS:');
    console.log('   Incident Type:', report.incidentType || 'N/A');
    console.log('   Actions Taken:', report.actionTaken ? 'Provided' : 'N/A');
    console.log('   Police Called:', report.police_called !== undefined ? report.police_called : 'N/A');
    console.log('   PD Case #:', report.pd_case_number || 'N/A');
  } else if (report.reportType === 'dar') {
    console.log('📋 DAR REPORT FIELDS:');
    console.log('   Shift Start:', report.shiftStart || 'N/A');
    console.log('   Shift End:', report.shiftEnd || 'N/A');
    console.log('   Relief Guard:', report.reliefGuard || 'N/A');
    console.log('   Equipment Status:', report.equipmentStatus ? 'Provided' : 'N/A');
  } else if (report.reportType === 'maintenance') {
    console.log('📋 MAINTENANCE REPORT FIELDS:');
    console.log('   Category:', report.maintenanceCategory || 'N/A');
    console.log('   Specific Area:', report.specificArea || 'N/A');
    console.log('   Asset ID:', report.assetId || 'N/A');
  } else if (report.reportType === 'disciplinary') {
    console.log('📋 DISCIPLINARY REPORT FIELDS:');
    console.log('   Employee Name:', report.employeeName || 'N/A');
    console.log('   Violation Type:', report.violationType || 'N/A');
    console.log('   Discipline Level:', report.disciplineLevel || 'N/A');
    console.log('   Corrective Action:', report.correctiveAction ? 'Provided' : 'N/A');
  }
  
  console.log('');
  console.log('Attachments:', report.attachments?.length || 0);
  console.log('='.repeat(80));
  console.log('');
    
  const { PDFDocument, StandardFonts, rgb } = await import('https://esm.sh/pdf-lib@1.17.1');
    
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
  const pageWidth = 595;
  const pageHeight = 842; // A4 size
  const margin = 50;
  const contentWidth = pageWidth - (margin * 2);
    
  let currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
  let yPos = pageHeight - 50;
    
  // Track page numbers
  const pages: any[] = [currentPage];
    
  // Helper to add new page
  const addNewPage = () => {
    currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
    pages.push(currentPage);
    yPos = pageHeight - 50;
  };
    
  // Helper to check if we need a new page
  const checkPageBreak = (spaceNeeded: number) => {
    if (yPos - spaceNeeded < 70) { // Leave space for footer
      addNewPage();
      return true;
    }
    return false;
  };
    
  // ============================================================================
  // TIMEZONE FORMATTING - Uses organization timezone (default: America/New_York)
  // ============================================================================
  const organizationTimezone = organization?.settings?.timezone || 'America/New_York';
  
  // Helper to format date with organization timezone
  const formatDate = (dateString: string): string => {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      // Format with organization timezone: "Jan 12, 2026 9:57 AM"
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        timeZone: organizationTimezone
      }).format(date);
    } catch (error) {
      console.error('[PDF] Error formatting date:', error);
      return dateString; // Fallback to original if parsing fails
    }
  };
  
  // Helper to format approval timestamp (uses reviewed_at/approved_at)
  const formatApprovalTimestamp = (approvedAt: string): string => {
    return formatDate(approvedAt);
  };
    
  // Word-wrap helper - splits text into lines that fit within maxWidth
  const wrapText = (text: string, maxWidth: number, fontSize: number, currentFont: any): string[] => {
    const words = text.split(/\s+/);
    const lines: string[] = [];
    let currentLine = '';
    
    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const testWidth = currentFont.widthOfTextAtSize(testLine, fontSize);
      
      if (testWidth > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    
    if (currentLine) {
      lines.push(currentLine);
    }
    
    return lines;
  };
    
  // Helper to add text with automatic wrapping and page breaks
  const addText = (text: string, size: number = 10, bold: boolean = false, options: {
    indent?: number;
    color?: [number, number, number];
    lineHeight?: number;
  } = {}) => {
    const currentFont = bold ? fontBold : font;
    const indent = options.indent || 0;
    const color = options.color || [0, 0, 0];
    const lineHeight = options.lineHeight || 15;
    const maxWidth = contentWidth - indent;
    
    const lines = wrapText(text, maxWidth, size, currentFont);
    
    for (const line of lines) {
      checkPageBreak(lineHeight + 5);
      
      currentPage.drawText(line, {
        x: margin + indent,
        y: yPos,
        size,
        font: currentFont,
        color: rgb(color[0], color[1], color[2])
      });
      
      yPos -= lineHeight;
    }
  };
    
  // Helper to add section header
  const addSectionHeader = (text: string) => {
    checkPageBreak(30);
    yPos -= 5; // Extra spacing before section
    addText(text, 11, true);
    yPos -= 5; // Extra spacing after section
  };
    
  // Helper to add field in 2-column format
  const addField = (label: string, value: string, isRightColumn: boolean = false) => {
    const xPos = isRightColumn ? margin + (contentWidth / 2) + 10 : margin;
    const maxWidth = (contentWidth / 2) - 20;
    
    checkPageBreak(30);
    
    // Draw label
    currentPage.drawText(label, {
      x: xPos,
      y: yPos,
      size: 9,
      font: font,
      color: rgb(0.5, 0.5, 0.5)
    });
    
    // Draw value (wrapped if necessary)
    const valueLines = wrapText(value, maxWidth, 10, font);
    let valueY = yPos - 14;
    
    for (const line of valueLines) {
      currentPage.drawText(line, {
        x: xPos,
        y: valueY,
        size: 10,
        font: fontBold,
        color: rgb(0, 0, 0)
      });
      valueY -= 12;
    }
  };
    
  // ============================================================================
  // REPORT TYPE DETECTION
  // ============================================================================
  const reportType = report.reportType || 'other';
  const isIncidentReport = reportType === 'incident';
  const isDARReport = reportType === 'dar';
  const isMaintenanceReport = reportType === 'maintenance';
  const isDisciplinaryReport = reportType === 'disciplinary';
  const isShiftPassOn = reportType === 'shift_pass_on' || reportType === 'other';
    
  // Get organization name (fallback to "Organization" if not provided)
  const organizationName = organization?.display_name || organization?.name || 'Organization';
    
  // =========================================================================
  // A) HEADER
  // =========================================================================
  addText(organizationName.toUpperCase(), 16, true);
  yPos -= 10;
    
  // Report Type Title
  const reportTypeName = isIncidentReport ? 'INCIDENT REPORT' :
                        isDARReport ? 'DAILY ACTIVITY REPORT' :
                        isMaintenanceReport ? 'MAINTENANCE REQUEST' :
                        isDisciplinaryReport ? 'DISCIPLINARY REPORT' :
                        'SHIFT PASS-ON LOG';
  addText(reportTypeName, 14, true);
  yPos -= 5;
    
  // Software attribution
  addText('Generated via Guard Up (Security Management Software)', 8, false, { color: [0.5, 0.5, 0.5] });
  yPos -= 5;
    
  // Orange divider line
  currentPage.drawLine({
    start: { x: margin, y: yPos },
    end: { x: pageWidth - margin, y: yPos },
    thickness: 2,
    color: rgb(1, 0.48, 0.09) // Accent color #FF7A18
  });
  yPos -= 20;
    
  // =========================================================================
  // B) KEY FACTS SECTION (2-column grid)
  // =========================================================================
  const caseId = report.reportCode || report.caseId || 'N/A';
  const site = report.site || report.siteName || 'N/A';
  const location = report.location || report.locationName || report.postName || 'N/A';
  const guardName = report.guardName || report.filedBy || report.createdByName || 'N/A';
  const dateTime = report.occurredAt || report.timestamp || report.filedOn || report.created_at || 'N/A';
  const status = (report.status || 'N/A').toUpperCase();
  const urgency = report.urgency || report.priority || 'Normal';
    
  // Format date/time to human-readable
  const formattedDate = formatDate(dateTime);
    
  // First row
  addField('Case ID', caseId, false);
  addField('Site', site, true);
  yPos -= 35;
    
  // Second row
  addField('Specific Location', location, false);
  addField('Guard Name', guardName, true);
  yPos -= 35;
    
  // Third row
  addField('Date/Time', formattedDate, false);
  addField('Status', status, true);
  yPos -= 35;
    
  // Fourth row (Incident reports only)
  if (isIncidentReport) {
    const incidentType = report.incidentType || 'Not Specified';
    addField('Incident Type', incidentType, false);
    addField('Urgency', urgency, true);
  }
  yPos -= 40;
    
  // =========================================================================
  // C) NARRATIVE (REQUIRED)
  // =========================================================================
  addSectionHeader('NARRATIVE');
  const narrative = report.narrativeOnly || report.narrative || report.content || report.description || 'N/A';
  addText(narrative, 10, false, { lineHeight: 14 });
  yPos -= 10;
    
  // =========================================================================
  // D) REPORT-TYPE-SPECIFIC SECTIONS
  // =========================================================================
  
  // D1) INCIDENT REPORTS: Actions Taken & Police Response
  if (isIncidentReport) {
    addSectionHeader('ACTIONS TAKEN');
    const actionTaken = report.actionTaken || report.actionsTaken || 'N/A';
    addText(actionTaken, 10, false, { lineHeight: 14 });
    yPos -= 10;
    
    // Police Response (only if data exists)
    const policeCalled = report.police_called !== undefined ? report.police_called : report.policeCalled;
    const pdCaseNumber = report.pd_case_number || report.pdCaseNumber;
    const showPoliceSection = policeCalled === true || policeCalled === 'Yes' || policeCalled === 'yes' || pdCaseNumber;
    
    if (showPoliceSection) {
      addSectionHeader('POLICE RESPONSE');
      const wasPoliceCalledText = (policeCalled === true || policeCalled === 'Yes' || policeCalled === 'yes') ? 'Yes' : 'No';
      addText(`Police Called: ${wasPoliceCalledText}`, 10, false);
      yPos -= 5;
      
      if (pdCaseNumber) {
        addField('PD Case #', pdCaseNumber, false);
        yPos -= 25;
      }
      yPos -= 10;
    }
  }
  
  // D2) DAR REPORTS: Shift Details & Equipment Status
  if (isDARReport) {
    addSectionHeader('SHIFT DETAILS');
    
    const shiftStart = report.shiftStart ? formatDate(report.shiftStart) : 'N/A';
    const shiftEnd = report.shiftEnd ? formatDate(report.shiftEnd) : 'N/A';
    const reliefGuard = report.reliefGuard || 'N/A';
    
    addField('Shift Start', shiftStart, false);
    addField('Shift End', shiftEnd, true);
    yPos -= 35;
    
    addField('Relief Guard', reliefGuard, false);
    yPos -= 35;
    
    // Equipment Status (if provided)
    if (report.equipmentStatus) {
      addSectionHeader('EQUIPMENT STATUS');
      addText(report.equipmentStatus, 10, false, { lineHeight: 14 });
      yPos -= 10;
    }
  }
  
  // D3) MAINTENANCE REPORTS: Asset & Category Details
  if (isMaintenanceReport) {
    addSectionHeader('MAINTENANCE DETAILS');
    
    const category = report.maintenanceCategory || 'N/A';
    const specificArea = report.specificArea || 'N/A';
    const assetId = report.assetId || 'N/A';
    
    addField('Category', category, false);
    addField('Specific Area', specificArea, true);
    yPos -= 35;
    
    if (report.assetId) {
      addField('Asset ID', assetId, false);
      yPos -= 35;
    }
  }
  
  // D4) DISCIPLINARY REPORTS: Employee & Violation Details  
  if (isDisciplinaryReport) {
    addSectionHeader('DISCIPLINARY DETAILS');
    
    const employeeName = report.employeeName || 'N/A';
    const violationType = report.violationType || 'N/A';
    const disciplineLevel = report.disciplineLevel || 'N/A';
    
    addField('Employee Name', employeeName, false);
    addField('Violation Type', violationType, true);
    yPos -= 35;
    
    addField('Discipline Level', disciplineLevel, false);
    yPos -= 35;
    
    // Corrective Action (if provided)
    if (report.correctiveAction) {
      addSectionHeader('CORRECTIVE ACTION');
      addText(report.correctiveAction, 10, false, { lineHeight: 14 });
      yPos -= 10;
    }
  }
    
  // =========================================================================
  // E) EVIDENCE / ATTACHMENTS
  // =========================================================================
  addSectionHeader('EVIDENCE / ATTACHMENTS');
  const hasAttachments = report.attachments && report.attachments.length > 0;
  if (hasAttachments) {
    const attachmentCount = report.attachments.length;
    addText(`Total Attachments: ${attachmentCount}`, 10, true);
    yPos -= 5;
    
    report.attachments.forEach((att: any, index: number) => {
      const fileName = att.name || att.url || 'Attachment';
      addText(`${index + 1}. ${fileName}`, 10, false, { lineHeight: 14 });
    });
  } else {
    addText('None', 10, false);
  }
  yPos -= 10;
    
  // =========================================================================
  // F) SUPERVISOR REVIEW
  // =========================================================================
  addSectionHeader('SUPERVISOR REVIEW');
    
  const reviewedBy = report.reviewed_by_name || report.approvedBy || 'Pending';
  const reviewedAtRaw = report.reviewed_at || report.approvedAt || '';
  const reviewedAt = reviewedAtRaw ? formatApprovalTimestamp(reviewedAtRaw) : 'N/A';
    
  checkPageBreak(80);
    
  addField('Reviewed By', reviewedBy, false);
  addField('Reviewed Date', reviewedAt, true);
  yPos -= 40;
    
  // Signature line
  checkPageBreak(35);
  currentPage.drawLine({
    start: { x: margin, y: yPos },
    end: { x: margin + 200, y: yPos },
    thickness: 1,
    color: rgb(0.7, 0.7, 0.7)
  });
  yPos -= 15;
  addText('Reviewed and approved electronically', 9, false, { color: [0.5, 0.5, 0.5] });
    
  // =========================================================================
  // FOOTER - Add to all pages
  // =========================================================================
  const totalPages = pages.length;
    
  pages.forEach((page, index) => {
    const pageNum = index + 1;
    
    // Left: Confidential
    page.drawText('Confidential – For Client Use Only', {
      x: margin,
      y: 30,
      size: 8,
      font,
      color: rgb(0.5, 0.5, 0.5)
    });
    
    // Right: Page number
    const pageText = `Page ${pageNum} of ${totalPages}`;
    const pageTextWidth = font.widthOfTextAtSize(pageText, 8);
    page.drawText(pageText, {
      x: pageWidth - margin - pageTextWidth,
      y: 30,
      size: 8,
      font,
      color: rgb(0.5, 0.5, 0.5)
    });
  });
    
  // Generate PDF bytes
  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}