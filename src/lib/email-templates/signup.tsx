import * as React from 'react'
import { Button, Link, Text } from '@react-email/components'
import { AuthShell, button, link, note, text } from './auth-brand'

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

export const SignupEmail = ({
  siteName,
  siteUrl,
  recipient,
  confirmationUrl,
}: SignupEmailProps) => (
  <AuthShell
    preview={`Confirm your email for ${siteName}`}
    heading="Confirm your email address"
  >
    <Text style={text}>
      Thanks for creating an account with{' '}
      <Link href={siteUrl} style={link}>
        <strong>{siteName}</strong>
      </Link>
      .
    </Text>
    <Text style={text}>
      Confirm{' '}
      <Link href={`mailto:${recipient}`} style={link}>
        {recipient}
      </Link>{' '}
      to activate secure access to your portal.
    </Text>
    <Button style={button} href={confirmationUrl}>
      Verify email
    </Button>
    <Text style={note}>
      If you didn't create an account, you can safely ignore this email.
    </Text>
  </AuthShell>
)

export default SignupEmail
