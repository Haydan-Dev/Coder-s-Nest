from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from sqlalchemy import func, or_, desc
from app.database.db import SessionLocal
from app.database.deps import get_db
from app.models.user import User, PlatformRole
from app.models.project import Project
from app.models.project_member import ProjectMember
from app.models.activity_log import ActivityLog
import asyncio
import json
from datetime import datetime, timedelta, timezone
from fastapi.concurrency import run_in_threadpool

router = APIRouter()

def fetch_dashboard_stats():
    db = SessionLocal()
    try:
        now = datetime.now(timezone.utc)
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        week_start = today_start - timedelta(days=today_start.weekday())
        five_mins_ago = now - timedelta(minutes=5)

        # Users
        total_users = db.query(User).filter(User.is_deleted == False).count()
        active_users = db.query(User).filter(User.is_deleted == False, User.last_seen_at >= five_mins_ago).count()
        new_users_today = db.query(User).filter(User.is_deleted == False, User.created_at >= today_start).count()

        # Projects
        total_projects = db.query(Project).filter(Project.is_deleted == False).count()
        new_projects_this_week = db.query(Project).filter(Project.is_deleted == False, Project.created_at >= week_start).count()

        # Recent Activity
        recent_logs = db.query(ActivityLog).order_by(ActivityLog.created_at.desc()).limit(5).all()
        
        activity = []
        for log in recent_logs:
            # Actor (who performed the action)
            actor = db.query(User).filter(User.user_id == log.user_id).first()
            actor_name = actor.full_name.title() if actor else "Unknown User"
            
            # Project (context)
            project = None
            if log.project_id:
                project = db.query(Project).filter(Project.project_id == log.project_id).first()
            project_name = project.project_name if project else "a project"
            
            # Target User (if action is on a user)
            target_user_name = "a member"
            if log.entity_type == "USER" and log.entity_id:
                try:
                    target_id = int(log.entity_id)
                    target = db.query(User).filter(User.user_id == target_id).first()
                    if target:
                        target_user_name = target.full_name.title()
                except:
                    pass
            
            # Format action nicely
            action_str = (log.action or "").upper()
            if action_str == "REMOVED_MEMBER":
                desc = f"{actor_name} removed {target_user_name} from {project_name}"
            elif action_str == "JOINED_PROJECT":
                desc = f"{actor_name} joined {project_name}"
            elif action_str == "INVITED_MEMBER":
                desc = f"{actor_name} invited {target_user_name} to {project_name}"
            elif action_str == "PROJECT_CREATED":
                desc = f"{actor_name} created project {project_name}"
            elif action_str == "USER_SIGNUP":
                desc = f"{actor_name} registered a new account"
            else:
                formatted_action = action_str.replace("_", " ").lower()
                entity = log.entity_type.lower() if log.entity_type else "system"
                desc = f"{actor_name} {formatted_action} on {entity}"
            
            activity.append({
                "id": log.activity_log_id,
                "type": log.action,
                "description": desc,
                "actorName": actor_name,
                "timestamp": log.created_at.isoformat() if log.created_at else None
            })
            
        if not activity:
            activity = [
                {
                  "id": 1,
                  "type": "system_info",
                  "description": "System monitoring started",
                  "actorName": "System",
                  "timestamp": now.isoformat()
                }
            ]

        # Charts Data
        import calendar
        
        def aggregate_timeframes(items, date_key, current_now):
            # Daily: Last 7 days
            daily_labels = [(current_now - timedelta(days=i)).strftime("%a") for i in range(6, -1, -1)]
            daily_dates = [(current_now - timedelta(days=i)).date() for i in range(6, -1, -1)]
            daily_counts = {d: 0 for d in daily_dates}
            
            # Weekly: Last 4 weeks
            weekly_labels = [f"Week {i}" for i in range(4, 0, -1)]
            weekly_counts = [0] * 4
            
            # Monthly: Last 12 months
            monthly_labels = []
            for i in range(11, -1, -1):
                m = (current_now.month - i - 1) % 12 + 1
                monthly_labels.append(calendar.month_abbr[m])
            monthly_counts = [0] * 12
            
            # Yearly: Last 5 years
            yearly_labels = [str(current_now.year - i) for i in range(4, -1, -1)]
            yearly_counts = [0] * 5
            
            for item in items:
                dt = getattr(item, date_key)
                if not dt:
                    continue
                    
                # Daily
                if dt.date() in daily_counts:
                    daily_counts[dt.date()] += 1
                    
                # Weekly
                days_diff = (current_now.date() - dt.date()).days
                if days_diff < 28 and days_diff >= 0:
                    week_idx = 3 - (days_diff // 7)
                    if 0 <= week_idx < 4:
                        weekly_counts[week_idx] += 1
                        
                # Monthly
                months_diff = (current_now.year - dt.year) * 12 + current_now.month - dt.month
                if months_diff < 12 and months_diff >= 0:
                    month_idx = 11 - months_diff
                    if 0 <= month_idx < 12:
                        monthly_counts[month_idx] += 1
                        
                # Yearly
                years_diff = current_now.year - dt.year
                if years_diff < 5 and years_diff >= 0:
                    year_idx = 4 - years_diff
                    if 0 <= year_idx < 5:
                        yearly_counts[year_idx] += 1
                        
            return {
                "daily": {"labels": daily_labels, "data": [daily_counts[d] for d in daily_dates]},
                "weekly": {"labels": weekly_labels, "data": weekly_counts},
                "monthly": {"labels": monthly_labels, "data": monthly_counts},
                "yearly": {"labels": yearly_labels, "data": yearly_counts}
            }

        all_users = db.query(User).filter(User.is_deleted == False).all()
        user_growth_data = aggregate_timeframes(all_users, "created_at", now)
        
        all_projects = db.query(Project).filter(Project.is_deleted == False).all()
        project_growth_data = aggregate_timeframes(all_projects, "created_at", now)

        def aggregate_user_stats(users_list, current_now):
            current_now_naive = current_now.replace(tzinfo=None)
            timeframes = {
                "daily": timedelta(days=7),
                "weekly": timedelta(days=28),
                "monthly": timedelta(days=365),
                "yearly": timedelta(days=365*5)
            }
            
            five_mins_ago = current_now_naive - timedelta(minutes=5)
            result_roles = {}
            result_status = {}
            
            for tf_name, tf_delta in timeframes.items():
                cutoff = current_now_naive - tf_delta
                
                tf_users = []
                for u in users_list:
                    if u.created_at and u.created_at.replace(tzinfo=None) >= cutoff:
                        tf_users.append(u)
                
                # Roles
                roles_count = {}
                for u in tf_users:
                    role_name = getattr(u.platform_role, 'name', str(u.platform_role)).replace("PlatformRole.", "").replace("_", " ").title()
                    roles_count[role_name] = roles_count.get(role_name, 0) + 1
                    
                if not roles_count:
                    roles_count = {"Member": 0}
                    
                result_roles[tf_name] = {
                    "labels": list(roles_count.keys()),
                    "data": list(roles_count.values())
                }
                
                # Status
                active = sum(1 for u in tf_users if u.last_seen_at and u.last_seen_at.replace(tzinfo=None) >= five_mins_ago)
                inactive = max(0, len(tf_users) - active)
                
                result_status[tf_name] = {
                    "labels": ["Active", "Inactive"],
                    "data": [active, inactive]
                }
                
            return result_roles, result_status

        user_roles_data, user_status_data = aggregate_user_stats(all_users, now)

        charts = {
            "userGrowth": user_growth_data,
            "projectGrowth": project_growth_data,
            "userRoles": user_roles_data,
            "userStatus": user_status_data
        }

        payload = {
            "stats": {
                "totalUsers": total_users,
                "activeUsers": active_users,
                "newUsersToday": new_users_today,
                "newUsersThisWeek": 0,
                "totalProjects": total_projects,
                "newProjectsThisWeek": new_projects_this_week,
                "aiRequestsToday": 0,
                "aiRequestsThisMonth": 0
            },
            "activity": activity,
            "health": {
                "uptimePct": 99.99,
                "apiLatencyMs": 45,
                "errorRatePct": 0.05,
                "dbConnections": 12,
                "cpuUsagePct": 25,
                "memUsagePct": 40
            },
            "charts": charts
        }
        return payload
    except Exception as e:
        print(f"Database error in fetch_dashboard_stats: {e}")
        # Return fallback payload so dashboard doesn't just flash infinitely
        now = datetime.now(timezone.utc)
        return {
            "stats": {
                "totalUsers": 0,
                "activeUsers": 0,
                "newUsersToday": 0,
                "newUsersThisWeek": 0,
                "totalProjects": 0,
                "newProjectsThisWeek": 0,
                "aiRequestsToday": 0,
                "aiRequestsThisMonth": 0
            },
            "activity": [
                {
                  "id": 1,
                  "type": "system_info",
                  "description": "Database connection error (Check backend logs)",
                  "actorName": "System",
                  "timestamp": now.isoformat()
                }
            ],
            "health": {
                "uptimePct": 0,
                "apiLatencyMs": 0,
                "errorRatePct": 100,
                "dbConnections": 0,
                "cpuUsagePct": 0,
                "memUsagePct": 0
            }
        }
    finally:
        db.close()


@router.websocket("/ws/dashboard")
async def admin_dashboard_websocket(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            # Run stats calculation in a separate thread to prevent blocking the async loop
            payload = await run_in_threadpool(fetch_dashboard_stats)
            await websocket.send_text(json.dumps(payload))
            
            # Wait for 5 seconds before pushing new data
            await asyncio.sleep(5)
            
    except WebSocketDisconnect:
        print("Admin Dashboard WebSocket disconnected")
    except Exception as e:
        print(f"Error in Admin Dashboard WebSocket: {e}")

from pydantic import BaseModel

class RoleUpdateRequest(BaseModel):
    role: str

@router.get("/users")
def get_admin_users(
    search: str = None, 
    role: str = None, 
    status: str = None, 
    page: int = 1, 
    limit: int = 15, 
    db: Session = Depends(get_db)
):
    query = db.query(User)
    
    if search:
        query = query.filter(or_(
            User.full_name.ilike(f"%{search}%"),
            User.email.ilike(f"%{search}%")
        ))
        
    if role and role != "all":
        role_map = {
            "user": PlatformRole.MEMBER,
            "leader": PlatformRole.PROJECT_LEADER,
            "admin": PlatformRole.PROJECT_OWNER,
            "super_admin": PlatformRole.PROJECT_OWNER
        }
        db_role = role_map.get(role, PlatformRole.MEMBER)
        query = query.filter(User.platform_role == db_role)
        
    if status and status != "all":
        if status == "active":
            query = query.filter(User.is_deleted == False)
        elif status == "blocked":
            query = query.filter(User.is_deleted == True)
            
    total = query.count()
    users = query.order_by(desc(User.created_at)).offset((page - 1) * limit).limit(limit).all()
    
    data = []
    for u in users:
        db_role = getattr(u.platform_role, 'value', str(u.platform_role))
        if db_role == "Project_Owner":
            ui_role = "admin"
        elif db_role == "Project_leader":
            ui_role = "leader"
        else:
            ui_role = "user"
            
        proj_count = db.query(Project).filter(Project.created_by_user_id == u.user_id).count()
        
        data.append({
            "id": u.user_id,
            "name": u.full_name,
            "email": u.email,
            "role": ui_role,
            "plan": "free",
            "status": "blocked" if u.is_deleted else "active",
            "projectCount": proj_count,
            "lastLoginAt": u.last_login_at.isoformat() if u.last_login_at else None
        })
        
    return {
        "data": data,
        "total": total,
        "page": page,
        "limit": limit
    }

@router.patch("/users/{user_id}/role")
def update_user_role(user_id: int, payload: RoleUpdateRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    role_map = {
        "user": PlatformRole.MEMBER,
        "leader": PlatformRole.PROJECT_LEADER,
        "admin": PlatformRole.PROJECT_OWNER,
        "super_admin": PlatformRole.PROJECT_OWNER
    }
    
    user.platform_role = role_map.get(payload.role, PlatformRole.MEMBER)
    db.commit()
    return {"ok": True}
    
@router.post("/users/{user_id}/block")
def block_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_deleted = True
    db.commit()
    return {"ok": True}
    
@router.post("/users/{user_id}/unblock")
def unblock_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_deleted = False
    db.commit()
    return {"ok": True}
    
@router.get("/projects")
def get_admin_projects(
    search: str = None, 
    status: str = None, 
    page: int = 1, 
    limit: int = 15, 
    db: Session = Depends(get_db)
):
    query = db.query(Project).filter(Project.is_deleted == False)
    
    if search:
        query = query.join(User, Project.created_by_user_id == User.user_id)
        query = query.filter(or_(
            Project.project_name.ilike(f"%{search}%"),
            User.full_name.ilike(f"%{search}%")
        ))
        
    if status and status != "all":
        if status.lower() == "frozen":
            query = query.filter(Project.status == "Frozen")
        elif status.lower() == "active":
            query = query.filter(Project.status != "Frozen")
            
    total = query.count()
    projects = query.order_by(desc(Project.created_at)).offset((page - 1) * limit).limit(limit).all()
    
    data = []
    for p in projects:
        owner = db.query(User).filter(User.user_id == p.created_by_user_id).first()
        member_count = db.query(func.count(ProjectMember.project_id)).filter(ProjectMember.project_id == p.project_id, ProjectMember.is_active == True).scalar()
        
        ui_status = "frozen" if p.status == "Frozen" else "active"
        
        data.append({
            "id": p.project_id,
            "name": p.project_name,
            "ownerName": owner.full_name if owner else "Unknown",
            "ownerEmail": owner.email if owner else "",
            "memberCount": member_count,
            "language": p.language_stack,
            "isPublic": not p.is_private,
            "status": ui_status,
            "lastActivityAt": p.updated_at.isoformat() if p.updated_at else None
        })
        
    return {
        "data": data,
        "total": total,
        "page": page,
        "limit": limit
    }

@router.patch("/projects/{project_id}/toggle-freeze")
def toggle_freeze_project(project_id: int, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.project_id == project_id, Project.is_deleted == False).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    if project.status == "Frozen":
        project.status = "Active"
    else:
        project.status = "Frozen"
        
    db.commit()
    return {"ok": True, "status": "frozen" if project.status == "Frozen" else "active"}

@router.delete("/projects/{project_id}")
def delete_admin_project(project_id: int, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.project_id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    project.is_deleted = True
    db.commit()
    return {"ok": True}
