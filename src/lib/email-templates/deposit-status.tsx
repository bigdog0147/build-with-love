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
  method?: string
  reference?: string
  reason?: string
  name?: string
}

const Email = ({
  outcome = 'approved',
  amount,
  currency = 'USD',
  method,
  reference,
  reason,
  name,
}: Props) => {
  const approved = outcome === 'approved'
  const heading = approved ? 'Deposit confirmed' : 'Deposit declined'
  const body = approved
    ? 'We have received and confirmed your deposit. The funds are now available in your wallet.'
    : 'We were unable to confirm your deposit. No funds have been credited to your wallet.'
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>{heading} — Gigafactory 3X</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={brand}>GIGAFACTORY 3X</Text>
          <Heading style={headingStyle}>{heading}</Heading>
          <Text style={text}>{name ? `Hello ${name},` : 'Hello,'}</Text>
          <Text style={text}>{body}</Text>
          <Section style={panel}>
            <Text style={panelText}>
              Amount: {amount ?? '—'} {currency}
            </Text>
            {method ? <Text style={panelText}>Method: {method}</Text> : null}
            {reference ? <Text style={panelText}>Reference: {reference}</Text> : null}
            {!approved && reason ? <Text style={panelText}>Reason: {reason}</Text> : null}
            <Text style={panelText}>
              The full history of this deposit is available in the Deposits section of your portal.
            </Text>
          </Section>
          <Hr style={hr} />
          <Text style={footer}>
            Gigafactory 3X — Client Operations. This message relates to a deposit on your account
            and was sent automatically.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

const main = { backgroundColor: '#ffffff', fontFamily: 'Helvetica, Arial, sans-serif' }
const container = { margin: '0 auto', padding: '32px 24px', maxWidth: '560px' }
const brand = { fontSize: '12px', letterSpacing: '3px', color: '#8a7a52', margin: '0 0 12px' }
const headingStyle = { fontSize: '22px', color: '#111111', margin: '0 0 16px' }
const text = { fontSize: '14px', lineHeight: '22px', color: '#333333' }
const panel = {
  backgroundColor: '#f6f5f2',
  borderRadius: '8px',
  padding: '16px',
  margin: '16px 0',
}
const panelText = { fontSize: '13px', lineHeight: '20px', color: '#333333', margin: '0 0 6px' }
const hr = { borderColor: '#e6e3dc', margin: '24px 0' }
const footer = { fontSize: '11px', lineHeight: '18px', color: '#8a8a8a' }

export const template: TemplateEntry = {
  component: Email,
  subject: (data) =>
    data?.outcome === 'rejected'
      ? 'Your Gigafactory 3X deposit was declined'
      : 'Your Gigafactory 3X deposit is confirmed',
  displayName: 'Deposit decision',
  previewData: {
    outcome: 'approved',
    amount: 25000,
    currency: 'USD',
    method: 'Bank transfer',
    reference: 'GF3X-88213',
    name: 'Alex',
  },
}
