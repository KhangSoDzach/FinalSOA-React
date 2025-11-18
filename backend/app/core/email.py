import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import secrets
import string
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query
# Thư viện để tải biến môi trường (Giả định bạn có cài đặt python-dotenv)
# Nếu bạn không sử dụng thư viện này, hãy đảm bảo các biến đã được tải trước đó. 

# --- CONFIGURATION (CẤU HÌNH) ---
# Sử dụng os.getenv để lấy cấu hình từ môi trường/tệp .env
EMAIL_HOST = os.getenv("EMAIL_HOST", "smtp.gmail.com") 
EMAIL_PORT = int(os.getenv("EMAIL_PORT", 587))
EMAIL_USER = os.getenv("EMAIL_USER", "hoangminhvan2710@gmail.com")
EMAIL_PASS = os.getenv("EMAIL_PASS", "pxvt xkqd bhwl qkyc") # App Password (Mật khẩu Ứng dụng)
EMAIL_SENDER_NAME = "SkyHome Apartment Management"

# Kiểm tra nhanh để cảnh báo nếu đang dùng thông tin mặc định
if "example.com" in EMAIL_HOST or EMAIL_USER == "hoangminhvan2710@gmail.com":
    print("⚠️ CẢNH BÁO: Đang sử dụng cấu hình email mặc định hoặc cứng. Vui lòng kiểm tra file .env!")

def generate_otp(length: int = 6) -> str:
    """
    Tạo mã OTP ngẫu nhiên gồm 6 chữ số.
    """
    return "".join(secrets.choice(string.digits) for _ in range(length))

async def send_otp_email_async(to_email: str, otp: str, bill_id: int):
    """
    Gửi mã OTP qua email sử dụng cấu hình SMTP.
    Lưu ý: smtplib là blocking I/O. Trong FastAPI thực tế, hàm này nên được gọi 
    bên trong `run_in_executor` để tránh chặn event loop.
    """
    
    subject = f"Mã OTP Xác minh Thanh toán Hóa đơn #{bill_id}"
    
    html_content = f"""
        <div style="font-family: Arial, sans-serif; padding:20px; border: 1px solid #ddd; border-radius: 8px;">
            <h2 style="color:#4c66f5;">Xác minh Thanh toán SkyHome</h2>
            <p>Xin chào,</p>
            <p>Yêu cầu thanh toán của bạn cho hóa đơn <b>#{bill_id}</b> đã được khởi tạo.</p>
            <p>Mã OTP (One-Time Password) của bạn là:</p>
            <h1 style="letter-spacing:5px; color:#b30000; background-color: #eee; padding: 10px; display: inline-block; border-radius: 4px;">{otp}</h1>
            <p>Mã này có hiệu lực trong <b>5 phút</b>. Vui lòng không chia sẻ mã này với bất kỳ ai.</p>
            <p style="font-size: 12px; color: gray;">Đây là thư tự động, vui lòng không trả lời.</p>
        </div>
    """
    
    msg = MIMEMultipart('alternative')
    msg['From'] = f'"{EMAIL_SENDER_NAME}" <{EMAIL_USER}>'
    msg['To'] = to_email
    msg['Subject'] = subject
    
    msg.attach(MIMEText(html_content, 'html'))
    
    try:
        # B1: Khởi tạo kết nối SMTP (Đây là bước lỗi getaddrinfo failed)
        server = smtplib.SMTP(EMAIL_HOST, EMAIL_PORT)
        server.ehlo()
        # B2: Kích hoạt STARTTLS (Bảo mật)
        server.starttls()
        # B3: Đăng nhập (Sử dụng App Password)
        server.login(EMAIL_USER, EMAIL_PASS)
        # B4: Gửi mail
        server.sendmail(EMAIL_USER, to_email, msg.as_string())
        server.quit()
        print(f"📧 [SMTP] OTP sent successfully to {to_email} for bill {bill_id}")
    except smtplib.SMTPAuthenticationError:
        # Xử lý lỗi xác thực: Sai EMAIL_USER hoặc EMAIL_PASS (chưa dùng App Password)
        error_detail = "Lỗi xác thực SMTP. Vui lòng kiểm tra EMAIL_USER và đảm bảo EMAIL_PASS là Mật khẩu Ứng dụng (App Password) của Gmail."
        print(f"❌ [SMTP] Lỗi xác thực: {error_detail}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=error_detail
        )
    except Exception as e:
        # Xử lý lỗi chung (bao gồm lỗi [Errno 11001] getaddrinfo failed)
        if "getaddrinfo failed" in str(e):
            error_detail = f"Lỗi kết nối máy chủ ({EMAIL_HOST}). Vui lòng kiểm tra lại tên máy chủ và cấu hình DNS/Mạng."
        elif "timed out" in str(e):
             error_detail = f"Kết nối bị hết thời gian chờ. Cổng {EMAIL_PORT} có thể bị Firewall chặn."
        else:
            error_detail = f"Lỗi không xác định khi gửi email: {e}"
            
        print(f"❌ [SMTP] Error sending email to {to_email}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Không thể gửi OTP đến email. Vui lòng kiểm tra cấu hình email server. Lỗi: {error_detail}"
        )