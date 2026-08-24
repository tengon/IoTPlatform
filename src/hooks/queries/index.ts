// ─── Server State: TanStack Query Hooks ───────────────────────────────────
// These hooks fetch data via REST API and manage caching.
// Real-time data comes from WebSocket → useRealtimeStore instead.

export { useMachinesQuery } from './use-machines-query'
export { useDevicesQuery } from './use-devices-query'
export { useAlarmsQuery } from './use-alarms-query'
export { useProductionQuery } from './use-production-query'
export { useEnergyQuery } from './use-energy-query'
export { useSitesQuery } from './use-sites-query'
export { useTelemetryQuery } from './use-telemetry-query'
export { useUsersQuery } from './use-users-query'
