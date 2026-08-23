# Task ID: 14-b - Agent: main

## Task
Improve styling consistency for 5 management pages to match dashboard reference quality.

## Files Modified
1. `src/features/devices/pages/assets-machines-page.tsx`
2. `src/features/devices/pages/production-page.tsx`
3. `src/features/devices/pages/devices-page.tsx`
4. `src/features/devices/pages/gateways-page.tsx`
5. `src/features/devices/pages/firmware-ota-page.tsx`

## Key Changes
- Added `lastUpdated` from `useIIoTStore` with `formatDistanceToNow` to all 5 PageHeaders
- Added `animate-slide-up` + stagger classes to all main wrappers and sections
- Consistent table styling: `text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60` headers, `hover:bg-muted/20 transition-colors duration-150` rows, `py-3` padding
- Badge improvements: `ring-2` with `color/20`, `boxShadow: none`
- Card improvements: `hover:border-border/60 transition-colors duration-300`, `pt-5 px-5 pb-5`
- Empty states: `Inbox` icon + heading + description, centered
- Assets: left border color indicators on rows, `oeeColor()` from chart-utils
- Production: percentage text overlay on progress bars
- Devices: status icons in stat cards, improved Add Device dialog with sections
- Gateways: `h-[2px]` top border, larger connected devices count (`text-3xl`), status badge with dot
- Firmware/OTA: active tab `bg-primary/15 text-primary`, DialogDescription on dialogs

## Result
- Lint: 0 errors, 0 warnings
- Dev server: compiles successfully
- No data logic or structure changes
