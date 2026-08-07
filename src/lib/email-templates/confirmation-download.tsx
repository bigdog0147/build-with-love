import React from 'react'
import { Button, Section, Text } from '@react-email/components'

/**
 * Download block for the confirmation document that accompanies a capital
 * raising decision email.
 *
 * The sending platform cannot attach files, so the confirmation travels as a
 * signed, time-limited link that returns the identical document as a download.
 * Renders nothing when no link was minted.
 */
export const ConfirmationDownload = ({
  url,
  title,
}: {
  url?: string
  title?: string
}) => {
  if (!url) return null
  return (
    <Section style={wrap}>
      <Text style={label}>Your confirmation document</Text>
      <Text style={copy}>
        {title ?? 'Confirmation'} — a signed record of this decision, ready to download and file.
      </Text>
      <Button href={url} style={button}>
        Download confirmation
      </Button>
      <Text style={fine}>
        This link is personal to you and stays valid for 30 days. You can always download the
        document again from the capital raising portal.
      </Text>
    </Section>
  )
}

const wrap = {
  borderTop: '1px solid #e8e8ea',
  borderBottom: '1px solid #e8e8ea',
  padding: '18px 0',
  margin: '20px 0 4px',
}
const label = { fontSize: '13px', fontWeight: 700, color: '#111214', margin: '0 0 6px' }
const copy = { fontSize: '13px', lineHeight: '20px', color: '#3b3d42', margin: '0 0 14px' }
const button = {
  backgroundColor: '#c8a24a',
  color: '#111214',
  fontSize: '14px',
  fontWeight: 700,
  padding: '12px 22px',
  borderRadius: '8px',
  textDecoration: 'none',
  display: 'inline-block',
}
const fine = { fontSize: '11px', lineHeight: '18px', color: '#8b8d93', margin: '14px 0 0' }

export default ConfirmationDownload
