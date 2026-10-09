"""SMTP email delivery. When SMTP is not configured, mail is logged to the
console instead (development behaviour)."""
import asyncio
import logging
import smtplib
from email.message import EmailMessage

from ..config import settings

log = logging.getLogger("rf.email")


def _send_sync(to: str, subject: str, html: str) -> None:
    msg = EmailMessage()
    msg["From"] = settings.smtp_from
    msg["To"] = to
    msg["Subject"] = subject
    msg.set_content("Your email client does not support HTML. " + subject)
    msg.add_alternative(html, subtype="html")
    if not settings.smtp_host:
        log.info("[SMTP not configured — email NOT sent] To: %s | Subject: %s", to, subject)
        return
    with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=20) as s:
        s.starttls()
        if settings.smtp_user:
            s.login(settings.smtp_user, settings.smtp_password)
        s.send_message(msg)
    log.info("Email sent to %s: %s", to, subject)


async def send_email(to: str, subject: str, html: str) -> None:
    try:
        await asyncio.to_thread(_send_sync, to, subject, html)
    except Exception as e:  # email failure must never break the request
        log.warning("Email delivery failed: %s", e)


def render_email(heading: str, body_html: str, *, cta_text: str | None = None, cta_url: str | None = None, footer_note: str | None = None) -> str:
    """Base branded wrapper every transactional email should render through.
    Light background by design — dark HTML email is unreliable across mail
    clients — with the ResearchFlow primary blue as the sole accent, so all
    notification emails share one consistent, professional look."""
    cta_html = ""
    if cta_text and cta_url:
        cta_html = f"""
        <div style="margin:26px 0 6px">
          <a href="{cta_url}" style="display:inline-block;background:#4F7CFF;color:#ffffff;font-size:14px;font-weight:600;
            text-decoration:none;padding:11px 22px;border-radius:8px">{cta_text}</a>
        </div>"""
    footer_html = f'<p style="color:#94A3C7;font-size:12px;margin-top:22px">{footer_note}</p>' if footer_note else ""
    return f"""
    <div style="font-family:Inter,system-ui,sans-serif;background:#F3F5FB;padding:32px">
      <div style="max-width:520px;margin:auto">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:22px">
          <span style="display:inline-block;width:26px;height:26px;border-radius:7px;background:linear-gradient(135deg,#4F7CFF,#7C5CFF)"></span>
          <span style="font-family:Georgia,serif;font-size:17px;font-weight:600;color:#111A30">Research<span style="color:#4F7CFF">Flow</span></span>
        </div>
        <div style="background:#ffffff;border:1px solid #E3E8F5;border-radius:14px;padding:32px">
          <h1 style="font-size:19px;font-weight:600;color:#111A30;margin:0 0 14px">{heading}</h1>
          <div style="color:#4A5578;font-size:14px;line-height:1.65">{body_html}</div>
          {cta_html}
        </div>
        {footer_html}
        <p style="color:#B0B8D0;font-size:11.5px;margin-top:18px">ResearchFlow — research collaboration platform.</p>
      </div>
    </div>
    """


def meeting_email_html(
    *, name: str, organizer: str, title: str, date_str: str, time_str: str,
    reason: str, participant_names: list[str], view_url: str,
) -> str:
    """The 'New Meeting Scheduled' notification — matches the requested copy:
    greeting, organizer, meeting title/date/time/reason, participant list,
    and a link back into the app."""
    rows = "".join(
        f'<tr><td style="padding:5px 0;color:#8891AC;font-size:12.5px;width:110px;vertical-align:top">{label}</td>'
        f'<td style="padding:5px 0;color:#111A30;font-size:13.5px;font-weight:500">{value}</td></tr>'
        for label, value in [
            ("Meeting", title),
            ("Date", date_str),
            ("Time", time_str),
            ("Reason", reason or "—"),
            ("Participants", ", ".join(participant_names) or "—"),
        ]
    )
    body = f"""
      <p style="margin:0 0 14px">Hello {name},</p>
      <p style="margin:0 0 18px">You have a new meeting scheduled with <strong>{organizer}</strong>.</p>
      <table style="width:100%;border-collapse:collapse;background:#F7F9FD;border-radius:10px;padding:14px" cellpadding="0" cellspacing="0">
        <tbody style="display:table;width:100%;padding:14px">{rows}</tbody>
      </table>
    """
    return render_email(
        "New meeting scheduled",
        body,
        cta_text="View meeting in ResearchFlow",
        cta_url=view_url,
        footer_note="You're receiving this because you're a participant in this meeting.",
    )


def otp_email_html(email: str, code: str) -> str:
    body = f"""
      <p style="margin:0 0 10px">Hi {email.split('@')[0]},</p>
      <p style="margin:0 0 18px">Use this one-time code to sign in to your research workspace.
      It expires in {settings.otp_ttl_minutes} minutes.</p>
      <div style="font-family:'Courier New',monospace;font-size:28px;letter-spacing:9px;background:#F3F5FB;
        border:1px dashed #C7D2F0;border-radius:8px;padding:16px;color:#4F7CFF;text-align:center">{code}</div>
      <p style="color:#94A3C7;font-size:12px;margin-top:16px">If you didn't request this, you can ignore this email — no one else can use the code without it.</p>
    """
    return render_email("Your sign-in code", body)
