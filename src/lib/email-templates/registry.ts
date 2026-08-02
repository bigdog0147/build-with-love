import type { ComponentType } from 'react'
import { template as kycStatusTemplate } from './kyc-status'
import { template as adminPasswordResetTemplate } from './admin-password-reset'
import { template as withdrawalStatusTemplate } from './withdrawal-status'
import { template as depositStatusTemplate } from './deposit-status'
import { template as announcementTemplate } from './announcement'
import { template as adminInviteTemplate } from './admin-invite'





export interface TemplateEntry {
  component: ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  displayName?: string
  previewData?: Record<string, any>
  /** Fixed recipient — overrides caller-provided recipientEmail when set. */
  to?: string
}

/**
 * Template registry — maps template names to their React Email components.
 * Import and register new templates here after creating them in this directory.
 *
 * Example:
 *   import { template as welcomeTemplate } from './welcome'
 *   // then add to TEMPLATES: 'welcome': welcomeTemplate
 */
export const TEMPLATES: Record<string, TemplateEntry> = {
  'kyc-status': kycStatusTemplate,
  'admin-password-reset': adminPasswordResetTemplate,
  'withdrawal-status': withdrawalStatusTemplate,
}

