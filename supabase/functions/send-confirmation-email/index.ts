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
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif; 
      line-height: 1.6; 
      color: #333; 
      max-width: 600px; 
      margin: 0 auto; 
      padding: 0; 
      background-color: #f8fafc;
    }
    .email-container {
      background-color: #ffffff;
      margin: 20px;
      border-radius: 12px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }
    .header { 
      background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); 
      color: white; 
      padding: 30px 20px; 
      text-align: center; 
    }
    .logo-section {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      margin-bottom: 10px;
    }
    .logo {
      width: 40px;
      height: 40px;
      background-color: white;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
    }
    .brand-name {
      font-size: 28px;
      font-weight: bold;
      margin: 0;
      letter-spacing: 1px;
    }
    .header-subtitle {
      margin: 0;
      opacity: 0.9;
      font-size: 16px;
    }
    .content { 
      padding: 40px 30px; 
      background-color: #ffffff;
    }
    .content h2 {
      color: #1e293b;
      margin-bottom: 20px;
      font-size: 24px;
    }
    .button { 
      display: inline-block; 
      background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); 
      color: white; 
      text-decoration: none; 
      padding: 14px 28px; 
      border-radius: 8px; 
      margin: 25px 0; 
      font-weight: 600;
      font-size: 16px;
      box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.3);
      transition: all 0.2s ease;
    }
    .button:hover {
      transform: translateY(-1px);
      box-shadow: 0 6px 12px -1px rgba(37, 99, 235, 0.4);
    }
    .benefits-list {
      background-color: #f1f5f9;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
    }
    .benefits-list li {
      margin: 8px 0;
      color: #334155;
    }
    .url-section {
      background-color: #f8fafc;
      padding: 15px;
      border-radius: 6px;
      border-left: 4px solid #2563eb;
      margin: 20px 0;
    }
    .footer { 
      background-color: #f1f5f9;
      padding: 30px 20px; 
      border-top: 1px solid #e2e8f0; 
      font-size: 14px; 
      color: #64748b; 
      text-align: center;
    }
    .footer-brand {
      font-weight: bold;
      color: #2563eb;
      font-size: 16px;
      margin-bottom: 10px;
    }
    .contact-info {
      margin: 8px 0;
    }
    .disclaimer {
      font-size: 12px;
      margin-top: 20px;
      opacity: 0.8;
      font-style: italic;
    }
    @media only screen and (max-width: 600px) {
      .email-container { margin: 10px; }
      .content { padding: 25px 20px; }
      .header { padding: 25px 15px; }
      .brand-name { font-size: 24px; }
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <div class="logo-section">
        <div class="logo">🚗</div>
        <h1 class="brand-name">KORAUTO</h1>
      </div>
      <p class="header-subtitle">Partneri juaj i besuar për makina cilësore</p>
    </div>
    
    <div class="content">
      <h2>Përshëndetje ${display_name || 'të dashur klient'}!</h2>
      
      <p>Faleminderit që u regjistruat në <strong>KORAUTO</strong>! Ne jemi të kënaqur që ju keni zgjedhur për të gjetur makinën tuaj të ardhshme nga Koreja e Jugut.</p>
      
      <p>Për të aktivizuar llogarinë tuaj dhe për të filluar të shikoni makinat e disponueshme, ju lutemi klikoni butonin më poshtë:</p>
      
      <div style="text-align: center;">
        <a href="${confirmation_url}" class="button">✅ Konfirmoni Llogarinë</a>
      </div>
      
      <div class="url-section">
        <p style="margin: 0; font-size: 14px;"><strong>Ose kopjoni dhe ngjisni këtë lidhje në browser tuaj:</strong></p>
        <p style="word-break: break-all; color: #2563eb; margin: 8px 0 0 0; font-family: monospace;">${confirmation_url}</p>
      </div>
      
      <div class="benefits-list">
        <p style="margin-top: 0; font-weight: 600; color: #1e293b;">Përfitimet e llogarisë suaj:</p>
        <ul style="margin: 0; padding-left: 20px;">
          <li>🔒 Siguria e plotë e të dhënave tuaja</li>
          <li>❤️ Ruani makinat e preferuara</li>
          <li>🔔 Njoftimet për ofertat e reja</li>
          <li>🔍 Shërbime profesionale inspektimi</li>
          <li>📞 Kontakt direkt me ekspertët tanë</li>
        </ul>
      </div>
      
      <p style="color: #64748b; font-size: 14px;">Nëse nuk keni kërkuar këtë llogari, mund ta injoroni këtë email në mënyrë të sigurt.</p>
    </div>
    
    <div class="footer">
      <div class="footer-brand">KORAUTO</div>
      <div class="contact-info">📍 Rr. Ilaz Kodra 70, Prishtinë, Kosovë</div>
      <div class="contact-info">📧 info.rgshpk@gmail.com</div>
      <div class="contact-info">📞 +383 48 181 117</div>
      
      <p class="disclaimer">
        Ky email u dërgua automatikisht nga sistemi ynë i sigurt. Ju lutemi mos iu përgjigjni këtij emaili drejtpërdrejt.
      </p>
    </div>
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
        from: { email: 'info.rgshpk@gmail.com', name: 'KORAUTO' },
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