from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database.db import Base

class BillingSystem(Base):
    __tablename__ = "billing_system"

    subscription_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=True)
    plan_name = Column(Text, nullable=True)
    razorpay_customer_id = Column(Text, nullable=True)
    razorpay_subscription_id = Column(Text, nullable=True)
    status = Column(Text, nullable=True)
    billing_cycle = Column(Text, nullable=True)
    auto_renew = Column(Text, nullable=True)
    start_date = Column(Text, nullable=True)
    end_date = Column(Text, nullable=True)
    payment_status = Column(Text, nullable=True)
    created_at = Column(Text, nullable=True)
    updated_at = Column(Text, nullable=True)
    
    # Extra columns from the SQL dump
    Free = Column(Text, nullable=True)
    Pro = Column(Text, nullable=True)
    Team = Column(Text, nullable=True)
    Enterprise = Column(Text, nullable=True)
    Active = Column(Text, nullable=True)
    Inactive = Column(Text, nullable=True)
    Cancelled = Column(Text, nullable=True)
    Past_Due = Column(Text, nullable=True)
    Monthly = Column(Text, nullable=True)
    Yearly = Column(Text, nullable=True)
    Paid = Column(Text, nullable=True)
    Unpaid = Column(Text, nullable=True)
    Failed = Column(Text, nullable=True)
    Refunded = Column(Text, nullable=True)

    user = relationship("User", backref="billing_info")
