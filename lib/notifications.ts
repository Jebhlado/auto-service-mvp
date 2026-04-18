type NotificationPayload = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

export async function sendNotification(payload: NotificationPayload) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.NOTIFICATION_FROM_EMAIL;

  if (!apiKey || !from) {
    console.info("Notification skipped. Configure RESEND_API_KEY and NOTIFICATION_FROM_EMAIL.", payload);
    return { sent: false };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from,
      to: [payload.to],
      subject: payload.subject,
      html: payload.html,
      text: payload.text
    })
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("Email notification failed", error);
    return { sent: false, error };
  }

  return { sent: true };
}
