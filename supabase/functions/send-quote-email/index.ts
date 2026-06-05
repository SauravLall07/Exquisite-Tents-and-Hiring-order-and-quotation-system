import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ─── tent labels (mirrors quoteCalculator.js) ──────────────────────────────────
const TENT_LABELS: Record<string, string> = {
  frame:    'Frame Tent',
  stretch:  'Stretch Tent',
  peg_pole: 'Peg & Pole Tent',
  bedouin:  'Bedouin / Arabian Tent',
  marquee:  'Marquee',
}

// ─── helpers ───────────────────────────────────────────────────────────────────
const rands  = (n: number) => 'R&nbsp;' + (+(n ?? 0)).toFixed(2)
const fmtD   = (d: string) =>
  d ? new Date(d + 'T00:00:00').toLocaleDateString('en-GB', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
      }) : '—'

// ─── email HTML builder ────────────────────────────────────────────────────────
function buildEmailHtml(order: Record<string, unknown>): string {
  const quote   = (order.quote   as Record<string, number> | null) ?? {}
  const b       = (quote as Record<string, unknown>).breakdown as Record<string, number> | null ?? {}
  const extras  = (order.extras as string[] | null) ?? []

  const tentLabel = TENT_LABELS[order.tent_type as string] ?? String(order.tent_type ?? '—')
  const refNo     = String(order.id ?? '').slice(0, 8).toUpperCase()

  const fmt = (n: number) => rands(n)

  // line items
  interface Item { desc: string; amt: number }
  const items: Item[] = [
    b.base        > 0 && { desc: `${tentLabel} – base hire`,                             amt: b.base },
    b.guestsCost  > 0 && { desc: `Guests (${order.guest_count ?? 0} pax)`,               amt: b.guestsCost },
    b.chairsCost  > 0 && { desc: `Chairs &times; ${order.chairs ?? 0}`,                  amt: b.chairsCost },
    b.tablesCost  > 0 && { desc: `Tables &times; ${order.tables ?? 0}`,                  amt: b.tablesCost },
    b.extrasCost  > 0 && { desc: `Extras (${extras.map(e => e[0].toUpperCase() + e.slice(1)).join(', ')})`, amt: b.extrasCost },
    b.deliveryFee > 0 && { desc: 'Delivery',                                              amt: b.deliveryFee },
    b.siteVisitFee > 0 && { desc: 'Site measurement visit',                               amt: b.siteVisitFee },
  ].filter(Boolean) as Item[]

  const lineItemRows = items.map((item, i) => `
    <tr style="background:${i % 2 === 0 ? '#ffffff' : '#f8fafc'};">
      <td style="padding:10px 16px;font-size:13px;color:#1e293b;border-bottom:1px solid #f1f5f9;">${item.desc}</td>
      <td style="padding:10px 16px;font-size:13px;color:#1e293b;text-align:right;border-bottom:1px solid #f1f5f9;">${fmt(item.amt)}</td>
    </tr>`).join('')

  // payment section
  const pStatus    = String(order.payment_status ?? 'unpaid')
  const depReq     = Number(order.deposit_required ?? 0)
  const depPaid    = !!order.deposit_paid
  const totalAmt   = Number((quote as Record<string, unknown>).total ?? 0)
  const amountPaid = pStatus === 'fully_paid' ? totalAmt : (depPaid ? depReq : 0)
  const balance    = Math.max(0, totalAmt - amountPaid)

  const paymentBlock = depReq > 0 ? `
  <tr><td style="padding:0 40px 24px;">
    <table cellpadding="0" cellspacing="0" style="width:100%;background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;">
      <tr><td style="padding:12px 16px 8px;">
        <span style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#b91c1c;">Payment</span>
      </td></tr>
      <tr>
        <td style="padding:4px 16px;font-size:13px;color:#64748b;">Deposit required</td>
        <td style="padding:4px 16px;font-size:13px;color:#1e293b;text-align:right;">${fmt(depReq)}</td>
      </tr>
      <tr>
        <td style="padding:4px 16px 12px;font-size:13px;font-weight:700;color:#1e293b;border-top:1px solid #e2e8f0;">Balance due</td>
        <td style="padding:4px 16px 12px;font-size:13px;font-weight:700;color:${balance <= 0 ? '#16a34a' : '#b91c1c'};text-align:right;border-top:1px solid #e2e8f0;">${fmt(balance)}</td>
      </tr>
    </table>
  </td></tr>` : ''

  // event date string
  let eventDateStr = fmtD(String(order.event_date ?? ''))
  if(order.event_end_date && order.event_end_date !== order.event_date){
    eventDateStr += ' &ndash; ' + fmtD(String(order.event_end_date))
  }

  const firstName = String(order.name ?? 'there').split(' ')[0]

  // site-visit note
  const siteVisitNote = order.needs_measurement ? `
  <tr><td style="padding:0 40px 24px;">
    <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:6px;padding:12px 16px;">
      <p style="margin:0;font-size:13px;color:#92400e;line-height:1.6;">
        <strong>Site measurement requested</strong> &mdash; A team member will contact you to arrange a visit to your venue.
        The site visit fee will be credited toward your final invoice if you proceed.
      </p>
    </div>
  </td></tr>` : ''

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Your Quote &ndash; Exquisite Tents &amp; Hiring</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 16px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:10px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

  <!-- ── Header ── -->
  <tr>
    <td style="background:#b91c1c;padding:32px 40px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td>
            <div style="font-size:20px;font-weight:700;color:#ffffff;letter-spacing:0.5px;">EXQUISITE TENTS &amp; HIRING</div>
            <div style="font-size:12px;color:#fca5a5;margin-top:5px;letter-spacing:0.3px;">Premium events made easy</div>
          </td>
          <td align="right" style="vertical-align:top;">
            <div style="font-size:11px;color:#fca5a5;text-transform:uppercase;letter-spacing:1px;">Quotation</div>
            <div style="font-size:18px;font-weight:700;color:#ffffff;margin-top:2px;">${refNo}</div>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- ── Greeting ── -->
  <tr>
    <td style="padding:32px 40px 20px;">
      <h2 style="margin:0 0 14px;font-size:20px;color:#1e293b;font-weight:700;">Your quotation is ready</h2>
      <p style="margin:0 0 10px;font-size:15px;color:#334155;">Hi ${firstName},</p>
      <p style="margin:0;font-size:14px;line-height:1.75;color:#64748b;">
        Thank you for your enquiry with Exquisite Tents &amp; Hiring. We've received your booking request and prepared the quotation below.
        Our team will confirm availability and be in touch within 24&nbsp;hours.
      </p>
    </td>
  </tr>

  <!-- ── Summary pills ── -->
  <tr>
    <td style="padding:0 40px 24px;">
      <table cellpadding="0" cellspacing="0" style="width:100%;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;border-collapse:separate;">
        <tr>
          <td style="padding:14px 18px;border-right:1px solid #e2e8f0;width:33%;">
            <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#94a3b8;margin-bottom:5px;">Reference</div>
            <div style="font-size:15px;font-weight:700;color:#1e293b;">${refNo}</div>
          </td>
          <td style="padding:14px 18px;border-right:1px solid #e2e8f0;width:34%;">
            <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#94a3b8;margin-bottom:5px;">Event date</div>
            <div style="font-size:12px;font-weight:700;color:#1e293b;">${eventDateStr}</div>
          </td>
          <td style="padding:14px 18px;width:33%;">
            <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#94a3b8;margin-bottom:5px;">Tent type</div>
            <div style="font-size:13px;font-weight:700;color:#1e293b;">${tentLabel}</div>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- ── Quote table ── -->
  <tr>
    <td style="padding:0 40px 4px;">
      <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#b91c1c;margin-bottom:10px;">Quote Breakdown</div>
      <table cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;border:1px solid #e2e8f0;border-radius:6px;overflow:hidden;">
        <thead>
          <tr style="background:#f8fafc;">
            <th style="padding:10px 16px;text-align:left;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:#94a3b8;border-bottom:1px solid #e2e8f0;">Description</th>
            <th style="padding:10px 16px;text-align:right;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:#94a3b8;border-bottom:1px solid #e2e8f0;">Amount</th>
          </tr>
        </thead>
        <tbody>${lineItemRows}</tbody>
      </table>
    </td>
  </tr>

  <!-- ── Totals ── -->
  <tr>
    <td style="padding:0 40px 24px;">
      <table cellpadding="0" cellspacing="0" style="width:100%;margin-top:2px;">
        <tr>
          <td style="padding:7px 16px;font-size:13px;color:#64748b;text-align:right;">Subtotal</td>
          <td style="padding:7px 16px;font-size:13px;color:#1e293b;text-align:right;width:120px;">${fmt(Number((quote as Record<string,unknown>).subtotal ?? 0))}</td>
        </tr>
        <tr>
          <td style="padding:4px 16px 8px;font-size:13px;color:#64748b;text-align:right;">Tax (VAT)</td>
          <td style="padding:4px 16px 8px;font-size:13px;color:#1e293b;text-align:right;">${fmt(b.tax ?? 0)}</td>
        </tr>
        <tr style="background:#b91c1c;">
          <td style="padding:13px 16px;font-size:15px;font-weight:700;color:#ffffff;text-align:right;">Total due</td>
          <td style="padding:13px 16px;font-size:15px;font-weight:700;color:#ffffff;text-align:right;">${fmt(totalAmt)}</td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- ── Payment block (if deposit set) ── -->
  ${paymentBlock}

  <!-- ── Site visit note ── -->
  ${siteVisitNote}

  <!-- ── Next steps ── -->
  <tr>
    <td style="padding:0 40px 32px;">
      <table cellpadding="0" cellspacing="0" style="width:100%;background:#f8fafc;border-left:3px solid #b91c1c;border-radius:0 6px 6px 0;">
        <tr><td style="padding:16px 20px;">
          <div style="font-size:13px;font-weight:700;color:#1e293b;margin-bottom:8px;">What happens next?</div>
          <ul style="margin:0;padding:0 0 0 18px;font-size:13px;color:#64748b;line-height:1.85;">
            <li>Our team will review your enquiry and confirm availability.</li>
            <li>You&rsquo;ll receive a follow-up message within 24 hours.</li>
            <li>A 50% deposit is required to secure your booking date.</li>
          </ul>
        </td></tr>
      </table>
    </td>
  </tr>

  <!-- ── Footer ── -->
  <tr>
    <td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:20px 40px;text-align:center;">
      <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#1e293b;">Exquisite Tents &amp; Hiring</p>
      <p style="margin:0;font-size:12px;color:#94a3b8;">This quotation is valid for 30 days &bull; Ref: ${refNo}</p>
    </td>
  </tr>

</table>
</td></tr>
</table>
</body>
</html>`
}

// ─── handler ───────────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS })
  }

  try {
    const { orderId } = await req.json()

    if (!orderId) {
      return new Response(JSON.stringify({ error: 'orderId is required' }), {
        status: 400,
        headers: { ...CORS, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const { data: order, error: fetchErr } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single()

    if (fetchErr || !order) {
      return new Response(JSON.stringify({ error: 'Order not found' }), {
        status: 404,
        headers: { ...CORS, 'Content-Type': 'application/json' },
      })
    }

    if (!order.email) {
      // No email address — skip silently
      return new Response(JSON.stringify({ skipped: 'no email on order' }), {
        status: 200,
        headers: { ...CORS, 'Content-Type': 'application/json' },
      })
    }

    const refNo      = String(order.id).slice(0, 8).toUpperCase()
    const senderEmail = Deno.env.get('SENDER_EMAIL') ?? 'noreply@exquisitetents.co.za'
    const apiKey      = Deno.env.get('BREVO_API_KEY')

    if (!apiKey) {
      console.error('BREVO_API_KEY not set')
      return new Response(JSON.stringify({ error: 'Email service not configured' }), {
        status: 500,
        headers: { ...CORS, 'Content-Type': 'application/json' },
      })
    }

    const brevoRes = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify({
        sender: { name: 'Exquisite Tents & Hiring', email: senderEmail },
        to:     [{ email: order.email, name: order.name ?? '' }],
        subject: `Your Quote from Exquisite Tents & Hiring – Ref ${refNo}`,
        htmlContent: buildEmailHtml(order),
      }),
    })

    if (!brevoRes.ok) {
      const detail = await brevoRes.text()
      console.error('Brevo error', brevoRes.status, detail)
      return new Response(JSON.stringify({ error: 'Email send failed', detail }), {
        status: 500,
        headers: { ...CORS, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })

  } catch (err) {
    console.error('Function error', err)
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }
})
