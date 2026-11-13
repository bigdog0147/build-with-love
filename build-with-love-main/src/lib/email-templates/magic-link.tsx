import * as React from 'react'
import { Button, Text } from '@react-email/components'
import { AuthShell, button, note, text } from './auth-brand'

interface MagicLinkEmailProps {
  siteName: string
  confirmationUrl: string
}

export const MagicLinkEmail = ({
  siteName,
  confirmationUrl,
}: MagicLinkEmailProps) => (
  <AuthShell preview={`Your secure login link for ${siteName}`} heading="Your secure login link">
    <Text style={text}>
      Use the button below to sign in to {siteName}. For your security, this link works once
      and expires shortly.
    </Text>
    <Button style={button} href={confirmationUrl}>
      Sign in
    </Button>
    <Text style={note}>
      If you didn't request this link, you can safely ignore this email.
    </Text>
  </AuthShell>
)

export default MagicLinkEmail
