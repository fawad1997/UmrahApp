const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const RAPIDAPI_SMS_ENDPOINT = process.env.RAPIDAPI_SMS_ENDPOINT;

export interface SMSRecipient {
  phone: string;
  message: string;
}

export async function sendSMS(recipients: SMSRecipient[]): Promise<void> {
  // If RapidAPI is not configured, just log and return
  if (!RAPIDAPI_KEY || !RAPIDAPI_SMS_ENDPOINT) {
    console.log("SMS service not configured. Skipping SMS sending.");
    return;
  }

  // Send SMS to each recipient (non-blocking)
  // In a real implementation, you might want to batch these or use a queue
  const sendPromises = recipients.map(async (recipient) => {
    try {
      const response = await fetch(RAPIDAPI_SMS_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-RapidAPI-Key": RAPIDAPI_KEY,
          "X-RapidAPI-Host": new URL(RAPIDAPI_SMS_ENDPOINT).hostname,
        },
        body: JSON.stringify({
          to: recipient.phone,
          message: recipient.message,
        }),
      });

      if (!response.ok) {
        console.error(`Failed to send SMS to ${recipient.phone}:`, await response.text());
      } else {
        console.log(`SMS sent successfully to ${recipient.phone}`);
      }
    } catch (error) {
      console.error(`Error sending SMS to ${recipient.phone}:`, error);
      // Don't throw - we don't want SMS failures to block announcements
    }
  });

  // Wait for all SMS sends to complete (but don't block)
  await Promise.allSettled(sendPromises);
}

