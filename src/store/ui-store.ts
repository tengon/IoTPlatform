import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { TimeRangePreset, TimeRange, ChartConfig, FactoryFilter } from '@/types'

// ─── UI State Interface ───────────────────────────────────────────────────
// Local client state that controls UI behavior.
// Persisted to localStorage so preferences survive page reloads.

interface UIState {
  // ── Factory / Site Filter ──
  factory: FactoryFilter
  setFactory: (filter: FactoryFilter) => void

  // ── Time Range ──
  timeRange: TimeRange
  setTimeRange: (range: TimeRange) => void
  setTimeRangePreset: (preset: TimeRangePreset) => void

  // ── Chart Configuration ──
  chartConfig: ChartConfig
  updateChartConfig: (patch: Partial<ChartConfig>) => void
  resetChartConfig: () => void

  // ── Sidebar (moved from navigation store for consolidation) ──
  sidebarCollapsed: boolean
  setSidebarCollapsed: (collapsed: boolean) => void
  toggleSidebar: () => void

  // ── Command Palette ──
  commandPaletteOpen: boolean
  setCommandPaletteOpen: (open: boolean) => void

  // ── Notification Panel ──
  notificationPanelOpen: boolean
  setNotificationPanelOpen: (open: boolean) => void

  // ── Activity Feed ──
  activityFeedOpen: boolean
  setActivityFeedOpen: (open: boolean) => void

  // ── Table Preferences ──
  tablePageSize: number
  setTablePageSize: (size: number) => void

  // ── Auto-refresh ──
  autoRefreshEnabled: boolean
  autoRefreshInterval: number  // seconds
  setAutoRefresh: (enabled: boolean, interval?: number) => void
}

// ── Time Range Helpers ────────────────────────────────────────────────────
function getTimeRangeFromPreset(preset: TimeRangePreset): TimeRange {
  const now = Date.now()
  const labels: Record<TimeRangePreset, string> = {
    '1h': 'Last 1 Hour',
    '6h': 'Last 6 Hours',
    '12h': 'Last 12 Hours',
    '24h': 'Last 24 Hours',
    '7d': 'Last 7 Days',
    '30d': 'Last 30 Days',
    custom: 'Custom Range',
  }
  const durations: Record<Exclude<TimeRangePreset, 'custom'>, number> = {
    '1h': 3600_000,
    '6h': 6 * 3600_000,
    '12h': 12 * 3600_000,
    '24h': 24 * 3600_000,
    '7d': 7 * 24 * 3600_000,
    '30d': 30 * 24 * 3600_000,
  }
  return {
    preset,
    from: preset === 'custom' ? now - 3600_000 : now - durations[preset],
    to: now,
    label: labels[preset],
  }
}

const DEFAULT_CHART_CONFIG: ChartConfig = {
  showGrid: true,
  showLegend: true,
  showTooltip: true,
  smoothLines: true,
  lineWidth: 2,
  pointSize: 3,
  animationEnabled: true,
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      // ── Factory ──
      factory: { siteId: null, siteName: null },
      setFactory: (filter) => set({ factory: filter }),

      // ── Time Range ──
      timeRange: getTimeRangeFromPreset('24h'),
      setTimeRange: (range) => set({ timeRange: range }),
      setTimeRangePreset: (preset) => set({ timeRange: getTimeRangeFromPreset(preset) }),

      // ── Chart Config ──
      chartConfig: { ...DEFAULT_CHART_CONFIG },
      updateChartConfig: (patch) =>
        set((s) => ({ chartConfig: { ...s.chartConfig, ...patch } })),
      resetChartConfig: () => set({ chartConfig: { ...DEFAULT_CHART_CONFIG } }),

      // ── Sidebar ──
      sidebarCollapsed: false,
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),

      // ── Panels ──
      commandPaletteOpen: false,
      setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),

      notificationPanelOpen: false,
      setNotificationPanelOpen: (open) => set({ notificationPanelOpen: open }),

      activityFeedOpen: false,
      setActivityFeedOpen: (open) => set({ activityFeedOpen: open }),

      // ── Table ──
      tablePageSize: 10,
      setTablePageSize: (size) => set({ tablePageSize: size }),

      // ── Auto-refresh ──
      autoRefreshEnabled: true,
      autoRefreshInterval: 30,
      setAutoRefresh: (enabled, interval) =>
        set({
          autoRefreshEnabled: enabled,
          ...(interval !== undefined ? { autoRefreshInterval: interval } : {}),
        }),
    }),
    {
      name: 'iiot-ui-state',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Only persist these fields
        factory: state.factory,
        timeRange: state.timeRange,
        chartConfig: state.chartConfig,
        sidebarCollapsed: state.sidebarCollapsed,
        tablePageSize: state.tablePageSize,
        autoRefreshEnabled: state.autoRefreshEnabled,
        autoRefreshInterval: state.autoRefreshInterval,
      }),
    }
  )
)
