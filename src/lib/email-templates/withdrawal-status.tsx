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
  outcome?: 'approved' | 'rejected'
  amount?: number | string
  currency?: string
  reason?: string
  name?: string
}

const Email = ({ outcome = 'approved', amount, currency = 'USD', reason, name }: Props) => {
  const approved = outcome === 'approved'
  const heading = approved ? 'Withdrawal approved' : 'Withdrawal declined'
  const body = approved
    ? 'Your withdrawal request has been approved and is now being settled to the destination on file.'
    : 'We were unable to approve your withdrawal request. The held amount has been returned to your wallet.'
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>{heading} — Gigafactory 3X</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={brand}>GIGAFACTORY 3X</Text>
          <Heading style={heading_}>{heading}</Heading>
          <Text style={text}>{name ? `Hello ${name},` : 'Hello,'}</Text>
          <Text style={text}>{body}</Text>
          <Section style={panel}>
            <Text style={panelText}>
              Amount: {amount ?? '—'} {currency}
            </Text>
            {!approved && reason ? <Text style={panelText}>Reason: {reason}</Text> : null}
            <Text style={panelText}>
              You can review the full status of this request in the Withdrawals section of your
              portal.
            </Text>
          </Section>
          <Hr style={hr} />
          <Text style={footer}>
            Gigafactory 3X — Client Operations. This message relates to a withdrawal on your
            account and was sent automatically.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

const main = { backgroundColor: '#ffffff', fontFamily: 'Helvetica, Arial, sans-serif' }
const container = { margin: '0 auto', padding: '32px 24px', maxWidth: '560px' }
const brand = {
  fontSize: '11px',
  letterSpacing: '3px',
  color: '#8a7a4f',
  margin: '0 0 18px',
}
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
const hr = { borderColor: '#e8e8ea', margin: '24px 0' }
const footer = { fontSize: '11px', lineHeight: '18px', color: '#8b8d93', margin: 0 }

export const template: TemplateEntry = {
  component: Email,
  displayName: 'Withdrawal decision',
  subject: (data) =>
    data['outcome'] === 'rejected'
      ? 'Your withdrawal request was declined'
      : 'Your withdrawal request was approved',
  previewData: { outcome: 'approved', amount: 25000, currency: 'USD', name: 'Client' },
}

export default Email
