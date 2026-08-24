# Task 7 - Alerts Page Builder

## Files Created
1. `src/features/alerts/pages/active-alarms-page.tsx` — Active Alarms page
2. `src/features/alerts/pages/alarm-history-page.tsx` — Alarm History page
3. `src/features/alerts/pages/alert-rules-page.tsx` — Alert Rules management page

## Key Design Decisions
- All pages use `'use client'` directive and relative imports (`@/...`)
- Dark industrial theme with emerald primary, critical=red, warning=amber, info=cyan
- Severity-colored left borders on table rows for visual scanning
- Ping animation on severity icons for urgency
- Scrollable tables with `max-h-[calc(100vh-320px)] overflow-y-auto`
- Store integration via `useIIoTStore` from `@/store/iiot`
- All shadcn/ui components used (Table, Card, Badge, Select, Switch, Dialog, Calendar, Popover, Button, Input, Label)

## ESLint: 0 errors
## Dev Server: Compiled successfully