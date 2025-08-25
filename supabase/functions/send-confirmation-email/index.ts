import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const handler = async (req: Request): Promise<Response> => {
  console.log('📧 Send Confirmation Email called:', req.method);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, confirmation_url, display_name } = await req.json();

    console.log('📧 Sending confirmation email for:', {
      email,
      display_name,
      confirmation_url: confirmation_url ? 'provided' : 'missing'
    });

    // Email template for confirmation
    const emailSubject = "KORAUTO - Konfirmoni Llogarinë Tuaj";
    const emailBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Konfirmoni Llogarinë Tuaj - KORAUTO</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background-color: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
    .button { display: inline-block; background-color: #2563eb; color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; margin: 20px 0; font-weight: bold; }
    .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 14px; color: #64748b; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🚗 KORAUTO</h1>
    <p>Mirë se vini në KORAUTO!</p>
  </div>
  
  <div class="content">
    <h2>Përshëndetje ${display_name || 'të dashur klient'}!</h2>
    
    <p>Faleminderit që u regjistruat në KORAUTO! Për të aktivizuar llogarinë tuaj, ju lutemi klikoni butonin më poshtë:</p>
    
    <div style="text-align: center;">
      <a href="${confirmation_url}" class="button">Konfirmoni Llogarinë</a>
    </div>
    
    <p>Ose kopjoni dhe ngjisni këtë lidhje në browser tuaj:</p>
    <p style="word-break: break-all; color: #2563eb;">${confirmation_url}</p>
    
    <p><strong>Përse duhet të konfirmoj llogarinë time?</strong></p>
    <ul>
      <li>✅ Siguria e llogarisë suaj</li>
      <li>✅ Qasja në makina të preferuara</li>
      <li>✅ Marrja e njoftimeve për ofertat e reja</li>
      <li>✅ Përdorimi i shërbimeve të inspektimit</li>
    </ul>
    
    <p>Nëse nuk keni kërkuar këtë llogari, mund ta injoroni këtë email.</p>
  </div>
  
  <div class="footer">
    <p><strong>KORAUTO</strong><br>
    Rr. Ilaz Kodra 70, Prishtinë<br>
    Email: INFO.RGSHPK@gmail.com<br>
    Telefon: +383 48 181 117</p>
    
    <p style="font-size: 12px; margin-top: 15px;">
      Ky email u dërgua automatikisht. Ju lutemi mos iu përgjigjni këtij emaili.
    </p>
  </div>
</body>
</html>
    `;

    // For development/demo purposes, we'll log the email content
    // In production, you would integrate with an email service like:
    // - SendGrid
    // - Mailgun
    // - Resend
    // - Amazon SES
    // - Nodemailer with SMTP
    
    console.log('📧 Email template generated successfully');
    console.log('📧 Subject:', emailSubject);
    console.log('📧 To:', email);
    console.log('📧 Confirmation URL:', confirmation_url);

    // Here you would typically send the actual email
    // Example for SendGrid:
    /*
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
        from: { email: 'no-reply@korauto.com', name: 'KORAUTO' },
        content: [{
          type: 'text/html',
          value: emailBody
        }]
      })
    });
    */

    // For now, return success with email details for testing
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Confirmation email prepared successfully',
        email_details: {
          to: email,
          subject: emailSubject,
          confirmation_url,
          display_name
        }
      }),
      {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      }
    );

  } catch (error: any) {
    console.error('❌ Error in send-confirmation-email function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to send confirmation email',
        success: false
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      }
    );
  }
};

serve(handler);