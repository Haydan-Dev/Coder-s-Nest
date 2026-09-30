from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from app.database.deps import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.plan import PlanResponse, PlanCreate, PlanUpdate
from app.services.plan_service import PlanService

router = APIRouter(
    prefix="/plans",
    tags=["Plans"]
)

# PUBLIC / USER ROUTES
@router.get("/", response_model=List[PlanResponse])
def get_active_plans(db: Session = Depends(get_db)):
    # Users can only see active plans
    return PlanService.get_plans(db, active_only=True)

# ADMIN ROUTES
@router.get("/all", response_model=List[PlanResponse])
def get_all_plans(db: Session = Depends(get_db)):
    return PlanService.get_plans(db, active_only=False)

@router.post("/", response_model=PlanResponse)
def create_plan(data: PlanCreate, db: Session = Depends(get_db)):
    return PlanService.create_plan(data, db)

@router.put("/{plan_id}", response_model=PlanResponse)
def update_plan(plan_id: int, data: PlanUpdate, db: Session = Depends(get_db)):
    return PlanService.update_plan(plan_id, data, db)

@router.delete("/{plan_id}")
def delete_plan(plan_id: int, db: Session = Depends(get_db)):
    return PlanService.delete_plan(plan_id, db)
