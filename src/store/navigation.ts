import { create } from 'zustand'

export type PageId =
  | 'dashboard'
  | 'live-monitoring'
  | 'assets-machines'
  | 'production'
  | 'maintenance'
  | 'historical-data'
  | 'analytics'
  | 'energy-monitoring'
  | 'oee'
  | 'active-alarms'
  | 'alarm-history'
  | 'alert-rules'
  | 'devices'
  | 'gateways'
  | 'firmware-ota'
  | 'users'
  | 'sites'
  | 'roles-permissions'
  | 'settings'

interface NavigationState {
  currentPage: PageId
  sidebarCollapsed: boolean
  setCurrentPage: (page: PageId) => void
  toggleSidebar: () => void
}

export const useNavigation = create<NavigationState>((set) => ({
  currentPage: 'dashboard',
  sidebarCollapsed: false,
  setCurrentPage: (page) => set({ currentPage: page }),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
}))
