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
  outcome?: 'invited' | 'declined'
  roundName?: string
  amount?: number | string
  currency?: string
  minimumTicket?: number | string
  note?: string
  name?: string
  /** Signed download link for the matching confirmation document. */
  confirmationUrl?: string
  confirmationTitle?: string
}

const Email = ({
  outcome = 'invited',
  roundName = 'Capital raise',
  amount,
  currency = 'USD',
  minimumTicket,
  note,
  name,
  confirmationUrl,
  confirmationTitle,
}: Props) => {
  const invited = outcome === 'invited'
  const heading = invited ? 'Invitation to commit' : 'Interest not progressed'
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>{heading} — {roundName}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={brand}>GIGAFACTORY 3X</Text>
          <Heading style={heading_}>{heading}</Heading>
          <Text style={text}>{name ? `Hello ${name},` : 'Hello,'}</Text>
          <Text style={text}>
            {invited
              ? `The capital markets desk has reviewed your indication of interest in ${roundName} and invited you to commit capital.`
              : `Your indication of interest in ${roundName} was not progressed at this time. You remain eligible for future rounds.`}
          </Text>
          <Section style={panel}>
            <Text style={panelText}>Round: {roundName}</Text>
            <Text style={panelText}>
              Indicated amount: {amount ?? '—'} {currency}
            </Text>
            {invited && minimumTicket ? (
              <Text style={panelText}>
                Minimum ticket: {minimumTicket} {currency}
              </Text>
            ) : null}
            {note ? <Text style={panelText}>Desk note: {note}</Text> : null}
          </Section>
          {invited ? (
            <>
              <Text style={stepHead}>Your next steps</Text>
              <Text style={step}>1. Open Capital raising in your investor portal.</Text>
              <Text style={step}>2. Confirm the amount you wish to commit.</Text>
              <Text style={step}>
                3. Fund the commitment from a {currency} wallet. The amount is held until the desk
                accepts it.
              </Text>
            </>
          ) : (
            <Text style={text}>
              You can review other open rounds at any time in the Capital raising section of your
              portal.
            </Text>
          )}
          <ConfirmationDownload url={confirmationUrl} title={confirmationTitle} />
          <Hr style={hr} />
          <Text style={footer}>
            Gigafactory 3X — Capital Markets. This message relates to a capital raise you registered
            interest in and was sent automatically.
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
  displayName: 'Capital raise invitation',
  subject: (data) =>
    data['outcome'] === 'declined'
      ? `Your interest in ${data['roundName'] ?? 'the round'} was not progressed`
      : `You are invited to commit to ${data['roundName'] ?? 'our capital raise'}`,
  previewData: {
    outcome: 'invited',
    roundName: 'Gigafactory 3X — Series C',
    amount: 500000,
    currency: 'USD',
    minimumTicket: 100000,
    name: 'Client',
  },
}

export default Email
