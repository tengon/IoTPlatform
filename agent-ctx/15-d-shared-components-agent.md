# Task 15-d: shared-components-agent

## Completed
- Created `src/shared/components/status-badge.tsx` — reusable StatusBadge with 16 status/severity variants, dot indicator, optional label override
- Created `src/shared/components/sortable-table-header.tsx` — SortableTableHeader component + `useSort<T>` hook (toggle cycle: null → asc → desc → null, string & number sort)
- Modified `src/features/devices/pages/assets-machines-page.tsx` — added sorting on Name, Type, Status, OEE% columns
- Modified `src/features/administration/pages/users-page.tsx` — added sorting on Name, Role, Status columns
- Modified `src/app/globals.css` — added `.table-row-interactive` CSS (hover, active, focus-within styles)
- Lint: 0 errors, 0 warnings
