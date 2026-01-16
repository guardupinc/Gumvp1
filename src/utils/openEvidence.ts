/**
 * Shared utility for opening evidence/attachments in a new browser tab
 * Used across both review/edit module and approved report viewer
 */

export interface EvidenceItem {
  id?: number;
  url?: string;
  src?: string;
  fileUrl?: string;
  downloadUrl?: string;
  previewUrl?: string;
  name?: string;
}

/**
 * Extract valid URL from evidence item using fallback chain
 */
export function getEvidenceUrl(evidenceItem: EvidenceItem): string | null {
  if (!evidenceItem) return null;
  
  // Try multiple possible URL field names
  return (
    evidenceItem.url ||
    evidenceItem.src ||
    evidenceItem.fileUrl ||
    evidenceItem.downloadUrl ||
    evidenceItem.previewUrl ||
    null
  );
}

/**
 * Open evidence/attachment in a new browser tab
 * Returns true if successful, false if URL is unavailable
 */
export function openEvidence(evidenceItem: EvidenceItem): boolean {
  const url = getEvidenceUrl(evidenceItem);
  
  if (!url) {
    console.warn('Attachment unavailable: no valid URL found', evidenceItem);
    return false;
  }
  
  // Open in new tab with security attributes
  window.open(url, '_blank', 'noopener,noreferrer');
  return true;
}
