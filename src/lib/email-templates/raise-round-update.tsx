import React from 'react'
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import { ConfirmationDownload } from './confirmation-download'
import type { TemplateEntry } from './registry'

interface Props {
  outcome?: 'open' | 'closed' | 'funded' | 'draft'
  roundName?: string
  currency?: string
  targetAmount?: number | string
  minimumTicket?: number | string
  closesAt?: string
  note?: string
  name?: string
  /** Signed download link for the matching confirmation document. */
  confirmationUrl?: string
  confirmationTitle?: string
}

const COPY: Record<string, { heading: string; body: string; steps: string[] }> = {
  open: {
    heading: 'Round now open',
    body: 'This capital raise is now open for participation and appears in your capital raising portal.',
    steps: [
      'Review the round narrative and terms in Capital raising.',
      'Register a non-binding indication of the amount you would consider.',
      'The desk reviews indications and issues invitations to commit as capacity allows.',
    ],
  },
  closed: {
    heading: 'Round closed',
    body: 'This capital raise is now closed and no further indications or commitments are being accepted.',
    steps: [
      'Commitments already accepted remain deployed and visible in Portfolio.',
      'Any commitment still held and not accepted is returned to your wallet in full.',
      'Other open rounds remain available in Capital raising.',
    ],
  },
  funded: {
    heading: 'Round fully funded',
    body: 'This capital raise has reached its target and is now fully funded.',
    steps: [
      'Accepted commitments are deployed and tracked in Portfolio.',
      'Valuations and distributions are posted to your position as the project progresses.',
      'Reporting for any period can be generated from Financial reports.',
    ],
  },
  draft: {
    heading: 'Round paused',
    body: 'This capital raise has been moved back to draft while the desk revises its terms.',
    steps: [
      'The round is temporarily hidden from the capital raising portal.',
      'Existing indications are retained and reviewed when the round reopens.',
      'You will be notified as soon as the round is open again.',
    ],
  },
}

const Email = ({
  outcome = 'open',
  roundName = 'Capital raise',
  currency = 'USD',
  targetAmount,
  minimumTicket,
  closesAt,
  note,
  name,
  confirmationUrl,
  confirmationTitle,
}: Props) => {
  const copy = COPY[outcome] ?? COPY['open']!
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>
        {copy.heading} — {roundName}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={brand}>GIGAFACTORY 3X</Text>
          <Heading style={heading_}>{copy.heading}</Heading>
          <Text style={text}>{name ? `Hello ${name},` : 'Hello,'}</Text>
          <Text style={text}>{copy.body}</Text>
          <Section style={panel}>
            <Text style={panelText}>Round: {roundName}</Text>
            {targetAmount ? (
              <Text style={panelText}>
                Target: {targetAmount} {currency}
              </Text>
            ) : null}
            {minimumTicket ? (
              <Text style={panelText}>
                Minimum ticket: {minimumTicket} {currency}
              </Text>
            ) : null}
            {closesAt ? <Text style={panelText}>Closes: {closesAt}</Text> : null}
            {note ? <Text style={panelText}>Desk note: {note}</Text> : null}
          </Section>
          <Text style={stepHead}>What happens next</Text>
          {copy.steps.map((s, i) => (
            <Text key={s} style={step}>
              {i + 1}. {s}
            </Text>
          ))}
          <ConfirmationDownload url={confirmationUrl} title={confirmationTitle} />
          <Hr style={hr} />
          <Text style={footer}>
            Gigafactory 3X — Capital Markets. This message relates to a capital raise you are
            participating in and was sent automatically.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

const main = { backgroundColor: '#ffffff', fontFamily: 'Helvetica, Arial, sans-serif' }
const container = { margin: '0 auto', padding: '32px 24px', maxWidth: '560px' }
const brand = { fontSize: '11px', letterSpacing: '3px', color: '#8a7a4f', margin: '0 0 18px' }
const heading_ = { fontSize: '24px', color: '#111214', margin: '0 0 16px' }
const text = { fontSize: '14px', lineHeight: '22px', color: '#3b3d42', margin: '0 0 12px' }
const panel = {
  backgroundColor: '#faf7f0',
  border: '1px solid #ecdfc0',
  borderRadius: '10px',
  padding: '16px 18px',
  margin: '18px 0',
}
const panelText = { fontSize: '13px', lineHeight: '20px', color: '#4a4437', margin: '0 0 6px' }
const stepHead = { fontSize: '13px', fontWeight: 700, color: '#111214', margin: '14px 0 8px' }
const step = { fontSize: '13px', lineHeight: '20px', color: '#3b3d42', margin: '0 0 6px' }
const hr = { borderColor: '#e8e8ea', margin: '24px 0' }
const footer = { fontSize: '11px', lineHeight: '18px', color: '#8b8d93', margin: 0 }

export const template: TemplateEntry = {
  component: Email,
  displayName: 'Round status update',
  subject: (data) => {
    const round = data['roundName'] ?? 'a capital raise'
    switch (data['outcome']) {
      case 'closed':
        return `Round closed — ${round}`
      case 'funded':
        return `Round fully funded — ${round}`
      case 'draft':
        return `Round paused — ${round}`
      default:
        return `Round now open — ${round}`
    }
  },
  previewData: {
    outcome: 'open',
    roundName: 'Gigafactory 3X — Series C',
    currency: 'USD',
    targetAmount: 250000000,
    minimumTicket: 500000,
    closesAt: '2026-09-30',
    name: 'Client',
  },
}

export default Email
