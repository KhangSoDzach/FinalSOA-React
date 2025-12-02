"""
APScheduler Configuration
Tự động tạo hóa đơn hàng tháng vào ngày 25
"""
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from datetime import date
import calendar
import logging
from sqlmodel import Session
from app.core.database import engine
from app.services.bill_service import generate_monthly_bills_for_all

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create scheduler instance
scheduler = AsyncIOScheduler()


def monthly_bill_generation_job():
    """
    Job chạy vào ngày 25 hàng tháng
    Tạo hóa đơn cho tháng tiếp theo
    """
    try:
        logger.info("=== BẮT ĐẦU TẠO HÓA ĐƠN THÁNG ===")
        
        # Xác định tháng cần tạo hóa đơn (tháng tiếp theo)
        today = date.today()
        
        # Nếu đang ở tháng 12, tạo hóa đơn cho tháng 1 năm sau
        if today.month == 12:
            target_month = 1
            target_year = today.year + 1
        else:
            target_month = today.month + 1
            target_year = today.year
        
        # Lấy ngày cuối tháng làm billing_month
        _, num_days = calendar.monthrange(target_year, target_month)
        billing_month = date(target_year, target_month, num_days)
        
        logger.info(f"Tạo hóa đơn cho tháng {target_month}/{target_year}")
        logger.info(f"Billing month: {billing_month}")
        
        # Tạo session để thao tác database
        with Session(engine) as session:
            stats = generate_monthly_bills_for_all(
                session=session,
                billing_month=billing_month,
                include_parking=True
            )
            
            logger.info("=== KẾT QUẢ TẠO HÓA ĐƠN ===")
            logger.info(f"✅ Tổng số căn hộ: {stats['total_apartments']}")
            logger.info(f"✅ Số hóa đơn phí quản lý: {stats['management_bills_created']}")
            logger.info(f"✅ Số hóa đơn phí gửi xe: {stats['parking_bills_created']}")
            logger.info(f"✅ Tổng tiền: {stats['total_amount']:,}đ")
            
            if stats['errors']:
                logger.warning(f"⚠️ Có {len(stats['errors'])} lỗi:")
                for error in stats['errors']:
                    logger.warning(f"  - {error}")
        
        logger.info("=== HOÀN THÀNH TẠO HÓA ĐƠN ===")
    
    except Exception as e:
        logger.error(f"❌ LỖI KHI TẠO HÓA ĐƠN: {str(e)}", exc_info=True)


def start_scheduler():
    """
    Khởi động scheduler
    Chạy job vào 00:00 ngày 25 hàng tháng
    """
    # Thêm job: Chạy vào 00:00 ngày 25 hàng tháng
    scheduler.add_job(
        monthly_bill_generation_job,
        trigger=CronTrigger(day=25, hour=0, minute=0),
        id="monthly_bill_generation",
        name="Tạo hóa đơn tháng tự động",
        replace_existing=True
    )
    
    logger.info("✅ Scheduler đã được cấu hình")
    logger.info("📅 Job 'monthly_bill_generation' sẽ chạy vào 00:00 ngày 25 hàng tháng")
    
    # Start scheduler
    scheduler.start()
    logger.info("🚀 Scheduler đã khởi động")


def stop_scheduler():
    """
    Dừng scheduler
    """
    if scheduler.running:
        scheduler.shutdown()
        logger.info("⏹️ Scheduler đã dừng")


def run_job_manually():
    """
    Chạy job thủ công (dùng cho testing)
    """
    logger.info("🔧 Chạy job thủ công...")
    monthly_bill_generation_job()
