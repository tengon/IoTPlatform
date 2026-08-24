'use client'

import { useState, useEffect } from 'react'
import { RefreshCw, Upload, Download, CheckCircle2, XCircle, Clock, Loader2, FileText, Tag, Inbox } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { useIIoTStore } from '@/store/iiot'
import { PageHeader } from '@/shared/components/page-header'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'

interface FirmwareVersion {
  version: string
  releaseDate: string
  changelog: string
  compatibility: string[]
  status: 'stable' | 'beta' | 'deprecated'
}

interface DeviceFirmware {
  id: string
  name: string
  currentVersion: string
  availableVersion: string
  updateAvailable: boolean
}

interface OTAHistoryEntry {
  id: string
  device: string
  fromVersion: string
  toVersion: string
  status: 'success' | 'failed' | 'pending' | 'in-progress'
  date: string
  progress?: number
}

const firmwareVersions: FirmwareVersion[] = [
  { version: 'v3.2.1', releaseDate: '2024-01-10', changelog: 'Fixed MQTT reconnect issue, improved TLS handshake performance, added device health heartbeat', compatibility: ['GW-001', 'GW-002', 'GW-004'], status: 'stable' },
  { version: 'v3.2.0', releaseDate: '2024-01-02', changelog: 'OPC-UA security patch, Modbus TCP polling optimization, new LoRaWAN gateway support', compatibility: ['GW-001', 'GW-002', 'GW-004'], status: 'stable' },
  { version: 'v3.1.4', releaseDate: '2023-12-15', changelog: 'LoRaWAN class C support, improved data compression, fixed memory leak in long-running connections', compatibility: ['GW-003'], status: 'stable' },
  { version: 'v3.3.0-beta', releaseDate: '2024-01-14', changelog: 'Edge computing support, local alert rules engine, MQTT v5 migration', compatibility: ['GW-001', 'GW-002'], status: 'beta' },
  { version: 'v3.0.8', releaseDate: '2023-10-20', changelog: 'Initial LoRaWAN support, basic device management', compatibility: ['GW-005'], status: 'deprecated' },
]

const deviceFirmware: DeviceFirmware[] = [
  { id: 'DF-001', name: 'Floor A Gateway (GW-A1-F01)', currentVersion: 'v3.2.1', availableVersion: 'v3.3.0-beta', updateAvailable: true },
  { id: 'DF-002', name: 'Floor B Gateway (GW-B1-F01)', currentVersion: 'v3.2.0', availableVersion: 'v3.3.0-beta', updateAvailable: true },
  { id: 'DF-003', name: 'Warehouse Gateway (GW-WH-F01)', currentVersion: 'v3.1.4', availableVersion: 'v3.2.1', updateAvailable: true },
  { id: 'DF-004', name: 'Utility Gateway (GW-UT-F01)', currentVersion: 'v3.2.1', availableVersion: 'v3.3.0-beta', updateAvailable: true },
  { id: 'DF-005', name: 'Outdoor Sensor Hub (GW-OS-F01)', currentVersion: 'v3.0.8', availableVersion: 'v3.2.1', updateAvailable: true },
]

const otaHistory: OTAHistoryEntry[] = [
  { id: 'OTA-001', device: 'Floor A Gateway', fromVersion: 'v3.2.0', toVersion: 'v3.2.1', status: 'success', date: '2024-01-12 14:30' },
  { id: 'OTA-002', device: 'Utility Gateway', fromVersion: 'v3.1.4', toVersion: 'v3.2.1', status: 'success', date: '2024-01-12 14:35' },
  { id: 'OTA-003', device: 'Warehouse Gateway', fromVersion: 'v3.1.3', toVersion: 'v3.1.4', status: 'success', date: '2024-01-10 09:00' },
  { id: 'OTA-004', device: 'Floor B Gateway', fromVersion: 'v3.1.5', toVersion: 'v3.2.0', status: 'failed', date: '2024-01-05 16:20' },
  { id: 'OTA-005', device: 'Floor B Gateway', fromVersion: 'v3.1.5', toVersion: 'v3.2.0', status: 'success', date: '2024-01-06 10:15' },
  { id: 'OTA-006', device: 'Outdoor Sensor Hub', fromVersion: 'v3.0.7', toVersion: 'v3.0.8', status: 'success', date: '2023-10-22 11:00' },
  { id: 'OTA-007', device: 'Floor A Gateway', fromVersion: 'v3.2.0', toVersion: 'v3.3.0-beta', status: 'in-progress', date: '2024-01-15 10:45', progress: 67 },
  { id: 'OTA-008', device: 'Warehouse Gateway', fromVersion: 'v3.1.4', toVersion: 'v3.2.1', status: 'pending', date: '2024-01-15 11:00' },
]

const statusConfig: Record<string, { icon: typeof CheckCircle2; color: string; bg: string; border: string; ring: string; label: string }> = {
  success: { icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/30', ring: 'ring-emerald-400/20', label: 'Success' },
  failed: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-400/10', border: 'border-red-400/30', ring: 'ring-red-400/20', label: 'Failed' },
  pending: { icon: Clock, color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/30', ring: 'ring-amber-400/20', label: 'Pending' },
  'in-progress': { icon: Loader2, color: 'text-cyan-400', bg: 'bg-cyan-400/10', border: 'border-cyan-400/30', ring: 'ring-cyan-400/20', label: 'In Progress' },
}

const fwStatusColors: Record<string, string> = {
  stable: 'bg-emerald-400/10 text-emerald-400 border-emerald-400/30 ring-emerald-400/20',
  beta: 'bg-amber-400/10 text-amber-400 border-amber-400/30 ring-amber-400/20',
  deprecated: 'bg-red-400/10 text-red-400 border-red-400/30 ring-red-400/20',
}

export function FirmwareOTAPage() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [updatingDevice, setUpdatingDevice] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('devices')
  const { lastUpdate } = useIIoTStore()
  const [lastUpdatedText, setLastUpdatedText] = useState('—')

  useEffect(() => {
    function update() {
      if (lastUpdate) {
        setLastUpdatedText(formatDistanceToNow(new Date(lastUpdate), { addSuffix: true }))
      }
    }
    update()
    const interval = setInterval(update, 10000)
    return () => clearInterval(interval)
  }, [lastUpdate])

  const handleUpdate = (deviceId: string) => {
    setUpdatingDevice(deviceId)
    setTimeout(() => setUpdatingDevice(null), 2000)
  }

  return (
    <div className="space-y-6 animate-slide-up">
      <PageHeader
        icon={RefreshCw}
        title="Firmware / OTA"
        description="Manage device firmware updates"
        lastUpdated={lastUpdatedText}
        actions={
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Upload className="size-4" />
                Upload Firmware
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload Firmware</DialogTitle>
                <DialogDescription>Upload a firmware binary to make it available for OTA deployment.</DialogDescription>
              </DialogHeader>
              <div className="py-8 text-center text-sm text-muted-foreground border-2 border-dashed border-border/50 rounded-lg hover:border-primary/30 transition-colors duration-300">
                <Upload className="size-8 mx-auto mb-2 text-muted-foreground/30" />
                <p>Drag & drop firmware file or click to browse</p>
                <p className="text-xs mt-1 text-muted-foreground/50">Supported: .bin, .hex, .fw</p>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button onClick={() => setDialogOpen(false)}>Upload</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="animate-slide-up stagger-1">
        <TabsList>
          <TabsTrigger value="devices" className={`text-xs ${activeTab === 'devices' ? 'bg-primary/15 text-primary' : ''}`}>Device Firmware</TabsTrigger>
          <TabsTrigger value="versions" className={`text-xs ${activeTab === 'versions' ? 'bg-primary/15 text-primary' : ''}`}>Available Versions</TabsTrigger>
          <TabsTrigger value="history" className={`text-xs ${activeTab === 'history' ? 'bg-primary/15 text-primary' : ''}`}>Update History</TabsTrigger>
        </TabsList>

        <TabsContent value="devices" className="space-y-4 mt-4">
          <Card className="border-border/50 hover:border-border/60 transition-colors duration-300">
            <CardHeader className="pb-3 pt-5">
              <CardTitle className="text-sm font-semibold">Device Firmware Status</CardTitle>
              <CardDescription className="text-xs text-muted-foreground">Current firmware versions and available updates</CardDescription>
            </CardHeader>
            <CardContent className="pb-5">
              <div className="max-h-[calc(100vh-360px)] overflow-y-auto rounded-lg border border-border/40 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-border/30">
                      <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">Device</TableHead>
                      <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">Current Version</TableHead>
                      <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">Available</TableHead>
                      <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">Status</TableHead>
                      <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deviceFirmware.map((df) => {
                      const isUpdating = updatingDevice === df.id
                      return (
                        <TableRow key={df.id} className="hover:bg-muted/20 transition-colors duration-150">
                          <TableCell className="font-medium text-sm py-3">{df.name}</TableCell>
                          <TableCell className="font-mono text-xs py-3 metric-value">{df.currentVersion}</TableCell>
                          <TableCell className="py-3">
                            <Badge variant="outline" className="text-xs font-mono border-amber-400/30 bg-amber-400/10 text-amber-400 ring-2 ring-amber-400/20" style={{ boxShadow: 'none' }}>
                              {df.availableVersion}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-3">
                            {isUpdating ? (
                              <div className="flex items-center gap-2">
                                <Loader2 className="size-3.5 animate-spin text-cyan-400" />
                                <span className="text-xs text-cyan-400">Updating...</span>
                              </div>
                            ) : df.updateAvailable ? (
                              <Badge variant="outline" className="text-xs border-amber-400/30 bg-amber-400/10 text-amber-400 ring-2 ring-amber-400/20" style={{ boxShadow: 'none' }}>Update Available</Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs border-emerald-400/30 bg-emerald-400/10 text-emerald-400 ring-2 ring-emerald-400/20" style={{ boxShadow: 'none' }}>Up to Date</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right py-3">
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1.5 h-7 text-xs"
                              disabled={isUpdating}
                              onClick={() => handleUpdate(df.id)}
                            >
                              {isUpdating ? <Loader2 className="size-3 animate-spin" /> : <Download className="size-3" />}
                              {isUpdating ? 'Updating' : 'Update'}
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="versions" className="space-y-4 mt-4">
          <ScrollArea className="max-h-[calc(100vh-340px)]">
            <div className="space-y-4">
              {firmwareVersions.map((fw, i) => (
                <Card key={fw.version} className={`border-border/50 hover:border-border/60 transition-colors duration-300 ${fw.status === 'deprecated' ? 'opacity-60' : ''}`} style={{ animationDelay: `${i * 50}ms` }}>
                  <CardContent className="pt-5 px-5 pb-5">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-3">
                          <Tag className="size-4 text-muted-foreground" />
                          <span className="font-mono font-semibold text-sm metric-value">{fw.version}</span>
                          <Badge variant="outline" className={`text-xs ring-2 ${fwStatusColors[fw.status]}`} style={{ boxShadow: 'none' }}>{fw.status}</Badge>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <FileText className="size-3" />
                          <span>Released: {fw.releaseDate}</span>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">{fw.changelog}</p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs text-muted-foreground">Compatible:</span>
                          {fw.compatibility.map((c) => (
                            <Badge key={c} variant="secondary" className="text-xs font-mono">{c}</Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="history" className="space-y-4 mt-4">
          <Card className="border-border/50 hover:border-border/60 transition-colors duration-300">
            <CardContent className="pt-5 px-5 pb-5">
              <div className="max-h-[calc(100vh-360px)] overflow-y-auto rounded-lg border border-border/40 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-border/30">
                      <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">Device</TableHead>
                      <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">From</TableHead>
                      <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">To</TableHead>
                      <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">Status</TableHead>
                      <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60 min-w-[120px]">Progress</TableHead>
                      <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {otaHistory.map((entry) => {
                      const sc = statusConfig[entry.status]
                      const StatusIcon = sc.icon
                      return (
                        <TableRow key={entry.id} className={`hover:bg-muted/20 transition-colors duration-150 ${entry.status === 'failed' ? 'bg-red-500/5' : ''}`}>
                          <TableCell className="font-medium text-sm py-3">{entry.device}</TableCell>
                          <TableCell className="font-mono text-xs text-muted-foreground py-3">{entry.fromVersion}</TableCell>
                          <TableCell className="font-mono text-xs py-3 metric-value">{entry.toVersion}</TableCell>
                          <TableCell className="py-3">
                            <div className="flex items-center gap-1.5">
                              <StatusIcon className={`size-3.5 ${sc.color} ${entry.status === 'in-progress' ? 'animate-spin' : ''}`} />
                              <Badge variant="outline" className={`${sc.bg} ${sc.color} ${sc.border} ring-2 ${sc.ring} text-xs`} style={{ boxShadow: 'none' }}>{sc.label}</Badge>
                            </div>
                          </TableCell>
                          <TableCell className="py-3">
                            {entry.status === 'in-progress' && entry.progress !== undefined ? (
                              <div className="flex items-center gap-2">
                                <div className="relative flex-1">
                                  <Progress value={entry.progress} className="h-2 rounded-full [&>div]:rounded-full [&>div]:bg-cyan-500" />
                                </div>
                                <span className="text-xs font-mono text-cyan-400 w-10 text-right metric-value">{entry.progress}%</span>
                              </div>
                            ) : entry.status === 'pending' ? (
                              <span className="text-xs text-muted-foreground">Queued</span>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap py-3">{entry.date}</TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}