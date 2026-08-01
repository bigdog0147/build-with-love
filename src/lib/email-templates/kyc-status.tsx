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

type Status = 'submitted' | 'under_review' | 'verified' | 'rejected'

interface Props {
  name?: string
  status?: Status
}

const COPY: Record<Status, { heading: string; body: string; next: string }> = {
  submitted: {
    heading: 'Verification submitted',
    body: 'We received your identity documents. Compliance review starts shortly.',
    next: 'No action needed right now — we will email you when the review advances.',
  },
  under_review: {
    heading: 'Verification in review',
    body: 'A compliance officer is reviewing your documents. This usually takes 1–2 business days.',
    next: 'You can follow live progress on your Review status page in the portal.',
  },
  verified: {
    heading: 'Verification approved',
    body: 'Your identity has been verified. All account features are now unlocked.',
    next: 'Sign in to your portal to access transfers, portfolio and card services.',
  },
  rejected: {
    heading: 'Verification needs changes',
    body: 'We could not verify the documents provided. Please re-upload clearer images and resubmit.',
    next: 'Open the verification wizard in your portal to replace the affected documents.',
  },
}

const Email = ({ name, status = 'submitted' }: Props) => {
  const copy = COPY[status] ?? COPY.submitted
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>{copy.heading} — Gigafactory 3X</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={brand}>GIGAFACTORY 3X</Text>
          <Heading style={heading}>{copy.heading}</Heading>
          <Text style={text}>{name ? `Hello ${name},` : 'Hello,'}</Text>
          <Text style={text}>{copy.body}</Text>
          <Section style={panel}>
            <Text style={panelText}>{copy.next}</Text>
          </Section>
          <Hr style={hr} />
          <Text style={footer}>
            Gigafactory 3X — Identity &amp; Compliance. This message relates to your
            account verification and was sent automatically.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: Email,
  subject: (data: Record<string, unknown>) => {
    const status = (data['status'] as Status) ?? 'submitted'
    return `${(COPY[status] ?? COPY.submitted).heading} — Gigafactory 3X`
  },
  displayName: 'KYC status update',
  previewData: { name: 'Alex Morgan', status: 'under_review' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Helvetica, Arial, sans-serif' }
const container = { padding: '32px 28px', maxWidth: '560px' }
const brand = {
  fontSize: '11px',
  letterSpacing: '3px',
  color: '#8a7a4a',
  margin: '0 0 18px',
  fontWeight: 700 as const,
}
const heading = { fontSize: '22px', color: '#111111', margin: '0 0 16px' }
const text = { fontSize: '15px', lineHeight: '24px', color: '#333333', margin: '0 0 14px' }
const panel = {
  backgroundColor: '#f6f4ee',
  borderLeft: '3px solid #c9a227',
  padding: '14px 16px',
  margin: '18px 0',
}
const panelText = { fontSize: '14px', lineHeight: '22px', color: '#4a4438', margin: 0 }
const hr = { borderColor: '#e6e6e6', margin: '24px 0 16px' }
const footer = { fontSize: '12px', lineHeight: '18px', color: '#8a8a8a', margin: 0 }
