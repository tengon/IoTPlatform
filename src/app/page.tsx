'use client'

import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { AppTopbar } from '@/components/layout/app-topbar'
import { WSInit } from '@/components/layout/ws-init'
import { useNavigation, type PageId } from '@/store/navigation'
import { DashboardPage } from '@/features/dashboard/pages/dashboard-page'
import { LiveMonitoringPage } from '@/features/machines/pages/live-monitoring-page'
import { ActiveAlarmsPage } from '@/features/alerts/pages/active-alarms-page'
import { AlarmHistoryPage } from '@/features/alerts/pages/alarm-history-page'
import { AlertRulesPage } from '@/features/alerts/pages/alert-rules-page'
import { HistoricalDataPage } from '@/features/analytics/pages/historical-data-page'
import { AnalyticsPage } from '@/features/analytics/pages/analytics-page'
import { EnergyMonitoringPage } from '@/features/energy/pages/energy-monitoring-page'
import { OEEPage } from '@/features/analytics/pages/oee-page'
import { ReportsPage } from '@/features/analytics/pages/reports-page'
import { AssetsMachinesPage } from '@/features/devices/pages/assets-machines-page'
import { ProductionPage } from '@/features/devices/pages/production-page'
import { MaintenancePage } from '@/features/operations/pages/maintenance-page'
import { DevicesPage } from '@/features/devices/pages/devices-page'
import { GatewaysPage } from '@/features/devices/pages/gateways-page'
import { FirmwareOTAPage } from '@/features/devices/pages/firmware-ota-page'
import { UsersPage } from '@/features/administration/pages/users-page'
import { SitesPage, RolesPermissionsPage, SettingsPage } from '@/features/administration/pages/admin-pages'
import { DiagnosticsPage } from '@/features/administration/pages/diagnostics-page'
import { AuditLogPage } from '@/features/administration/pages/audit-log-page'
import { CommandPalette } from '@/components/layout/command-palette'
import { AlarmToast } from '@/components/layout/alarm-toast'

const pageComponents: Record<PageId, React.ComponentType> = {
  dashboard: DashboardPage,
  'live-monitoring': LiveMonitoringPage,
  'assets-machines': AssetsMachinesPage,
  production: ProductionPage,
  maintenance: MaintenancePage,
  'historical-data': HistoricalDataPage,
  analytics: AnalyticsPage,
  'energy-monitoring': EnergyMonitoringPage,
  oee: OEEPage,
  reports: ReportsPage,
  'active-alarms': ActiveAlarmsPage,
  'alarm-history': AlarmHistoryPage,
  'alert-rules': AlertRulesPage,
  devices: DevicesPage,
  gateways: GatewaysPage,
  'firmware-ota': FirmwareOTAPage,
  users: UsersPage,
  sites: SitesPage,
  'roles-permissions': RolesPermissionsPage,
  diagnostics: DiagnosticsPage,
  'audit-log': AuditLogPage,
  settings: SettingsPage,
}

export default function Home() {
  const { currentPage } = useNavigation()
  const PageComponent = pageComponents[currentPage]

  return (
    <div className="flex h-screen overflow-hidden">
      <CommandPalette />
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className="min-h-0">
          <AppTopbar />
          <AlarmToast />
          <WSInit />
          <main key={currentPage} className="flex-1 min-h-0 p-4 md:p-6 overflow-auto animate-fade-in">
            {PageComponent ? <PageComponent key={currentPage} /> : null}
          </main>
          <footer className="platform-footer border-t border-border/30 bg-card/50 backdrop-blur-sm px-6 py-3.5 mt-auto">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 text-[11px] text-muted-foreground/80">
              <div className="flex items-center gap-3">
                <span className="font-semibold text-muted-foreground">IIoT Platform</span>
                <span className="text-muted-foreground/30">|</span>
                <span>v2.3.0</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse-dot" />
                  All Systems Operational
                </span>
                <span className="text-muted-foreground/30 hidden sm:inline">|</span>
                <span className="flex items-center gap-1.5">
                  <span className="h-1 w-1 rounded-full bg-cyan-500 animate-live-pulse" />
                  WebSocket Connected
                </span>
                <span className="text-muted-foreground/30 hidden sm:inline">|</span>
                <span className="hidden sm:inline">v2.3.0</span>
              </div>
            </div>
          </footer>
        </SidebarInset>
      </SidebarProvider>
    </div>
  )
}