from fastapi import APIRouter
from app.api.routes import auth, users, bills, cashflow, notifications, tickets, services, apartments

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(bills.router, prefix="/bills", tags=["bills"])
api_router.include_router(cashflow.router, prefix="/cashflow", tags=["cashflow"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["notifications"])
api_router.include_router(tickets.router, prefix="/tickets", tags=["tickets"])
api_router.include_router(services.router, prefix="/services", tags=["services"])
api_router.include_router(apartments.router, prefix="/apartments", tags=["apartments"])