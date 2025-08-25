# Email Confirmation Setup Guide

This document explains how to set up and configure the email confirmation system for KORAUTO.

## Current Implementation

The email confirmation system has been implemented with the following components:

### 1. Supabase Configuration
- Email confirmations are enabled in `supabase/config.toml`
- Custom redirect URL points to `/auth/confirm` for proper handling

### 2. Edge Function for Email Sending
- Located at `supabase/functions/send-confirmation-email/`
- Creates professional HTML email templates
- Currently logs email content for development/testing

### 3. UI Components
- **AuthPage**: Enhanced with email confirmation handling and resend functionality
- **EmailConfirmationPage**: Dedicated page for handling email verification callbacks
- **Route**: `/auth/confirm` handles the confirmation process

## Production Email Service Integration

To integrate with a real email service provider, update the `send-confirmation-email` Edge Function:

### Option 1: SendGrid
```typescript
const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${Deno.env.get('SENDGRID_API_KEY')}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    personalizations: [{
      to: [{ email }],
      subject: emailSubject
    }],
    from: { email: 'info.rgshpk@gmail.com', name: 'KORAUTO' },
    content: [{
      type: 'text/html',
      value: emailBody
    }]
  })
});
```

### Option 2: Resend
```typescript
const response = await fetch('https://api.resend.com/emails', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    from: 'KORAUTO <info.rgshpk@gmail.com>',
    to: [email],
    subject: emailSubject,
    html: emailBody
  })
});
```

### Option 3: Mailgun
```typescript
const formData = new FormData();
formData.append('from', 'KORAUTO <info.rgshpk@gmail.com>');
formData.append('to', email);
formData.append('subject', emailSubject);
formData.append('html', emailBody);

const response = await fetch(`https://api.mailgun.net/v3/${Deno.env.get('MAILGUN_DOMAIN')}/messages`, {
  method: 'POST',
  headers: {
    'Authorization': `Basic ${btoa(`api:${Deno.env.get('MAILGUN_API_KEY')}`)}`,
  },
  body: formData
});
```

## Environment Variables

Add these environment variables to your Supabase project:

- `SENDGRID_API_KEY` (if using SendGrid)
- `RESEND_API_KEY` (if using Resend)
- `MAILGUN_API_KEY` and `MAILGUN_DOMAIN` (if using Mailgun)

## Domain Configuration

### 1. DNS Records
Set up SPF, DKIM, and DMARC records for your domain to ensure email deliverability.

### 2. Email Templates
The current template includes:
- KORAUTO branding
- Albanian language content
- Responsive design
- Clear call-to-action button
- Contact information

## Testing

### Development Testing
The current implementation logs email content to the console, making it easy to test the confirmation flow without sending actual emails.

### Production Testing
1. Test with real email addresses
2. Check spam folders
3. Verify all email clients (Gmail, Outlook, etc.)
4. Test the entire flow: signup → email → confirmation → login

## Security Considerations

1. **Rate Limiting**: Implement rate limiting for signup and resend requests
2. **Token Expiration**: Supabase handles token expiration automatically
3. **HTTPS Only**: Ensure all confirmation URLs use HTTPS
4. **Domain Verification**: Verify sender domain with your email provider

## Monitoring

Monitor the following metrics:
- Email delivery rates
- Confirmation completion rates
- Time to confirmation
- Failed confirmation attempts

## Customization

### Email Template
Edit the `emailBody` variable in `send-confirmation-email/index.ts` to customize:
- Branding and colors
- Content and messaging
- Additional links or information

### Confirmation Page
Edit `EmailConfirmationPage.tsx` to customize:
- Success/error messages
- Redirect behavior
- UI styling

## Troubleshooting

### Common Issues
1. **Emails not being received**: Check spam folders, verify DNS records
2. **Confirmation links not working**: Verify redirect URL configuration
3. **Edge function errors**: Check Supabase function logs

### Debug Mode
Enable debug logging in the Edge function to troubleshoot email sending issues:

```typescript
console.log('📧 Email sending attempt:', {
  provider: 'SendGrid', // or your provider
  to: email,
  status: response.status,
  response: await response.text()
});
```