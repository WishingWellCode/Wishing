import { FLAGS } from './flags'

export interface PortalConfig {
  name: string
  title: string
  body: string
  confirmLabel: string
  cancelLabel: string
  onConfirm: () => void
  enabled: boolean
}

export const PORTAL_CONFIGS: Record<string, PortalConfig> = {
  'Portal 1': {
    name: 'Portal 1',
    title: 'Portal 1: Housing District',
    body: 'Welcome to the Housing District!\n\nTo access this portal, you need to visit\nthe Upgrades page first to purchase\nyour housing upgrades.\n\nWould you like to go there now?',
    confirmLabel: 'CONTINUE',
    cancelLabel: 'CANCEL',
    onConfirm: () => {
      if (typeof window !== 'undefined') {
        window.location.href = '/upgrades'
      }
    },
    enabled: true
  },
  'Portal 4': {
    name: 'Portal 4',
    title: 'Leaving the Hub',
    body: "Open the Info page to learn how everything works?",
    confirmLabel: 'Go to Info',
    cancelLabel: 'Stay Here',
    onConfirm: () => {
      if (typeof window !== 'undefined') {
        window.location.href = '/info'
      }
    },
    enabled: FLAGS.PORTAL4
  }
}

export function getPortalConfig(portalName: string): PortalConfig | null {
  const config = PORTAL_CONFIGS[portalName]
  return config?.enabled ? config : null
}

// Analytics helper
export function trackPortalEvent(portalName: string, action: string) {
  const portalNumber = portalName.toLowerCase().replace(' ', '')
  const eventName = `${portalNumber}.${action}`
  
  // Use existing analytics if available, otherwise console log
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', eventName)
  } else {
    console.log(`Analytics: ${eventName}`)
  }
}