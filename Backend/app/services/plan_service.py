from sqlalchemy.orm import Session
from app.models.plan import Plan
from app.schemas.plan import PlanCreate, PlanUpdate
from fastapi import HTTPException

class PlanService:
    @staticmethod
    def get_plans(db: Session, active_only: bool = False):
        query = db.query(Plan)
        if active_only:
            query = query.filter(Plan.is_active == True)
        return query.order_by(Plan.monthly_price.asc()).all()

    @staticmethod
    def get_plan_by_id(plan_id: int, db: Session):
        plan = db.query(Plan).filter(Plan.plan_id == plan_id).first()
        if not plan:
            raise HTTPException(status_code=404, detail="Plan not found")
        return plan

    @staticmethod
    def create_plan(data: PlanCreate, db: Session):
        existing = db.query(Plan).filter(Plan.name == data.name).first()
        if existing:
            raise HTTPException(status_code=400, detail="Plan name already exists")
            
        plan = Plan(
            name=data.name,
            monthly_price=data.monthly_price,
            yearly_price=data.yearly_price,
            max_projects=data.max_projects,
            ram_limit_mb=data.ram_limit_mb,
            storage_limit_mb=data.storage_limit_mb,
            ai_credits_per_month=data.ai_credits_per_month,
            max_collaborators=data.max_collaborators,
            is_active=data.is_active
        )
        db.add(plan)
        db.commit()
        db.refresh(plan)
        return plan

    @staticmethod
    def update_plan(plan_id: int, data: PlanUpdate, db: Session):
        plan = PlanService.get_plan_by_id(plan_id, db)
        
        if data.name is not None and data.name != plan.name:
            existing = db.query(Plan).filter(Plan.name == data.name).first()
            if existing:
                raise HTTPException(status_code=400, detail="Plan name already exists")
            plan.name = data.name
            
        if data.monthly_price is not None:
            plan.monthly_price = data.monthly_price
        if data.yearly_price is not None:
            plan.yearly_price = data.yearly_price
        if data.max_projects is not None:
            plan.max_projects = data.max_projects
        if data.ram_limit_mb is not None:
            plan.ram_limit_mb = data.ram_limit_mb
        if data.storage_limit_mb is not None:
            plan.storage_limit_mb = data.storage_limit_mb
        if data.ai_credits_per_month is not None:
            plan.ai_credits_per_month = data.ai_credits_per_month
        if data.max_collaborators is not None:
            plan.max_collaborators = data.max_collaborators
        if data.is_active is not None:
            plan.is_active = data.is_active
            
        db.commit()
        db.refresh(plan)
        return plan

    @staticmethod
    def delete_plan(plan_id: int, db: Session):
        plan = PlanService.get_plan_by_id(plan_id, db)
        db.delete(plan)
        db.commit()
        return {"detail": "Plan deleted successfully"}
