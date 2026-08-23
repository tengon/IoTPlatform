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
import { AssetsMachinesPage } from '@/features/devices/pages/assets-machines-page'
import { ProductionPage } from '@/features/devices/pages/production-page'
import { DevicesPage } from '@/features/devices/pages/devices-page'
import { GatewaysPage } from '@/features/devices/pages/gateways-page'
import { FirmwareOTAPage } from '@/features/devices/pages/firmware-ota-page'
import { UsersPage } from '@/features/administration/pages/users-page'
import { SitesPage, RolesPermissionsPage, SettingsPage } from '@/features/administration/pages/admin-pages'

const pageComponents: Record<PageId, React.ComponentType> = {
  dashboard: DashboardPage,
  'live-monitoring': LiveMonitoringPage,
  'assets-machines': AssetsMachinesPage,
  production: ProductionPage,
  'historical-data': HistoricalDataPage,
  analytics: AnalyticsPage,
  'energy-monitoring': EnergyMonitoringPage,
  oee: OEEPage,
  'active-alarms': ActiveAlarmsPage,
  'alarm-history': AlarmHistoryPage,
  'alert-rules': AlertRulesPage,
  devices: DevicesPage,
  gateways: GatewaysPage,
  'firmware-ota': FirmwareOTAPage,
  users: UsersPage,
  sites: SitesPage,
  'roles-permissions': RolesPermissionsPage,
  settings: SettingsPage,
}

export default function Home() {
  const { currentPage } = useNavigation()
  const PageComponent = pageComponents[currentPage]

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <AppTopbar />
        <WSInit />
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          {PageComponent ? <PageComponent key={currentPage} /> : null}
        </main>
        <footer className="border-t border-border/50 bg-background/80 backdrop-blur-sm px-6 py-3 mt-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
            <span>Industrial IoT Platform v2.1.0</span>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse-dot" />
                All Systems Operational
              </span>
              <span>Powered by Next.js 16</span>
            </div>
          </div>
        </footer>
      </SidebarInset>
    </SidebarProvider>
  )
}