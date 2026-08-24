# Task 6-8: Health Score + Activity Feed

## Files Modified
- `src/store/iiot.ts` — Added `healthScore: number` to `MachineStatus` interface
- `src/components/layout/ws-init.tsx` — Added `healthScore` generation (70-98) in machine mapping
- `src/services/websocket/iiot-client.ts` — Added `healthScore` generation (70-98) in machine mapping
- `src/features/machines/pages/live-monitoring-page.tsx` — Imported and added `HealthScoreRing` to MachineCard header
- `src/components/layout/app-topbar.tsx` — Added `ActivityFeed` component between NotificationPanel and Theme Toggle
- `src/app/globals.css` — CSS animations already existed (no changes needed)

## Files Created
- `src/shared/components/health-score-ring.tsx` — SVG ring component with color coding and animation
- `src/components/layout/activity-feed.tsx` — Popover-based activity feed with mock data and periodic generation

## Key Decisions
- Health ring uses 40x40 size (slightly smaller than 48x48 default) to fit card header
- Activity feed uses `setTimeout` recursion instead of `setInterval` for variable 5-10s intervals
- New events within 30s get the `feed-item-enter` animation class
- Unread count badge uses the same `notification-badge-count` CSS class as the notification panel
- Activity feed subscribes to WebSocket connection state changes for real-time ws events
