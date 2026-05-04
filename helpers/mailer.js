import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const enviarCorreo = async ({ to, subject, html }) => {
  try {
    const { data, error } = await resend.emails.send({
      from: "Numerología AI <onboarding@resend.dev>",
      to,
      subject,
      html
    });

    if (error) {
      console.error("❌ Resend API error:", error);
      return;
    }

    console.log("✅ Correo enviado via Resend. ID:", data?.id);
  } catch (error) {
    console.error("❌ Error enviando correo con Resend:", error);
  }
};
