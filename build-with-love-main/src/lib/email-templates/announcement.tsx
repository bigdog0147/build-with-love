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
  title?: string
  detail?: string
  name?: string
}

const Email = ({ title = 'Platform announcement', detail = '', name }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>{title} — Gigafactory 3X</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={brand}>GIGAFACTORY 3X</Text>
        <Heading style={headingStyle}>{title}</Heading>
        <Text style={text}>{name ? `Hello ${name},` : 'Hello,'}</Text>
        <Section style={panel}>
          <Text style={panelText}>{detail}</Text>
        </Section>
        <Hr style={hr} />
        <Text style={footer}>
          Gigafactory 3X — Client Operations. You are receiving this announcement because you hold
          an account on the Gigafactory 3X platform.
        </Text>
      </Container>
    </Body>
  </Html>
)

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
const panelText = {
  fontSize: '14px',
  lineHeight: '22px',
  color: '#333333',
  margin: '0',
  whiteSpace: 'pre-line' as const,
}
const hr = { borderColor: '#e6e3dc', margin: '24px 0' }
const footer = { fontSize: '11px', lineHeight: '18px', color: '#8a8a8a' }

export const template: TemplateEntry = {
  component: Email,
  subject: (data) => `${data?.title ?? 'Announcement'} — Gigafactory 3X`,
  displayName: 'Customer announcement',
  previewData: {
    title: 'Scheduled maintenance this weekend',
    detail:
      'The customer portal will be unavailable on Sunday between 02:00 and 04:00 UTC while we upgrade our settlement infrastructure.',
    name: 'Alex',
  },
}
