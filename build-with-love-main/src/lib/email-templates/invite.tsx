import * as React from 'react'
import { Button, Link, Text } from '@react-email/components'
import { AuthShell, button, link, note, text } from './auth-brand'

interface InviteEmailProps {
  siteName: string
  siteUrl: string
  confirmationUrl: string
}

export const InviteEmail = ({
  siteName,
  siteUrl,
  confirmationUrl,
}: InviteEmailProps) => (
  <AuthShell
    preview={`You've been invited to join ${siteName}`}
    heading="You've been invited"
  >
    <Text style={text}>
      You've been invited to join{' '}
      <Link href={siteUrl} style={link}>
        <strong>{siteName}</strong>
      </Link>
      . Accept the invitation below to create your account and set your credentials.
    </Text>
    <Button style={button} href={confirmationUrl}>
      Accept invitation
    </Button>
    <Text style={note}>
      If you weren't expecting this invitation, you can safely ignore this email.
    </Text>
  </AuthShell>
)

export default InviteEmail
