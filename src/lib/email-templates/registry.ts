import type { ComponentType } from 'react'
import { template as kycStatusTemplate } from './kyc-status'
import { template as adminPasswordResetTemplate } from './admin-password-reset'
import { template as withdrawalStatusTemplate } from './withdrawal-status'
import { template as depositStatusTemplate } from './deposit-status'
import { template as announcementTemplate } from './announcement'
import { template as adminInviteTemplate } from './admin-invite'
import { template as raiseInvitationTemplate } from './raise-invitation'
import { template as commitmentStatusTemplate } from './commitment-status'
import { template as raiseRoundUpdateTemplate } from './raise-round-update'
import { template as subscriptionStatusTemplate } from './subscription-status'
import { template as documentPublishedTemplate } from './document-published'
import { template as raiseTimelineAdvanceTemplate } from './raise-timeline-advance'





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
  'deposit-status': depositStatusTemplate,
  'announcement': announcementTemplate,
  'admin-invite': adminInviteTemplate,
  'raise-invitation': raiseInvitationTemplate,
  'commitment-status': commitmentStatusTemplate,
  'raise-round-update': raiseRoundUpdateTemplate,
  'subscription-status': subscriptionStatusTemplate,
  'document-published': documentPublishedTemplate,
  'raise-timeline-advance': raiseTimelineAdvanceTemplate,
}

