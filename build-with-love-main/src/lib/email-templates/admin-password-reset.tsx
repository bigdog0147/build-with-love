import React from 'react'
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import type { TemplateEntry } from './registry'

interface Props {
  name?: string
  code?: string
  resetUrl?: string
  expiresMinutes?: number
  ip?: string | null
}

const Email = ({ name, code, resetUrl, expiresMinutes = 30, ip }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Administrator password reset — Gigafactory 3X</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={brand}>GIGAFACTORY 3X</Text>
        <Heading style={heading}>Administrator password reset</Heading>
        <Text style={text}>{name ? `Hello ${name},` : 'Hello,'}</Text>
        <Text style={text}>
          A password reset was requested for your Gigafactory 3X administration console
          account. Open the secure link below and enter the verification code to set a new
          password.
        </Text>

        {resetUrl && (
          <Section style={panel}>
            <Text style={panelText}>
              <Link href={resetUrl} style={link}>
                Open the secure reset page
              </Link>
            </Text>
          </Section>
        )}

        <Section style={codePanel}>
          <Text style={codeLabel}>Verification code</Text>
          <Text style={codeValue}>{code ?? '------'}</Text>
        </Section>

        <Text style={text}>
          This link and code can be used once and expire in {expiresMinutes} minutes. Any
          previous reset links for this account are no longer valid.
        </Text>
        <Text style={text}>
          If you did not request this, no action is needed — your password stays unchanged.
          {ip ? ` Request origin: ${ip}.` : ''} Please notify the Super Administrator if you
          believe this was unexpected.
        </Text>

        <Hr style={hr} />
        <Text style={footer}>
          Gigafactory 3X — Administration Security. This message was sent automatically and
          relates to administrator account access. Never share this code.
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: 'Administrator password reset — Gigafactory 3X',
  displayName: 'Administrator password reset',
  previewData: {
    name: 'System Administrator',
    code: '482913',
    resetUrl: 'https://gf3x.space/admin/reset-password?token=example',
    expiresMinutes: 30,
  },
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
const link = { color: '#8a6d10', fontWeight: 600 as const }
const codePanel = {
  backgroundColor: '#111111',
  padding: '18px 16px',
  margin: '18px 0',
  textAlign: 'center' as const,
}
const codeLabel = {
  fontSize: '10px',
  letterSpacing: '2px',
  color: '#c9a227',
  margin: '0 0 6px',
}
const codeValue = {
  fontSize: '30px',
  letterSpacing: '10px',
  color: '#ffffff',
  margin: 0,
  fontWeight: 700 as const,
}
const hr = { borderColor: '#e6e6e6', margin: '24px 0 16px' }
const footer = { fontSize: '12px', lineHeight: '18px', color: '#8a8a8a', margin: 0 }
