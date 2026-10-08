/**
 * The look of the salon's email: gold on black, Playfair headings, DM Sans
 * body — the site's own scheme carried into the inbox.
 *
 * Email is not the web. Nested tables rather than flexbox or grid, because
 * Outlook renders with Word's engine; every style inline, because Gmail strips
 * <style> on forwarded copies; no web fonts assumed, because most clients
 * ignore them — the stacks fall back to Georgia and Arial, which keep the same
 * serif-display-over-clean-sans contrast the site has.
 *
 * The one thing the design depends on is a dark background behind light text.
 * A client that forces its own light background would leave white text on
 * white, so every surface sets its colour explicitly, on both the table cell
 * (bgcolor, which Outlook honours) and the inline style.
 */

const BLACK = "#000000";
const CARD = "#0f0f0f";
const LINE = "#252525";
const GOLD = "#c8a46a";
const WHITE = "#ffffff";
const MUTED = "#9a9a9a";

const SERIF = "'Playfair Display', Georgia, 'Times New Roman', serif";
const SANS = "'DM Sans', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif";

/** The logo travels with the message, so it shows without the site being up. */
export const LOGO_CID = "crafted-studio-logo";

const ENTITIES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

const esc = (value: string) => value.replace(/[&<>"']/g, (c) => ENTITIES[c]);

export type EmailRow = [label: string, value: string];

export type EmailContent = {
  /** The grey line a client shows after the subject. */
  preheader: string;
  /** Small gold label above the heading. */
  eyebrow: string;
  heading: string;
  intro?: string;
  rows: EmailRow[];
  /** The booking reference, framed. */
  code?: string;
  /** Cancellation policy or similar, in small print under the details. */
  note?: string;
  salon: {
    name: string;
    addressLine1?: string;
    addressLine2?: string;
    phone?: string;
    email?: string;
  };
};

function detailRows(rows: EmailRow[]) {
  return rows
    .map(([label, value], index) => {
      const border = index === 0 ? "" : `border-top:1px solid ${LINE};`;
      return `
        <tr>
          <td style="${border}padding:12px 0;font-family:${SANS};font-size:13px;line-height:20px;color:${MUTED};white-space:nowrap;vertical-align:top;">${esc(label)}</td>
          <td style="${border}padding:12px 0 12px 24px;font-family:${SANS};font-size:15px;line-height:22px;color:${WHITE};text-align:right;vertical-align:top;">${esc(value)}</td>
        </tr>`;
    })
    .join("");
}

function footer(salon: EmailContent["salon"]) {
  const address = [salon.addressLine1, salon.addressLine2].filter(Boolean).join(", ");
  const contact = [salon.phone, salon.email].filter(Boolean).join(" &nbsp;·&nbsp; ");

  return `
    <tr>
      <td bgcolor="${BLACK}" style="background-color:${BLACK};padding:28px 40px 36px;text-align:center;">
        <p style="margin:0 0 6px;font-family:${SERIF};font-size:16px;line-height:24px;color:${GOLD};letter-spacing:0.04em;">${esc(salon.name)}</p>
        ${address ? `<p style="margin:0 0 4px;font-family:${SANS};font-size:13px;line-height:20px;color:${MUTED};">${esc(address)}</p>` : ""}
        ${contact ? `<p style="margin:0;font-family:${SANS};font-size:13px;line-height:20px;color:${MUTED};">${contact}</p>` : ""}
      </td>
    </tr>`;
}

export function renderEmail(content: EmailContent): string {
  const { preheader, eyebrow, heading, intro, rows, code, note, salon } = content;

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<meta name="color-scheme" content="dark">
<meta name="supported-color-schemes" content="dark">
<title>${esc(heading)}</title>
<!--[if mso]>
<style>body,table,td{font-family:Arial,Helvetica,sans-serif !important}</style>
<![endif]-->
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500&family=Playfair+Display:wght@400;500&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background-color:${BLACK};">

<!-- Preview line, shown in the inbox list and nowhere else. -->
<div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;">${esc(preheader)}</div>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${BLACK}" style="background-color:${BLACK};">
  <tr>
    <td align="center" style="padding:32px 16px;">

      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;">

        <!-- logo -->
        <tr>
          <td align="center" style="padding:8px 0 28px;">
            <img src="cid:${LOGO_CID}" width="200" alt="${esc(salon.name)}" style="display:block;width:200px;max-width:60%;height:auto;border:0;outline:none;text-decoration:none;">
          </td>
        </tr>

        <!-- card -->
        <tr>
          <td bgcolor="${CARD}" style="background-color:${CARD};border:1px solid ${LINE};border-radius:10px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">

              <tr>
                <td style="padding:36px 40px 0;">
                  <p style="margin:0 0 10px;font-family:${SANS};font-size:11px;line-height:16px;letter-spacing:0.18em;text-transform:uppercase;color:${GOLD};">${esc(eyebrow)}</p>
                  <h1 style="margin:0;font-family:${SERIF};font-size:28px;line-height:36px;font-weight:400;color:${WHITE};">${esc(heading)}</h1>
                  ${intro ? `<p style="margin:14px 0 0;font-family:${SANS};font-size:15px;line-height:24px;color:${MUTED};">${esc(intro)}</p>` : ""}
                </td>
              </tr>

              ${
                code
                  ? `<tr>
                <td style="padding:26px 40px 0;">
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                    <tr>
                      <td align="center" style="border:1px dashed ${GOLD};border-radius:8px;padding:16px 20px;">
                        <p style="margin:0 0 4px;font-family:${SANS};font-size:11px;line-height:16px;letter-spacing:0.16em;text-transform:uppercase;color:${MUTED};">Reference</p>
                        <p style="margin:0;font-family:${SANS};font-size:22px;line-height:30px;letter-spacing:0.1em;color:${GOLD};">${esc(code)}</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>`
                  : ""
              }

              <tr>
                <td style="padding:12px 40px 0;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                    ${detailRows(rows)}
                  </table>
                </td>
              </tr>

              ${
                note
                  ? `<tr>
                <td style="padding:24px 40px 0;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td style="border-top:1px solid ${LINE};padding-top:20px;">
                        <p style="margin:0;font-family:${SANS};font-size:13px;line-height:21px;color:${MUTED};">${esc(note)}</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>`
                  : ""
              }

              <tr><td style="height:36px;line-height:36px;font-size:0;">&nbsp;</td></tr>
            </table>
          </td>
        </tr>

        ${footer(salon)}
      </table>

    </td>
  </tr>
</table>
</body>
</html>`;
}

/** The same message as plain text, for clients that ask for it. */
export function renderText(content: EmailContent): string {
  const { heading, intro, rows, code, note, salon } = content;
  const width = Math.max(...rows.map(([label]) => label.length));

  return [
    heading.toUpperCase(),
    "",
    intro ?? "",
    code ? `\nReference: ${code}` : "",
    "",
    ...rows.map(([label, value]) => `${label.padEnd(width)}  ${value}`),
    note ? `\n${note}` : "",
    "",
    "—",
    salon.name,
    [salon.addressLine1, salon.addressLine2].filter(Boolean).join(", "),
    [salon.phone, salon.email].filter(Boolean).join(" · "),
  ]
    .filter((line) => line !== "")
    .join("\n");
}
