import { ReactNode, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import clsx from 'clsx';

export interface Column<T> {
  key: keyof T & string;
  header: string;
  align?: 'left' | 'right';
  render?: (row: T) => ReactNode;
}

type SortDirection = 'asc' | 'desc';

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: keyof T & string;
  initialSort?: { key: keyof T & string; direction: SortDirection };
}

// A generic table: the caller describes columns, the table handles sorting.
// <T,> (with the comma) tells TSX this is a generic, not a JSX tag.
const DataTable = <T,>({
  columns,
  rows,
  rowKey,
  initialSort,
}: DataTableProps<T>) => {
  const [sort, setSort] = useState(initialSort);

  const sortedRows = useMemo(() => {
    if (!sort) return rows;

    // Copy first -- Array.sort mutates, and props must not be mutated
    return [...rows].sort((a, b) => {
      const aValue = a[sort.key];
      const bValue = b[sort.key];
      const result =
        typeof aValue === 'number' && typeof bValue === 'number'
          ? aValue - bValue
          : String(aValue).localeCompare(String(bValue));
      return sort.direction === 'asc' ? result : -result;
    });
  }, [rows, sort]);

  // First click sorts descending (biggest first), second click flips it
  const handleSort = (key: keyof T & string) => {
    setSort((current) =>
      current?.key === key
        ? { key, direction: current.direction === 'asc' ? 'desc' : 'asc' }
        : { key, direction: 'desc' }
    );
  };

  return (
    <table className="data-table">
      <thead>
        <tr>
          {columns.map((column) => {
            const isSorted = sort?.key === column.key;
            const SortIcon = !isSorted
              ? ArrowUpDown
              : sort.direction === 'asc'
                ? ArrowUp
                : ArrowDown;

            return (
              <th
                key={column.key}
                className={clsx(
                  column.align === 'right' && 'data-table__cell--right'
                )}
                aria-sort={
                  isSorted
                    ? sort.direction === 'asc'
                      ? 'ascending'
                      : 'descending'
                    : 'none'
                }
              >
                <button
                  type="button"
                  className={clsx(
                    'data-table__sort',
                    isSorted && 'data-table__sort--active'
                  )}
                  onClick={() => handleSort(column.key)}
                >
                  {column.header}
                  <SortIcon size={12} />
                </button>
              </th>
            );
          })}
        </tr>
      </thead>
      <tbody>
        {sortedRows.map((row) => (
          <tr key={String(row[rowKey])}>
            {columns.map((column) => (
              <td
                key={column.key}
                className={clsx(
                  column.align === 'right' && 'data-table__cell--right'
                )}
              >
                {column.render ? column.render(row) : String(row[column.key])}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default DataTable;
