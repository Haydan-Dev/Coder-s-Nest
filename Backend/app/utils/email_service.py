import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from fastapi import HTTPException
from app.core.config import SMTP_HOST, SMTP_PORT, MAIL_USERNAME, MAIL_PASSWORD, MAIL_FROM

def send_otp_email(to_email: str, otp_code: str):
    # 1. Create the email content
    message = MIMEMultipart()
    message["From"] = MAIL_FROM
    message["To"] = to_email
    message["Subject"] = "Coder's Nest - Email Verification"

    body = f"""
    Hello,

    Thank you for signing up at Coder's Nest! 

    Your 6-digit verification code is: {otp_code}

    This code is valid for 3 minutes. Please do not share this code with anyone.

    Happy coding!
    The Coder's Nest Team
    """
    message.attach(MIMEText(body, "plain"))

    try:
        # 2. Connect to Gmail's SMTP server
        server = smtplib.SMTP(SMTP_HOST, SMTP_PORT)
        server.starttls()  # Secure the connection using TLS
        
        # 3. Log in using your Google App Password
        server.login(MAIL_USERNAME, MAIL_PASSWORD)
        
        # 4. Send the email
        server.sendmail(MAIL_FROM, to_email, message.as_string())
        server.quit()
        
        print(f"Verification email sent to {to_email}")
    except Exception as e:
        print(f"SMTP Error: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to send verification email. Please try again later."
        )
