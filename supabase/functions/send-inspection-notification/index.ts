import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resendApiKey = Deno.env.get("RESEND_API_KEY");
const resend = resendApiKey ? new Resend(resendApiKey) : null;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InspectionRequest {
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  car_make?: string;
  car_model?: string;
  car_year?: number;
  payment_status: string;
  inspection_fee: number;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestData: InspectionRequest = await req.json();
    
    console.log("Received inspection request:", requestData);
    
    if (!resend) {
      console.log("RESEND_API_KEY not configured, skipping email notifications");
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Request logged but email notifications not configured" 
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }
    
    const carInfo = requestData.car_make && requestData.car_model && requestData.car_year 
      ? `${requestData.car_year} ${requestData.car_make} ${requestData.car_model}` 
      : 'Car details not specified';
    
    const paymentMethod = requestData.payment_status === "processing" ? "Credit Card" : "Cash";

    // Send notification email to business owner
    const ownerEmailResponse = await resend.emails.send({
      from: "KORAUTO Notifications <notifications@resend.dev>",
      to: ["korauto.business@gmail.com"], // Replace with your business email
      subject: "🔔 New Inspection Request - KORAUTO",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">
            🔔 New Inspection Request
          </h1>
          
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="color: #1e40af; margin-top: 0;">Customer Information</h2>
            <p><strong>Name:</strong> ${requestData.customer_name}</p>
            <p><strong>Email:</strong> ${requestData.customer_email}</p>
            <p><strong>Phone/WhatsApp:</strong> ${requestData.customer_phone}</p>
          </div>
          
          <div style="background-color: #ecfdf5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="color: #059669; margin-top: 0;">Vehicle Information</h2>
            <p><strong>Vehicle:</strong> ${carInfo}</p>
            <p><strong>Inspection Fee:</strong> €${requestData.inspection_fee}</p>
            <p><strong>Payment Method:</strong> ${paymentMethod}</p>
            <p><strong>Payment Status:</strong> ${requestData.payment_status}</p>
          </div>
          
          <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #92400e;">
              <strong>Action Required:</strong> Contact the customer within 24 hours to arrange the inspection.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="https://wa.me/${requestData.customer_phone.replace(/[^0-9]/g, '')}" 
               style="background-color: #25d366; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              💬 Contact via WhatsApp
            </a>
          </div>
          
          <p style="text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px;">
            KORAUTO - Professional Car Import Service
          </p>
        </div>
      `,
    });

    // Send confirmation email to customer
    const customerEmailResponse = await resend.emails.send({
      from: "KORAUTO <notifications@resend.dev>",
      to: [requestData.customer_email],
      subject: "Confirmation - Your Inspection Request",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">
            Thank You for Your Inspection Request!
          </h1>
          
          <p>Dear ${requestData.customer_name},</p>
          
          <p>We have received your inspection request and will contact you within 24 hours to arrange the inspection.</p>
          
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="color: #1e40af; margin-top: 0;">Request Details</h2>
            <p><strong>Vehicle:</strong> ${carInfo}</p>
            <p><strong>Inspection Fee:</strong> €${requestData.inspection_fee}</p>
            <p><strong>Payment Method:</strong> ${paymentMethod}</p>
            <p><strong>Contact Phone:</strong> ${requestData.customer_phone}</p>
          </div>
          
          <div style="background-color: #ecfdf5; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #059669;">
              <strong>Next Steps:</strong> Our team will contact you soon to schedule the inspection and provide further details.
            </p>
          </div>
          
          <p style="text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px;">
            Best regards,<br>
            <strong>KORAUTO Team</strong><br>
            Professional Car Import Service
          </p>
        </div>
      `,
    });

    console.log("Owner email sent:", ownerEmailResponse);
    console.log("Customer email sent:", customerEmailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        ownerEmail: ownerEmailResponse,
        customerEmail: customerEmailResponse 
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in send-inspection-notification function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);