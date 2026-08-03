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
import type { TemplateEntry } from './registry'

interface Props {
  outcome?: 'active' | 'rejected' | 'closed'
  productName?: string
  amount?: number | string
  currency?: string
  note?: string
  name?: string
}

const COPY: Record<string, { heading: string; body: string; steps: string[] }> = {
  active: {
    heading: 'Subscription confirmed',
    body: 'Your subscription has been confirmed and the position is now active.',
    steps: [
      'Your position is visible in Portfolio with its opening valuation.',
      'Valuations and any income distributions are posted to the position over the term.',
      'Statements for any period can be generated from Financial reports.',
    ],
  },
  rejected: {
    heading: 'Subscription declined',
    body: 'Your subscription could not be confirmed and the funds have been returned to your wallet.',
    steps: [
      'The returned amount is available in your wallet immediately.',
      'You can subscribe again or explore other projects in the Marketplace.',
    ],
  },
  closed: {
    heading: 'Holding closed',
    body: 'Your holding has been closed and no further valuations will be posted to it.',
    steps: [
      'Final valuations and distributions remain available in your statements.',
      'Any proceeds are credited to your wallet as they settle.',
    ],
  },
}

const Email = ({
  outcome = 'active',
  productName = 'your subscription',
  amount,
  currency = 'USD',
  note,
  name,
}: Props) => {
  const copy = COPY[outcome] ?? COPY['active']!
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>
        {copy.heading} — {productName}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={brand}>GIGAFACTORY 3X</Text>
          <Heading style={heading_}>{copy.heading}</Heading>
          <Text style={text}>{name ? `Hello ${name},` : 'Hello,'}</Text>
          <Text style={text}>{copy.body}</Text>
          <Section style={panel}>
            <Text style={panelText}>Project: {productName}</Text>
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
          <Hr style={hr} />
          <Text style={footer}>
            Gigafactory 3X — Investment Operations. This message relates to an investment on your
            account and was sent automatically.
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
  displayName: 'Subscription decision',
  subject: (data) => {
    const product = data['productName'] ?? 'your subscription'
    switch (data['outcome']) {
      case 'rejected':
        return `Subscription declined — ${product}`
      case 'closed':
        return `Holding closed — ${product}`
      default:
        return `Subscription confirmed — ${product}`
    }
  },
  previewData: {
    outcome: 'active',
    productName: 'Gigafactory 3X — Battery Cell Line',
    amount: 250000,
    currency: 'USD',
    name: 'Client',
  },
}

export default Email
