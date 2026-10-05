from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, BigInteger, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database.db import Base

class BillingSystem(Base):
    __tablename__ = "billing_system"

    subscription_id = Column(BigInteger, primary_key=True, index=True, autoincrement=True)
    user_id = Column(BigInteger, ForeignKey("users.user_id"), nullable=False)
    plan_id = Column(Integer, ForeignKey("plans.plan_id"), nullable=False)
    razorpay_customer_id = Column(String(250), nullable=True)
    razorpay_subscription_id = Column(String(250), nullable=True)
    status = Column(String(50), nullable=False)
    billing_cycle = Column(String(50), nullable=False)
    auto_renew = Column(Boolean, nullable=False, default=False)
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=False)
    payment_status = Column(String(50), nullable=False)
    created_at = Column(DateTime, nullable=False)
    updated_at = Column(DateTime, nullable=False)

    user = relationship("User", backref="billing_info")
    plan = relationship("Plan")

    @property
    def plan_name(self):
        return self.plan.name if self.plan else None
