import React, { useState } from 'react';

export interface Column<T> {
  key: string;
  header: string;
  render: (row: T, isHovered?: boolean) => React.ReactNode;
  width?: string;
  hideOnMobile?: boolean;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  emptyState?: React.ReactNode;
  onRowClick?: (row: T) => void;
}

export function Table<T extends { id: string | number }>({ columns, data, emptyState, onRowClick }: TableProps<T>) {
  const [hoveredRowId, setHoveredRowId] = useState<string | number | null>(null);

  if (data.length === 0 && emptyState) {
    return <>{emptyState}</>;
  }

  return (
    <div className="table-container">
      <table className="table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th 
                key={column.key} 
                style={{ width: column.width }}
                className={column.hideOnMobile ? 'hide-mobile' : ''}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr 
              key={row.id}
              className={hoveredRowId === row.id ? 'row-hovered' : ''}
              onMouseEnter={() => setHoveredRowId(row.id)}
              onMouseLeave={() => setHoveredRowId(null)}
              onClick={() => onRowClick?.(row)}
            >
              {columns.map((column) => (
                <td 
                  key={column.key}
                  className={column.hideOnMobile ? 'hide-mobile' : ''}
                >
                  {column.render(row, hoveredRowId === row.id)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}