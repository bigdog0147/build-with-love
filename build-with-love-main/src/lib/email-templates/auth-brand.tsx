import * as React from 'react'
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Text,
} from '@react-email/components'

/**
 * Shared Gigafactory 3X brand shell for authentication emails.
 * Body stays white for inbox compatibility; accents use the graphite/gold identity.
 */
export const AuthShell = ({
  preview,
  heading,
  children,
}: {
  preview: string
  heading: string
  children: React.ReactNode
}) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>{preview}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={brand}>GIGAFACTORY 3X</Text>
        <Heading style={h1}>{heading}</Heading>
        {children}
        <Hr style={hr} />
        <Text style={footer}>
          Gigafactory 3X — Engineering Tomorrow's Intelligent Infrastructure. This message
          was sent automatically and relates to your account access.
        </Text>
      </Container>
    </Body>
  </Html>
)

export const main = {
  backgroundColor: '#ffffff',
  fontFamily: 'Helvetica, Arial, sans-serif',
}
export const container = { padding: '32px 28px', maxWidth: '560px' }
export const brand = {
  fontSize: '11px',
  letterSpacing: '3px',
  color: '#8a7a4a',
  margin: '0 0 18px',
  fontWeight: 700 as const,
}
export const h1 = {
  fontSize: '22px',
  fontWeight: 'bold' as const,
  color: '#111111',
  margin: '0 0 16px',
}
export const text = {
  fontSize: '15px',
  lineHeight: '24px',
  color: '#333333',
  margin: '0 0 14px',
}
export const link = { color: '#8a6d10', textDecoration: 'underline' }
export const button = {
  backgroundColor: '#111111',
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: 600 as const,
  borderRadius: '8px',
  padding: '13px 22px',
  textDecoration: 'none',
  display: 'inline-block',
  margin: '6px 0 10px',
}
export const codePanel = {
  backgroundColor: '#111111',
  padding: '18px 16px',
  margin: '18px 0',
  textAlign: 'center' as const,
}
export const codeLabel = {
  fontSize: '10px',
  letterSpacing: '2px',
  color: '#c9a227',
  margin: '0 0 6px',
}
export const codeValue = {
  fontSize: '30px',
  letterSpacing: '10px',
  color: '#ffffff',
  margin: 0,
  fontWeight: 700 as const,
}
export const hr = { borderColor: '#e6e6e6', margin: '26px 0 16px' }
export const footer = {
  fontSize: '12px',
  lineHeight: '18px',
  color: '#8a8a8a',
  margin: 0,
}
export const note = { fontSize: '12px', color: '#8a8a8a', margin: '8px 0 0' }
