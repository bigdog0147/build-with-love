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
  /** Stage label the investor just reached, from the raise timeline. */
  stageLabel?: string
  /** The single next action the investor should take. */
  nextStep?: string
  roundName?: string
  currency?: string
  amount?: number | string
  /** Set when the journey ended without deployment. */
  ended?: 'declined' | 'withdrawn' | 'released' | 'cancelled' | ''
  note?: string
  name?: string
  /** Signed download link for the matching confirmation document. */
  confirmationUrl?: string
  confirmationTitle?: string
}

const ENDED_COPY: Record<string, string> = {
  withdrawn: 'Your indication of interest has been withdrawn and no capital is held.',
  cancelled: 'Your commitment has been cancelled and no capital is held.',
  released: 'The capital held for this round has been returned to your wallet in full.',
  declined: 'Your interest in this round was not progressed at this time.',
}

const Email = ({
  stageLabel = 'Capital raise',
  nextStep,
  roundName = 'Capital raise',
  currency = 'USD',
  amount,
  ended,
  note,
  name,
  confirmationUrl,
  confirmationTitle,
}: Props) => {
  const endedCopy = ended ? ENDED_COPY[ended] : undefined
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>
        {stageLabel} — {roundName}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={brand}>GIGAFACTORY 3X</Text>
          <Heading style={heading_}>{stageLabel}</Heading>
          <Text style={text}>{name ? `Hello ${name},` : 'Hello,'}</Text>
          <Text style={text}>
            {endedCopy ??
              `Your participation in ${roundName} has advanced to a new stage of the capital raising timeline.`}
          </Text>
          <Section style={panel}>
            <Text style={panelText}>Round: {roundName}</Text>
            <Text style={panelText}>Stage: {stageLabel}</Text>
            {amount ? (
              <Text style={panelText}>
                Amount: {amount} {currency}
              </Text>
            ) : null}
            {note ? <Text style={panelText}>Desk note: {note}</Text> : null}
          </Section>
          {nextStep ? (
            <>
              <Text style={stepHead}>What happens next</Text>
              <Text style={step}>{nextStep}</Text>
            </>
          ) : null}
          <ConfirmationDownload url={confirmationUrl} title={confirmationTitle} />
          <Hr style={hr} />
          <Text style={footer}>
            Gigafactory 3X — Capital Markets. This message relates to a capital raise you are
            participating in and was sent automatically.
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
  displayName: 'Raise timeline advance',
  subject: (data) => {
    const round = data['roundName'] ?? 'a capital raise'
    const stage = data['stageLabel'] ?? 'Timeline update'
    return `${stage} — ${round}`
  },
  previewData: {
    stageLabel: 'Desk review',
    nextStep: 'The capital markets desk is reviewing your indication and will confirm capacity.',
    roundName: 'Gigafactory 3X — Series C',
    currency: 'USD',
    amount: 500000,
    name: 'Client',
  },
}

export default Email
