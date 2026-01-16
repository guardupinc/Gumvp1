import React from 'react';
import { Filter, X } from 'lucide-react';
import { GUSelect } from './GUSelect';
import { GUCombobox } from './GUCombobox';

export interface ExtendedFiltersState {
  site: string;
  reportTypes: string[];
  hasAttachments: boolean | null;
  filedBy: string;
  assigned: string;
}

interface ExtendedFiltersProps {
  filters: ExtendedFiltersState;
  onFiltersChange: (filters: ExtendedFiltersState) => void;
  sites: string[];
  guards: string[];
}

export function ExtendedFilters({ filters, onFiltersChange, sites, guards }: ExtendedFiltersProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);

  // Report type options (multi-select)
  const reportTypeOptions = [
    { value: 'incident', label: 'IR - Incident' },
    { value: 'dar', label: 'DAR - Daily Activity' },
    { value: 'maintenance', label: 'MNT - Maintenance' },
    { value: 'disciplinary', label: 'DIS - Disciplinary' },
    { value: 'shift_pass_on', label: 'SPO - Shift Pass-On' }
  ];

  const siteOptions = [
    { value: 'all', label: 'All Sites' },
    ...sites.map(site => ({ value: site, label: site }))
  ];

  const guardOptions = [
    { value: 'all', label: 'All Guards' },
    ...guards.map(guard => ({ value: guard, label: guard }))
  ];

  const assignedOptions = [
    { value: 'all', label: 'All Reports' },
    { value: 'unassigned', label: 'Unassigned Only' },
    { value: 'me', label: 'Assigned to Me' },
    { value: 'others', label: 'Assigned to Others' }
  ];

  const handleReportTypeToggle = (type: string) => {
    const newTypes = filters.reportTypes.includes(type)
      ? filters.reportTypes.filter(t => t !== type)
      : [...filters.reportTypes, type];
    
    onFiltersChange({ ...filters, reportTypes: newTypes });
  };

  const hasActiveFilters = 
    filters.site !== 'all' ||
    filters.reportTypes.length > 0 ||
    filters.hasAttachments !== null ||
    filters.filedBy !== 'all' ||
    filters.assigned !== 'all';

  const clearAllFilters = () => {
    onFiltersChange({
      site: 'all',
      reportTypes: [],
      hasAttachments: null,
      filedBy: 'all',
      assigned: 'all'
    });
  };

  return (
    <div className="extended-filters-wrapper">
      <div className="extended-filters-header">
        <button 
          className="extended-filters-toggle"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <Filter size={16} />
          <span>Extended Filters</span>
          {hasActiveFilters && (
            <span className="filter-count-badge">{
              [
                filters.site !== 'all',
                filters.reportTypes.length > 0,
                filters.hasAttachments !== null,
                filters.filedBy !== 'all',
                filters.assigned !== 'all'
              ].filter(Boolean).length
            }</span>
          )}
        </button>
        
        {hasActiveFilters && (
          <button 
            className="clear-filters-btn"
            onClick={clearAllFilters}
          >
            <X size={14} />
            Clear All
          </button>
        )}
      </div>

      {isExpanded && (
        <div className="extended-filters-panel">
          <div className="filters-grid">
            {/* Site / Location */}
            <div className="filter-item">
              <GUCombobox
                label="Site / Location"
                value={filters.site}
                onChange={(value) => onFiltersChange({ ...filters, site: value })}
                options={siteOptions}
                placeholder="All Sites"
                searchPlaceholder="Search sites..."
              />
            </div>

            {/* Filed By */}
            <div className="filter-item">
              <GUCombobox
                label="Filed By"
                value={filters.filedBy}
                onChange={(value) => onFiltersChange({ ...filters, filedBy: value })}
                options={guardOptions}
                placeholder="All Guards"
                searchPlaceholder="Search guards..."
              />
            </div>

            {/* Assigned */}
            <div className="filter-item">
              <GUSelect
                label="Assigned Reviewer"
                value={filters.assigned}
                onChange={(value) => onFiltersChange({ ...filters, assigned: value })}
                options={assignedOptions}
                placeholder="All Reports"
              />
            </div>
          </div>

          {/* Report Type (Multi-select checkboxes) */}
          <div className="filter-item filter-item-full">
            <label className="filter-label">Report Type</label>
            <div className="filter-checkbox-group">
              {reportTypeOptions.map(option => (
                <label key={option.value} className="filter-checkbox-label">
                  <input
                    type="checkbox"
                    checked={filters.reportTypes.includes(option.value)}
                    onChange={() => handleReportTypeToggle(option.value)}
                    className="filter-checkbox"
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Has Attachments (Toggle) */}
          <div className="filter-item filter-item-full">
            <label className="filter-label">Attachments</label>
            <div className="filter-toggle-group">
              <button
                className={`filter-toggle-btn ${filters.hasAttachments === null ? 'active' : ''}`}
                onClick={() => onFiltersChange({ ...filters, hasAttachments: null })}
              >
                All Reports
              </button>
              <button
                className={`filter-toggle-btn ${filters.hasAttachments === true ? 'active' : ''}`}
                onClick={() => onFiltersChange({ ...filters, hasAttachments: true })}
              >
                With Attachments
              </button>
              <button
                className={`filter-toggle-btn ${filters.hasAttachments === false ? 'active' : ''}`}
                onClick={() => onFiltersChange({ ...filters, hasAttachments: false })}
              >
                No Attachments
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}