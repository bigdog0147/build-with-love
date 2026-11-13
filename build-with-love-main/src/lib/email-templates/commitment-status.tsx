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
  outcome?: 'funded' | 'accepted' | 'released' | 'cancelled'
  roundName?: string
  amount?: number | string
  currency?: string
  note?: string
  name?: string
  /** Signed download link for the matching confirmation document. */
  confirmationUrl?: string
  confirmationTitle?: string
}

const COPY: Record<string, { heading: string; body: string; steps: string[] }> = {
  funded: {
    heading: 'Commitment funded',
    body: 'Your commitment has been funded and the amount is now held pending final acceptance by the capital markets desk.',
    steps: [
      'The desk reviews and accepts the commitment, usually within two business days.',
      'On acceptance, the capital is deployed and a holding appears in your portfolio.',
      'If the round does not proceed, the held amount is returned to your wallet in full.',
    ],
  },
  accepted: {
    heading: 'Commitment accepted',
    body: 'Your commitment has been accepted and the capital is now deployed into the round.',
    steps: [
      'Your position is visible in Portfolio with its opening valuation.',
      'Valuations and distributions are posted to the position as the project progresses.',
      'Statements for any period can be generated from Financial reports.',
    ],
  },
  released: {
    heading: 'Commitment released',
    body: 'The amount held for this commitment has been released and returned to your wallet.',
    steps: [
      'The returned amount is available in your wallet immediately.',
      'You can register interest in other open rounds at any time.',
    ],
  },
  cancelled: {
    heading: 'Commitment cancelled',
    body: 'Your commitment was cancelled and no capital is being held.',
    steps: ['You can register interest in this or another round again while it remains open.'],
  },
}

const Email = ({
  outcome = 'accepted',
  roundName = 'Capital raise',
  amount,
  currency = 'USD',
  note,
  name,
  confirmationUrl,
  confirmationTitle,
}: Props) => {
  const copy = COPY[outcome] ?? COPY['accepted']!
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
            <Text style={panelText}>
              Amount: {amount ?? '—'} {currency}
            </Text>
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
            Gigafactory 3X — Capital Markets. This message relates to a commitment on your account
            and was sent automatically.
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
  displayName: 'Commitment decision',
  subject: (data) => {
    const round = data['roundName'] ?? 'your capital commitment'
    switch (data['outcome']) {
      case 'funded':
        return `Commitment funded — ${round}`
      case 'released':
        return `Commitment released — ${round}`
      case 'cancelled':
        return `Commitment cancelled — ${round}`
      default:
        return `Commitment accepted — ${round}`
    }
  },
  previewData: {
    outcome: 'accepted',
    roundName: 'Gigafactory 3X — Series C',
    amount: 500000,
    currency: 'USD',
    name: 'Client',
  },
}

export default Email
