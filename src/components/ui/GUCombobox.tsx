import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Search } from 'lucide-react';

export interface GUComboboxOption {
  value: string;
  label: string;
}

interface GUComboboxProps {
  value: string;
  onChange: (value: string) => void;
  options: GUComboboxOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  className?: string;
  label?: string;
  required?: boolean;
}

/**
 * GUCombobox - Standardized searchable dropdown for Guard Up platform
 * Used for large option lists like Locations/Sites
 * Single-click behavior optimized for laptop trackpads with search functionality
 */
export function GUCombobox({
  value,
  onChange,
  options,
  placeholder = 'Select...',
  searchPlaceholder = 'Search...',
  disabled = false,
  className = '',
  label,
  required = false
}: GUComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<(HTMLDivElement | null)[]>([]);

  const selectedOption = options.find(opt => opt.value === value);

  // Filter options based on search
  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Focus search input when menu opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      // Small delay to ensure the dropdown is rendered
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 10);
    } else {
      setSearchQuery('');
      setFocusedIndex(-1);
    }
  }, [isOpen]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return;

      switch (event.key) {
        case 'Escape':
          event.preventDefault();
          setIsOpen(false);
          triggerRef.current?.focus();
          break;
        case 'ArrowDown':
          event.preventDefault();
          if (document.activeElement === searchInputRef.current) {
            // Move from search to first option
            setFocusedIndex(0);
            optionRefs.current[0]?.scrollIntoView({ block: 'nearest' });
          } else {
            // Move to next option
            setFocusedIndex(prev => {
              const next = prev < filteredOptions.length - 1 ? prev + 1 : prev;
              optionRefs.current[next]?.scrollIntoView({ block: 'nearest' });
              return next;
            });
          }
          break;
        case 'ArrowUp':
          event.preventDefault();
          setFocusedIndex(prev => {
            if (prev > 0) {
              const next = prev - 1;
              optionRefs.current[next]?.scrollIntoView({ block: 'nearest' });
              return next;
            } else {
              // Move back to search input
              searchInputRef.current?.focus();
              return -1;
            }
          });
          break;
        case 'Enter':
          if (document.activeElement !== searchInputRef.current && focusedIndex >= 0 && focusedIndex < filteredOptions.length) {
            event.preventDefault();
            handleSelect(filteredOptions[focusedIndex].value);
          } else if (filteredOptions.length === 1) {
            // If only one option, select it on Enter
            event.preventDefault();
            handleSelect(filteredOptions[0].value);
          }
          break;
        case 'Home':
          if (document.activeElement !== searchInputRef.current) {
            event.preventDefault();
            setFocusedIndex(0);
            optionRefs.current[0]?.scrollIntoView({ block: 'nearest' });
          }
          break;
        case 'End':
          if (document.activeElement !== searchInputRef.current) {
            event.preventDefault();
            setFocusedIndex(filteredOptions.length - 1);
            optionRefs.current[filteredOptions.length - 1]?.scrollIntoView({ block: 'nearest' });
          }
          break;
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, focusedIndex, filteredOptions]);

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
    setSearchQuery('');
    setFocusedIndex(-1);
    triggerRef.current?.focus();
  };

  return (
    <div className={`w-full ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
          {label}
          {required && <span className="text-[var(--accent)] ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        <button
          ref={triggerRef}
          type="button"
          onClick={handleToggle}
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          className={`
            w-full h-10 px-3 rounded-lg
            flex items-center justify-between gap-2
            text-sm text-left
            transition-all duration-200
            ${disabled 
              ? 'bg-[rgba(255,255,255,0.02)] text-[var(--text-muted)] cursor-not-allowed opacity-50' 
              : 'bg-[var(--surface)] text-[var(--text-primary)] hover:bg-[rgba(255,255,255,0.08)] cursor-pointer'
            }
            border border-[var(--border)]
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary-action)]
          `}
        >
          <span className={selectedOption ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronDown 
            className={`w-4 h-4 text-[var(--text-muted)] transition-transform duration-200 flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {isOpen && (
          <div
            className="
              absolute z-50 w-full mt-1
              bg-[#151B2A] rounded-lg border border-[var(--border)]
              shadow-[0_8px_24px_rgba(0,0,0,0.4)]
              max-h-[320px] overflow-hidden
              flex flex-col
            "
          >
            {/* Sticky Search Header */}
            <div className="sticky top-0 z-10 bg-[#151B2A] px-3 pt-2 pb-2 border-b border-[var(--border)]">
              <div className="relative">
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setFocusedIndex(-1); // Reset focus when searching
                  }}
                  placeholder={searchPlaceholder}
                  className="
                    w-full h-9 pl-3 pr-3 rounded-md
                    text-sm text-[var(--text-primary)] leading-9
                    bg-[rgba(255,255,255,0.04)] border border-[var(--border)]
                    placeholder:text-[var(--text-muted)]
                    focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--primary-action)]
                    transition-all duration-200
                  "
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                />
              </div>
            </div>

            {/* Options list */}
            <div
              ref={menuRef}
              role="listbox"
              className="overflow-y-auto py-1"
              style={{ maxHeight: 'calc(320px - 53px)' }}
            >
              {filteredOptions.length === 0 ? (
                <div className="px-3 py-6 text-center text-sm text-[var(--text-muted)]">
                  No results found
                </div>
              ) : (
                filteredOptions.map((option, index) => {
                  const isSelected = option.value === value;
                  const isFocused = index === focusedIndex;
                  return (
                    <div
                      key={option.value}
                      ref={el => optionRefs.current[index] = el}
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => handleSelect(option.value)}
                      onMouseEnter={() => setFocusedIndex(index)}
                      className={`
                        px-3 py-2.5 text-sm cursor-pointer
                        flex items-center justify-between gap-2
                        transition-colors duration-150
                        ${isSelected 
                          ? 'bg-[rgba(59,209,111,0.12)] text-[var(--primary-action)]' 
                          : isFocused
                            ? 'bg-[rgba(255,255,255,0.12)] text-[var(--text-primary)]'
                            : 'text-[var(--text-primary)] hover:bg-[rgba(255,255,255,0.08)]'
                        }
                      `}
                    >
                      <span>{option.label}</span>
                      {isSelected && (
                        <Check className="w-4 h-4 text-[var(--primary-action)] flex-shrink-0" />
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}