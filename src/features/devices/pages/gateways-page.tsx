'use client'

import { useState } from 'react'
import { Radio, Plus, Wifi, WifiOff, AlertTriangle, Cpu, Globe, Server, Layers } from 'lucide-react'
import { PageHeader } from '@/shared/components/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'

interface Gateway {
  id: string
  name: string
  gatewayId: string
  protocol: string
  status: 'online' | 'offline' | 'degraded'
  firmware: string
  ip: string
  port: number
  deviceCount: number
  uptime?: string
}

const mockGateways: Gateway[] = [
  { id: 'GW-001', name: 'Floor A Gateway', gatewayId: 'GW-A1-F01', protocol: 'MQTT', status: 'online', firmware: 'v3.2.1', ip: '192.168.1.101', port: 1883, deviceCount: 24, uptime: '45d 12h' },
  { id: 'GW-002', name: 'Floor B Gateway', gatewayId: 'GW-B1-F01', protocol: 'OPC-UA', status: 'online', firmware: 'v3.2.0', ip: '192.168.1.102', port: 4840, deviceCount: 18, uptime: '30d 8h' },
  { id: 'GW-003', name: 'Warehouse Gateway', gatewayId: 'GW-WH-F01', protocol: 'Modbus TCP', status: 'degraded', firmware: 'v3.1.4', ip: '192.168.1.103', port: 502, deviceCount: 12, uptime: '12d 3h' },
  { id: 'GW-004', name: 'Utility Gateway', gatewayId: 'GW-UT-F01', protocol: 'MQTT', status: 'online', firmware: 'v3.2.1', ip: '192.168.1.104', port: 1883, deviceCount: 8, uptime: '60d 1h' },
  { id: 'GW-005', name: 'Outdoor Sensor Hub', gatewayId: 'GW-OS-F01', protocol: 'LoRaWAN', status: 'offline', firmware: 'v3.0.8', ip: '192.168.2.201', port: 1700, deviceCount: 6, uptime: '-' },
]

const statusConfig: Record<string, { dotColor: string; label: string; icon: typeof Wifi }> = {
  online: { dotColor: '#10b981', label: 'Online', icon: Wifi },
  offline: { dotColor: '#ef4444', label: 'Offline', icon: WifiOff },
  degraded: { dotColor: '#f59e0b', label: 'Degraded', icon: AlertTriangle },
}

const protocolColors: Record<string, string> = {
  'MQTT': 'bg-emerald-500/10 text-emerald-400 border-emerald-400/30',
  'OPC-UA': 'bg-cyan-500/10 text-cyan-400 border-cyan-400/30',
  'Modbus TCP': 'bg-amber-500/10 text-amber-400 border-amber-400/30',
  'LoRaWAN': 'bg-purple-500/10 text-purple-400 border-purple-400/30',
}

export function GatewaysPage() {
  const [dialogOpen, setDialogOpen] = useState(false)

  const onlineCount = mockGateways.filter((g) => g.status === 'online').length
  const totalDevices = mockGateways.reduce((sum, g) => sum + g.deviceCount, 0)

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Radio}
        title="Gateways"
        description="Manage IoT gateway devices"
        actions={
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Plus className="size-4" />
                Add Gateway
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Gateway</DialogTitle>
              </DialogHeader>
              <div className="py-4 text-center text-sm text-muted-foreground">
                Gateway registration form will be available in the next release.
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button onClick={() => setDialogOpen(false)}>Register</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <Radio className="size-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Gateways</p>
              <p className="text-2xl font-bold">{mockGateways.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-emerald-500/20">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10">
              <Wifi className="size-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Online</p>
              <p className="text-2xl font-bold text-emerald-400">{onlineCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/10">
              <Layers className="size-5 text-amber-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Connected Devices</p>
              <p className="text-2xl font-bold">{totalDevices}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {mockGateways.map((gw) => {
          const sc = statusConfig[gw.status]
          const StatusIcon = sc.icon
          return (
            <Card key={gw.id} className={`border-border/50 relative overflow-hidden ${gw.status === 'degraded' ? 'border-amber-500/30' : gw.status === 'offline' ? 'border-red-500/30' : ''}`}>
              <div className={`absolute top-0 left-0 right-0 h-0.5 ${gw.status === 'online' ? 'bg-emerald-500' : gw.status === 'degraded' ? 'bg-amber-500' : 'bg-red-500'}`} />
              <CardHeader className="pb-3 pt-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-base font-semibold">{gw.name}</CardTitle>
                    <p className="text-xs font-mono text-muted-foreground">{gw.gatewayId}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusIcon className={`size-4 ${sc.dotColor === '#10b981' ? 'text-emerald-400' : sc.dotColor === '#ef4444' ? 'text-red-400' : 'text-amber-400'}`} />
                    <span className="flex items-center gap-1.5">
                      <span className="size-2 rounded-full" style={{ backgroundColor: sc.dotColor }} />
                      <span className={`text-xs font-medium ${sc.dotColor === '#10b981' ? 'text-emerald-400' : sc.dotColor === '#ef4444' ? 'text-red-400' : 'text-amber-400'}`}>{sc.label}</span>
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className={protocolColors[gw.protocol] || 'bg-muted text-muted-foreground border-border'}>
                    {gw.protocol}
                  </Badge>
                  <Badge variant="secondary" className="text-xs font-mono">{gw.firmware}</Badge>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Globe className="size-3" />
                      IP Address
                    </div>
                    <p className="font-mono text-xs">{gw.ip}:{gw.port}</p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Cpu className="size-3" />
                      Devices
                    </div>
                    <p className="font-mono text-xs font-medium">{gw.deviceCount} connected</p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Server className="size-3" />
                      Firmware
                    </div>
                    <p className="font-mono text-xs">{gw.firmware}</p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Wifi className="size-3" />
                      Uptime
                    </div>
                    <p className={`font-mono text-xs ${gw.uptime === '-' ? 'text-red-400' : ''}`}>{gw.uptime}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}