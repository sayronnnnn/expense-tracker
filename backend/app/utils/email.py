import httpx
import aiosmtplib
import asyncio
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.config import settings

logger = logging.getLogger(__name__)


async def send_verification_email(email: str, verification_token: str, frontend_url: str = "https://cdexpensetracker.vercel.app") -> bool:
    """Send verification email with token link"""
    
    # Use Brevo if API key is configured
    if settings.BREVO_API_KEY:
        return await send_via_brevo(email, verification_token, frontend_url)
    
    # Fall back to SMTP
    return await send_via_smtp(email, verification_token, frontend_url)


async def send_via_brevo(email: str, verification_token: str, frontend_url: str) -> bool:
    """Send email via Brevo REST API"""
    
    try:
        verification_link = f"{frontend_url}/verify-email?token={verification_token}"
        
        text_content = f"""
Hello,

Thank you for signing up for Expense Tracker! 

Please verify your email by clicking the link below:
{verification_link}

This link will expire in 24 hours.

If you didn't sign up for this account, you can ignore this email.

Best regards,
Expense Tracker Team
        """
        
        html_content = f"""
<html>
  <body style="font-family: Arial, sans-serif; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #2d5f4f;">Verify Your Email</h2>
      <p>Thank you for signing up for <strong>Expense Tracker</strong>!</p>
      <p>Please verify your email by clicking the button below:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="{verification_link}" style="background-color: #2d5f4f; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">
          Verify Email
        </a>
      </div>
      <p style="color: #666; font-size: 12px;">Or copy and paste this link in your browser:</p>
      <p style="color: #666; font-size: 12px; word-break: break-all;">{verification_link}</p>
      <p style="color: #999; font-size: 12px; margin-top: 20px;">This link will expire in 24 hours.</p>
      <p style="color: #999; font-size: 12px;">If you didn't sign up for this account, you can ignore this email.</p>
    </div>
  </body>
</html>
        """
        
        # Brevo API endpoint
        url = "https://api.brevo.com/v3/smtp/email"
        headers = {
            "api-key": settings.BREVO_API_KEY,
            "Content-Type": "application/json"
        }
        
        payload = {
            "sender": {
                "name": settings.BREVO_FROM_NAME,
                "email": settings.BREVO_FROM_EMAIL or settings.SMTP_FROM_EMAIL
            },
            "to": [{"email": email}],
            "subject": "Verify Your Email - Expense Tracker",
            "htmlContent": html_content,
            "textContent": text_content
        }
        
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.post(url, json=payload, headers=headers)
            
            if response.status_code in [200, 201]:
                logger.info(f"Verification email sent to {email} via Brevo")
                return True
            else:
                logger.error(f"Brevo API error ({response.status_code}): {response.text}")
                return False
                
    except Exception as e:
        logger.error(f"Failed to send email via Brevo to {email}: {str(e)}")
        return False


async def send_via_smtp(email: str, verification_token: str, frontend_url: str) -> bool:
    """Send email via SMTP (legacy fallback)"""
    
    # If SMTP not configured, log and return True (mock mode for development)
    if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        logger.warning(f"SMTP not configured. Mock email to {email}: verification_token={verification_token}")
        return True
    
    try:
        # Create verification link
        verification_link = f"{frontend_url}/verify-email?token={verification_token}"
        
        # Create email message
        message = MIMEMultipart("alternative")
        message["Subject"] = "Verify Your Email - Expense Tracker"
        message["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_FROM_EMAIL or settings.SMTP_USER}>"
        message["To"] = email
        
        # Plain text version
        text_content = f"""
Hello,

Thank you for signing up for Expense Tracker! 

Please verify your email by clicking the link below:
{verification_link}

This link will expire in 24 hours.

If you didn't sign up for this account, you can ignore this email.

Best regards,
Expense Tracker Team
        """
        
        # HTML version
        html_content = f"""
<html>
  <body style="font-family: Arial, sans-serif; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #2d5f4f;">Verify Your Email</h2>
      <p>Thank you for signing up for <strong>Expense Tracker</strong>!</p>
      <p>Please verify your email by clicking the button below:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="{verification_link}" style="background-color: #2d5f4f; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">
          Verify Email
        </a>
      </div>
      <p style="color: #666; font-size: 12px;">Or copy and paste this link in your browser:</p>
      <p style="color: #666; font-size: 12px; word-break: break-all;">{verification_link}</p>
      <p style="color: #999; font-size: 12px; margin-top: 20px;">This link will expire in 24 hours.</p>
      <p style="color: #999; font-size: 12px;">If you didn't sign up for this account, you can ignore this email.</p>
    </div>
  </body>
</html>
        """
        
        message.attach(MIMEText(text_content, "plain"))
        message.attach(MIMEText(html_content, "html"))
        
        # Send email with timeout (10 seconds)
        async with aiosmtplib.SMTP(hostname=settings.SMTP_HOST, port=settings.SMTP_PORT, timeout=10) as smtp:
            await smtp.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            await smtp.sendmail(
                settings.SMTP_FROM_EMAIL or settings.SMTP_USER,
                email,
                message.as_string()
            )
        
        logger.info(f"Verification email sent to {email} via SMTP")
        return True
        
    except asyncio.TimeoutError:
        logger.warning(f"SMTP timeout sending email to {email}. Email sending failed but registration succeeded.")
        return False
    except Exception as e:
        logger.error(f"Failed to send verification email to {email} via SMTP: {str(e)}")
        return False

