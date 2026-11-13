import * as React from 'react'
import { Section, Text } from '@react-email/components'
import {
  AuthShell,
  codeLabel,
  codePanel,
  codeValue,
  note,
  text,
} from './auth-brand'

interface ReauthenticationEmailProps {
  token: string
}

export const ReauthenticationEmail = ({ token }: ReauthenticationEmailProps) => (
  <AuthShell preview="Your verification code" heading="Confirm your identity">
    <Text style={text}>
      Enter the verification code below to confirm this sensitive action on your account.
    </Text>
    <Section style={codePanel}>
      <Text style={codeLabel}>VERIFICATION CODE</Text>
      <Text style={codeValue}>{token}</Text>
    </Section>
    <Text style={note}>
      This code expires shortly and can be used once. Never share it with anyone.
    </Text>
  </AuthShell>
)

export default ReauthenticationEmail
