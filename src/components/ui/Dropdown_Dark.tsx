import React from 'react';
import '../../dropdown-dark.css';

interface DropdownOption {
  value: string;
  label: string;
}

interface DropdownDarkProps {
  value: string;
  onChange: (value: string) => void;
  options: DropdownOption[];
  className?: string;
}

export function Dropdown_Dark({ value, onChange, options, className = '' }: DropdownDarkProps) {
  return (
    <select 
      value={value} 
      onChange={(e) => onChange(e.target.value)}
      className={`dropdown-dark ${className}`}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
