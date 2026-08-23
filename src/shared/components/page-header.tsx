'use client'

import { type LucideIcon, Clock, ArrowUpDown } from 'lucide-react'

interface PageHeaderProps {
  title: string
  description?: string
  icon?: LucideIcon
  actions?: React.ReactNode
  lastUpdated?: string
  badge?: string
}

export function PageHeader({ title, description, icon: Icon, actions, lastUpdated, badge }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6 animate-slide-up">
      <div className="flex items-center gap-3.5">
        {Icon && (
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/10">
            <Icon className="size-5" />
          </div>
        )}
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
            {badge && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-primary/10 text-primary ring-1 ring-primary/20">
                <ArrowUpDown className="size-2.5" />
                {badge}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
            {lastUpdated && (
              <span className="flex items-center gap-1 text-[11px] text-muted-foreground/50">
                <Clock className="size-3" />
                {lastUpdated}
              </span>
            )}
          </div>
        </div>
      </div>
      {actions && <div className="flex items-center gap-2 mt-2 sm:mt-0 animate-fade-in" style={{ animationDelay: '0.1s' }}>{actions}</div>}
    </div>
  )
}
