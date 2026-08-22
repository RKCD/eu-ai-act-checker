interface Env {
  RESEND_API_KEY: string;
  KONTAKT_EMAIL?: string;
}

const REQUIRED_FIELDS = ['aadress', 'hoone_tyyp', 'teema', 'kontakt'] as const;
const MAX_FIELD_LENGTH = 2000;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return jsonError('Vigane vorm.', 400);
  }

  // Honeypot — bots fill hidden fields, real users never see this input.
  if (String(form.get('kylastuse_pohjus') ?? '').trim() !== '') {
    return jsonOk();
  }

  const fields: Record<string, string> = {};
  for (const key of REQUIRED_FIELDS) {
    const value = String(form.get(key) ?? '').trim();
    if (!value || value.length > MAX_FIELD_LENGTH) {
      return jsonError(`Väli "${key}" on kohustuslik.`, 400);
    }
    fields[key] = value;
  }
  fields.lisainfo = String(form.get('lisainfo') ?? '').trim().slice(0, MAX_FIELD_LENGTH);

  if (!env.RESEND_API_KEY) {
    return jsonError('Vormi teenus ei ole seadistatud.', 500);
  }

  const toEmail = env.KONTAKT_EMAIL || 'info@soojusservis.ee';
  const html = `
    <h2>Uus päring veebilehelt</h2>
    <p><strong>Aadress:</strong> ${escapeHtml(fields.aadress)}</p>
    <p><strong>Hoone tüüp:</strong> ${escapeHtml(fields.hoone_tyyp)}</p>
    <p><strong>Millega alustada:</strong> ${escapeHtml(fields.teema)}</p>
    <p><strong>Kontakt:</strong> ${escapeHtml(fields.kontakt)}</p>
    <p><strong>Lisainfo:</strong><br>${escapeHtml(fields.lisainfo).replace(/\n/g, '<br>')}</p>
  `;

  const resendRes = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Soojusservis veeb <veeb@soojusservis.ee>',
      to: [toEmail],
      reply_to: fields.kontakt.includes('@') ? fields.kontakt : undefined,
      subject: `Uus päring: ${fields.teema} — ${fields.aadress}`,
      html,
    }),
  });

  if (!resendRes.ok) {
    return jsonError('E-kirja saatmine ebaõnnestus.', 502);
  }

  return jsonOk();
};

function jsonOk(): Response {
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

function jsonError(message: string, status: number): Response {
  return new Response(JSON.stringify({ ok: false, error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
