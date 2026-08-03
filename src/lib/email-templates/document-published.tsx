import React from 'react'
import {
  Body,
  Button,
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
  description?: string
  category?: string
  productName?: string
  name?: string
  libraryUrl?: string
  documentUrl?: string
  linkDays?: number
  isStatement?: boolean
}

const LABELS: Record<string, string> = {
  prospectus: 'Prospectus',
  factsheet: 'Factsheet',
  term_sheet: 'Term sheet',
  report: 'Financial report',
  statement: 'Statement',
  agreement: 'Agreement',
}

const Email = ({
  title = 'New document available',
  description = '',
  category = 'report',
  productName,
  name,
  libraryUrl = 'https://www.gf3x.space/library',
  documentUrl,
  linkDays = 7,
  isStatement,
}: Props) => {
  const label = LABELS[category] ?? 'Document'
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>{`${label} available: ${title}`}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={brand}>GIGAFACTORY 3X</Text>
          <Heading style={headingStyle}>{label} available</Heading>
          <Text style={text}>{name ? `Hello ${name},` : 'Hello,'}</Text>
          <Text style={text}>
            {isStatement
              ? 'A new statement has been published to your investor document library and is ready to download.'
              : 'A new document has been published to your investor document library.'}
          </Text>
          <Section style={panel}>
            <Text style={panelTitle}>{title}</Text>
            <Text style={panelMeta}>
              {label}
              {productName ? ` · ${productName}` : ''}
            </Text>
            {description ? <Text style={panelText}>{description}</Text> : null}
          </Section>
          <Button href={documentUrl ?? libraryUrl} style={button}>
            {documentUrl ? 'Download document' : 'Open document library'}
          </Button>
          {documentUrl ? (
            <Text style={small}>
              This link was issued to you personally and stops working after {linkDays} days. It is
              checked against your entitlements each time it is opened, so it cannot be shared or
              reused by anyone else. The file itself never travels by email — you can always
              download it from your <a href={libraryUrl} style={link}>document library</a>.
            </Text>
          ) : (
            <Text style={small}>
              Downloads are issued as short-lived private links after you sign in, so this email
              never carries the file itself.
            </Text>
          )}
          <Hr style={hr} />
          <Text style={footer}>
            Gigafactory 3X — Investor Relations. You are receiving this because report and statement
            alerts are enabled in your notification preferences.
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
const panelTitle = { fontSize: '15px', color: '#111111', margin: '0 0 4px', fontWeight: 600 }
const panelMeta = { fontSize: '12px', color: '#8a7a52', margin: '0 0 8px', letterSpacing: '1px' }
const panelText = { fontSize: '14px', lineHeight: '22px', color: '#333333', margin: '0' }
const button = {
  backgroundColor: '#111111',
  color: '#ffffff',
  borderRadius: '8px',
  padding: '12px 20px',
  fontSize: '14px',
  textDecoration: 'none',
  display: 'inline-block',
}
const small = { fontSize: '12px', lineHeight: '20px', color: '#666666', margin: '16px 0 0' }
const link = { color: '#8a7a52' }
const hr = { borderColor: '#e6e3dc', margin: '24px 0' }
const footer = { fontSize: '11px', lineHeight: '18px', color: '#8a8a8a' }

export const template: TemplateEntry = {
  component: Email,
  subject: (data) =>
    `${LABELS[String(data?.category ?? 'report')] ?? 'Document'} available: ${data?.title ?? 'New document'}`,
  displayName: 'Report / statement published',
  previewData: {
    title: 'Q2 2026 Portfolio Report',
    description: 'Quarterly performance, distributions and outlook across your GF3X positions.',
    category: 'report',
    productName: 'Battery Systems Fund I',
    name: 'Alex',
    libraryUrl: 'https://www.gf3x.space/library',
    documentUrl: 'https://www.gf3x.space/api/public/document-access?t=example.token',
    linkDays: 7,
  },
}
