from sqlalchemy import Column, DateTime, func

class TimestampMixin:
    """
    A mixin to automatically add `created_at` and `updated_at` columns 
    to any SQLAlchemy model. Simply inherit this class in future models.
    """
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)
