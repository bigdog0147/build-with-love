import * as React from 'react'
import { Button, Text } from '@react-email/components'
import { AuthShell, button, note, text } from './auth-brand'

interface RecoveryEmailProps {
  siteName: string
  confirmationUrl: string
}

export const RecoveryEmail = ({
  siteName,
  confirmationUrl,
}: RecoveryEmailProps) => (
  <AuthShell preview={`Reset your password for ${siteName}`} heading="Reset your password">
    <Text style={text}>
      We received a request to reset the password for your {siteName} account. Choose a new
      password using the secure link below.
    </Text>
    <Button style={button} href={confirmationUrl}>
      Reset password
    </Button>
    <Text style={note}>
      If you didn't request a password reset, no action is needed — your password stays
      unchanged.
    </Text>
  </AuthShell>
)

export default RecoveryEmail
