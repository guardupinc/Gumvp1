import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface GUSelectOption {
  value: string;
  label: string;
}

interface GUSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: GUSelectOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  label?: string;
  required?: boolean;
}

/**
 * GUSelect - Standardized non-searchable dropdown for Guard Up platform
 * Replaces native <select> elements with consistent dark theme styling
 * Single-click behavior optimized for laptop trackpads
 */
export function GUSelect({
  value,
  onChange,
  options,
  placeholder = 'Select...',
  disabled = false,
  className = '',
  label,
  required = false
}: GUSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<(HTMLDivElement | null)[]>([]);

  const selectedOption = options.find(opt => opt.value === value);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setFocusedIndex(-1);
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
          setFocusedIndex(-1);
          triggerRef.current?.focus();
          break;
        case 'ArrowDown':
          event.preventDefault();
          setFocusedIndex(prev => {
            const next = prev < options.length - 1 ? prev + 1 : prev;
            optionRefs.current[next]?.scrollIntoView({ block: 'nearest' });
            return next;
          });
          break;
        case 'ArrowUp':
          event.preventDefault();
          setFocusedIndex(prev => {
            const next = prev > 0 ? prev - 1 : prev;
            optionRefs.current[next]?.scrollIntoView({ block: 'nearest' });
            return next;
          });
          break;
        case 'Enter':
        case ' ':
          event.preventDefault();
          if (focusedIndex >= 0 && focusedIndex < options.length) {
            handleSelect(options[focusedIndex].value);
          }
          break;
        case 'Home':
          event.preventDefault();
          setFocusedIndex(0);
          optionRefs.current[0]?.scrollIntoView({ block: 'nearest' });
          break;
        case 'End':
          event.preventDefault();
          setFocusedIndex(options.length - 1);
          optionRefs.current[options.length - 1]?.scrollIntoView({ block: 'nearest' });
          break;
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, focusedIndex, options]);

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
      if (!isOpen) {
        // Set initial focus to selected item when opening
        const selectedIndex = options.findIndex(opt => opt.value === value);
        setFocusedIndex(selectedIndex >= 0 ? selectedIndex : 0);
      }
    }
  };

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
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
            ref={menuRef}
            role="listbox"
            className="
              absolute z-50 w-full mt-1
              bg-[#151B2A] rounded-lg border border-[var(--border)]
              shadow-[0_8px_24px_rgba(0,0,0,0.4)]
              max-h-[240px] overflow-y-auto
              py-1
            "
          >
            {options.map((option, index) => {
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
            })}
          </div>
        )}
      </div>
    </div>
  );
}
