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
  fullName?: string
  email?: string
  roleLabel?: string
  temporaryPassword?: string
  signInUrl?: string
}

const Email = ({
  fullName,
  email,
  roleLabel = 'Administrator',
  temporaryPassword = '',
  signInUrl = 'https://www.gf3x.space/admin/login',
}: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your Gigafactory 3X administrator account</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={brand}>GIGAFACTORY 3X</Text>
        <Heading style={headingStyle}>Administrator access granted</Heading>
        <Text style={text}>{fullName ? `Hello ${fullName},` : 'Hello,'}</Text>
        <Text style={text}>
          An administrator account has been created for you on the Gigafactory 3X administration
          portal with the role <strong>{roleLabel}</strong>. You must change this temporary password
          the first time you sign in.
        </Text>
        <Section style={panel}>
          <Text style={panelText}>Sign-in address: {signInUrl}</Text>
          <Text style={panelText}>Email: {email ?? '—'}</Text>
          <Text style={panelText}>Temporary password: {temporaryPassword}</Text>
        </Section>
        <Text style={text}>
          Never share this password. If you did not expect this message, contact platform security
          immediately.
        </Text>
        <Hr style={hr} />
        <Text style={footer}>Gigafactory 3X — Platform Security. Sent automatically.</Text>
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
const panelText = { fontSize: '13px', lineHeight: '20px', color: '#333333', margin: '0 0 6px' }
const hr = { borderColor: '#e6e3dc', margin: '24px 0' }
const footer = { fontSize: '11px', lineHeight: '18px', color: '#8a8a8a' }

export const template: TemplateEntry = {
  component: Email,
  subject: 'Your Gigafactory 3X administrator account',
  displayName: 'Administrator invitation',
  previewData: {
    fullName: 'Jordan Vale',
    email: 'jordan@gf3x.space',
    roleLabel: 'Compliance Officer',
    temporaryPassword: 'Tmp-9f2K7x!aQ',
  },
}
