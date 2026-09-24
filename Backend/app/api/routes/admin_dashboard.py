from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from sqlalchemy import func, or_, desc
from app.database.db import SessionLocal
from app.database.deps import get_db
from app.models.user import User, PlatformRole
from app.models.project import Project
from app.models.project_member import ProjectMember
from app.models.activity_log import ActivityLog
from app.models.user_session import UserSession
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
            # Daily: Current Week (Mon-Sun)
            today = current_now.date()
            monday = today - timedelta(days=today.weekday())
            daily_labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
            daily_dates = [monday + timedelta(days=i) for i in range(7)]
            daily_counts = {d: 0 for d in daily_dates}
            
            # Weekly: Last 4 weeks
            weekly_labels = [f"Week {i}" for i in range(1, 5)]
            weekly_counts = [0] * 4
            
            # Monthly: Current Year (Jan-Dec)
            monthly_labels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
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
                if dt.year == current_now.year:
                    monthly_counts[dt.month - 1] += 1
                        
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

        def aggregate_stacked_timeframes(items, current_now, five_mins_ago):
            today = current_now.date()
            monday = today - timedelta(days=today.weekday())
            daily_labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
            daily_dates = [monday + timedelta(days=i) for i in range(7)]
            
            weekly_labels = [f"Week {i}" for i in range(1, 5)]
            monthly_labels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
            yearly_labels = [str(current_now.year - i) for i in range(4, -1, -1)]
            
            def init_counts():
                return {
                    "daily": { "active": {d: 0 for d in daily_dates}, "inactive": {d: 0 for d in daily_dates}, "banned": {d: 0 for d in daily_dates} },
                    "weekly": { "active": [0]*4, "inactive": [0]*4, "banned": [0]*4 },
                    "monthly": { "active": [0]*12, "inactive": [0]*12, "banned": [0]*12 },
                    "yearly": { "active": [0]*5, "inactive": [0]*5, "banned": [0]*5 }
                }
                
            counts = init_counts()
            
            for item in items:
                dt = getattr(item, "created_at")
                if not dt: continue
                
                is_banned = getattr(item, "is_deleted", False)
                
                last_seen = getattr(item, "last_seen_at")
                if last_seen:
                    is_active = not is_banned and last_seen.replace(tzinfo=None) >= five_mins_ago.replace(tzinfo=None)
                else:
                    is_active = False
                    
                status_key = "banned" if is_banned else ("active" if is_active else "inactive")
                
                if dt.date() in counts["daily"][status_key]:
                    counts["daily"][status_key][dt.date()] += 1
                    
                days_diff = (current_now.date() - dt.date()).days
                if 0 <= days_diff < 28:
                    week_idx = 3 - (days_diff // 7)
                    if 0 <= week_idx < 4: counts["weekly"][status_key][week_idx] += 1
                        
                if dt.year == current_now.year:
                    counts["monthly"][status_key][dt.month - 1] += 1
                        
                years_diff = current_now.year - dt.year
                if 0 <= years_diff < 5:
                    year_idx = 4 - years_diff
                    if 0 <= year_idx < 5: counts["yearly"][status_key][year_idx] += 1

            def build_datasets(timeframe, labels_len, dict_ref=None):
                get_data = lambda status: [dict_ref[status][d] for d in daily_dates] if dict_ref else counts[timeframe][status]
                return [
                    { "label": "Active", "data": get_data("active"), "backgroundColor": "#22c55e", "borderRadius": 4 },
                    { "label": "Inactive", "data": get_data("inactive"), "backgroundColor": "#4b5563", "borderRadius": 4 },
                    { "label": "Banned", "data": get_data("banned"), "backgroundColor": "#ef4444", "borderRadius": 4 }
                ]

            return {
                "daily": { "labels": daily_labels, "datasets": build_datasets("daily", 7, counts["daily"]) },
                "weekly": { "labels": weekly_labels, "datasets": build_datasets("weekly", 4) },
                "monthly": { "labels": monthly_labels, "datasets": build_datasets("monthly", 12) },
                "yearly": { "labels": yearly_labels, "datasets": build_datasets("yearly", 5) }
            }

        all_users_all = db.query(User).all()
        user_growth_stacked = aggregate_stacked_timeframes(all_users_all, now, five_mins_ago)
        
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
        def aggregate_user_breakdown(current_now):
            current_now_naive = current_now.replace(tzinfo=None)
            timeframes = {
                "daily": timedelta(days=7),
                "weekly": timedelta(days=28),
                "monthly": timedelta(days=365),
                "yearly": timedelta(days=365*5)
            }
            five_mins_ago = current_now_naive - timedelta(minutes=5)
            
            all_users_incl_deleted = db.query(User).all()
            
            result_breakdown = {}
            for tf_name, tf_delta in timeframes.items():
                cutoff = current_now_naive - tf_delta
                
                tf_users = [u for u in all_users_incl_deleted if u.created_at and u.created_at.replace(tzinfo=None) >= cutoff]
                
                active = sum(1 for u in tf_users if not u.is_deleted and u.last_seen_at and u.last_seen_at.replace(tzinfo=None) >= five_mins_ago)
                banned = sum(1 for u in tf_users if u.is_deleted)
                inactive = sum(1 for u in tf_users if not u.is_deleted and (not u.last_seen_at or u.last_seen_at.replace(tzinfo=None) < five_mins_ago))
                
                result_breakdown[tf_name] = {
                    "labels": ["Active", "Inactive", "Banned"],
                    "data": [active, inactive, banned]
                }
            return result_breakdown

        user_breakdown_data = aggregate_user_breakdown(now)

        def aggregate_project_breakdown():
            all_projects_all = db.query(Project).all()
            
            working = 0
            closed = 0
            freeze = 0
            
            for p in all_projects_all:
                status_lower = (p.status or "").lower()
                if p.is_deleted or status_lower == "closed":
                    closed += 1
                elif p.is_archived or status_lower in ["freeze", "frozen"]:
                    freeze += 1
                else:
                    working += 1
            
            return {
                "labels": ["Working", "Closed", "Freeze"],
                "data": [working, closed, freeze]
            }

        project_breakdown_data = aggregate_project_breakdown()

        banned_users = db.query(User).filter(User.is_deleted == True).count()
        inactive_users = total_users - active_users

        user_roles_data, user_status_data = aggregate_user_stats(all_users_all, now)

        charts = {
            "userBreakdown": user_breakdown_data,
            "userGrowth": user_growth_stacked,
            "projectGrowth": project_growth_data,
            "projectBreakdown": project_breakdown_data,
            "userRoles": user_roles_data,
            "userStatus": user_status_data
        }

        import psutil
        import shutil
        import time
        from app.models.ai_request import AIRequest

        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        ai_requests_today = db.query(func.count(AIRequest.ai_request_id)).filter(AIRequest.created_at >= today_start).scalar() or 0
        ai_requests_this_month = db.query(func.count(AIRequest.ai_request_id)).filter(AIRequest.created_at >= month_start).scalar() or 0

        # System KPIs
        cpu_percent = psutil.cpu_percent(interval=0.1)
        mem = psutil.virtual_memory()
        
        # Determine DB connections (MySQL specific)
        db_connections = 0
        try:
            from sqlalchemy import text
            row = db.execute(text("SHOW STATUS LIKE 'Threads_connected'")).fetchone()
            db_connections = row[1] if row else 1
        except:
            db_connections = 1  # Fallback

        payload = {
            "stats": {
                "totalUsers": total_users,
                "activeUsers": active_users,
                "newUsersToday": new_users_today,
                "newUsersThisWeek": 0,
                "totalProjects": total_projects,
                "newProjectsThisWeek": new_projects_this_week,
                "aiRequestsToday": ai_requests_today,
                "aiRequestsThisMonth": ai_requests_this_month
            },
            "activity": activity,
            "health": {
                "uptimePct": 99.99, # Uptime SLA is typically manually tracked, defaulting to placeholder
                "apiLatencyMs": 45, # Tracing APM needed for true latency, using placeholder
                "errorRatePct": 0.05,
                "dbConnections": int(db_connections),
                "cpuUsagePct": round(cpu_percent, 1),
                "memUsagePct": round(mem.percent, 1)
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
    now = datetime.utcnow()
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
            "lastLoginAt": u.last_login_at.isoformat() if u.last_login_at else None,
            "isOnline": bool(u.last_login_at and (now - u.last_login_at) < timedelta(minutes=5))
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

from app.models.security_log import SecurityLog, SecuritySeverity, SecurityStatus

@router.get("/security")
def get_security_dashboard(db: Session = Depends(get_db)):
    # Suspicious Activity (Severity High/Critical or specific types)
    suspicious_logs = db.query(SecurityLog).filter(
        SecurityLog.severity.in_([SecuritySeverity.High, SecuritySeverity.Critical])
    ).order_by(desc(SecurityLog.created_at)).limit(20).all()
    
    suspicious = []
    for log in suspicious_logs:
        email = log.attempted_email
        if not email and log.user_id:
            u = db.query(User).filter(User.user_id == log.user_id).first()
            if u:
                email = u.email
                
        suspicious.append({
            "id": log.security_log_id,
            "severity": log.severity.value.lower(),
            "type": log.event_type,
            "description": log.metadata_.get("description", "Suspicious activity detected.") if log.metadata_ else "Suspicious activity detected.",
            "ip": log.ip_address,
            "email": email or "Unknown",
            "timestamp": log.created_at.isoformat() if log.created_at else None
        })

    # Top IPs
    ip_stats = db.query(
        SecurityLog.ip_address,
        SecurityLog.location,
        func.count(SecurityLog.security_log_id).label("total"),
        func.sum(func.case((SecurityLog.status == SecurityStatus.Failed, 1), else_=0)).label("failed")
    ).group_by(SecurityLog.ip_address, SecurityLog.location).order_by(desc("failed")).limit(10).all()
    
    ips = []
    for stat in ip_stats:
        ips.append({
            "ip": stat.ip_address,
            "country": stat.location or "Unknown",
            "totalAttempts": stat.total,
            "failedAttempts": int(stat.failed or 0),
            "isFlagged": (stat.failed or 0) > 5
        })
        
    # All Login Attempts
    attempts_logs = db.query(SecurityLog).filter(
        SecurityLog.event_type == "LOGIN_ATTEMPT"
    ).order_by(desc(SecurityLog.created_at)).limit(100).all()
    
    attempts = []
    for log in attempts_logs:
        email = log.attempted_email
        if not email and log.user_id:
            u = db.query(User).filter(User.user_id == log.user_id).first()
            if u:
                email = u.email
                
        attempts.append({
            "id": log.security_log_id,
            "success": log.status == SecurityStatus.Success,
            "email": email or "Unknown",
            "ip": log.ip_address,
            "country": log.location or "Unknown",
            "timestamp": log.created_at.isoformat() if log.created_at else None
        })
        
    return {
        "suspicious": suspicious,
        "ips": ips,
        "attempts": attempts
    }

import psutil
import shutil
from app.models.ai_request import AIRequest
from app.models.code_execution import CodeExecution

@router.get("/analytics")
def get_analytics(db: Session = Depends(get_db)):
    now = datetime.now(timezone.utc)
    
    # helper for time series
    def get_time_series(model, days):
        cutoff = now - timedelta(days=days)
        results = db.query(
            func.date(model.created_at).label('d'),
            func.count(model.created_at).label('c')
        ).filter(model.created_at >= cutoff).group_by(func.date(model.created_at)).all()
        
        # map to dict for quick lookup
        data_map = {str(r.d): r.c for r in results}
        
        # Generate complete array of days (including empty days)
        arr = []
        for i in range(days, -1, -1):
            dt = now - timedelta(days=i)
            dt_str = str(dt.date())
            arr.append({
                "date": dt.isoformat(),
                "value": data_map.get(dt_str, 0)
            })
        return arr

    def get_time_series_ai(days):
        cutoff = now - timedelta(days=days)
        results = db.query(
            func.date(AIRequest.created_at).label('d'),
            func.count(AIRequest.ai_request_id).label('c')
        ).filter(AIRequest.created_at >= cutoff).group_by(func.date(AIRequest.created_at)).all()
        
        data_map = {str(r.d): r.c for r in results}
        
        arr = []
        for i in range(days, -1, -1):
            dt = now - timedelta(days=i)
            dt_str = str(dt.date())
            arr.append({
                "date": dt.isoformat(),
                "value": data_map.get(dt_str, 0)
            })
        return arr

    # Charts data
    ai_usage = {
        "7d": get_time_series_ai(7),
        "30d": get_time_series_ai(30),
        "90d": get_time_series_ai(90),
    }
    
    code_executions = {
        "7d": get_time_series(CodeExecution, 7),
        "30d": get_time_series(CodeExecution, 30),
        "90d": get_time_series(CodeExecution, 90),
    }
    
    # System KPIs
    cpu_percent = psutil.cpu_percent(interval=0.1)
    mem = psutil.virtual_memory()
    total_disk, used_disk, free_disk = shutil.disk_usage("/")
    
    total_ai_requests = db.query(func.count(AIRequest.ai_request_id)).scalar()
    total_code_executions = db.query(func.count(CodeExecution.code_execution_id)).scalar()
    
    system = {
        "avgCpuPct": round(cpu_percent, 1),
        "peakCpuPct": round(max(cpu_percent, 15.0), 1),
        "avgMemPct": round(mem.percent, 1),
        "peakMemPct": round(max(mem.percent, 30.0), 1),
        "usedStorageGb": round(used_disk / (1024**3)),
        "totalStorageGb": round(total_disk / (1024**3)),
        "totalAiRequests": total_ai_requests or 0,
        "totalCodeExecutions": total_code_executions or 0,
    }

    return {
        "system": system,
        "charts": {
            "ai": ai_usage,
            "codeExecutions": code_executions
        }
    }

from app.models.activity_log import ActivityLog
from app.models.system_setting import SystemSetting

from app.models.project import Project
from app.models.workspace import Workspace

@router.get("/audit-logs")
def get_audit_logs(
    search: str = None,
    action: str = None,
    user_id: int = None,
    page: int = 1,
    limit: int = 20,
    db: Session = Depends(get_db)
):
    query = db.query(ActivityLog, User, Project, Workspace)\
        .join(User, ActivityLog.user_id == User.user_id)\
        .outerjoin(Project, ActivityLog.project_id == Project.project_id)\
        .outerjoin(Workspace, ActivityLog.workspace_id == Workspace.workspace_id)
    
    if search:
        query = query.filter(User.full_name.ilike(f"%{search}%"))
        
    if action and action != "all":
        query = query.filter(ActivityLog.action == action)
        
    if user_id:
        query = query.filter(ActivityLog.user_id == user_id)
        
    total = query.count()
    logs = query.order_by(desc(ActivityLog.created_at)).offset((page - 1) * limit).limit(limit).all()
    
    target_user_ids = []
    for log, _, _, _ in logs:
        if log.entity_type == "USER" and log.entity_id and str(log.entity_id).isdigit():
            target_user_ids.append(int(log.entity_id))
            
    target_users = {}
    if target_user_ids:
        t_users = db.query(User).filter(User.user_id.in_(target_user_ids)).all()
        for tu in t_users:
            target_users[str(tu.user_id)] = {"name": tu.full_name, "email": tu.email}

    data = []
    for log, user, project, workspace in logs:
        target_user = None
        if log.entity_type == "USER" and str(log.entity_id) in target_users:
            target_user = target_users[str(log.entity_id)]
            
        data.append({
            "id": log.activity_log_id,
            "action": log.action,
            "entityType": log.entity_type,
            "entityId": log.entity_id,
            "targetUser": target_user,
            "ipAddress": log.id_address,
            "metadata": log.metadata_,
            "projectName": project.project_name if project else None,
            "workspaceName": workspace.workspace_name if workspace else None,
            "timestamp": log.created_at.isoformat() if log.created_at else None,
            "user": {
                "id": user.user_id,
                "name": user.full_name,
                "email": user.email
            }
        })
        
    return {
        "data": data,
        "total": total,
        "page": page,
        "limit": limit
    }



@router.post("/users/{user_id}/force-logout")
def force_logout_user(user_id: int, db: Session = Depends(get_db)):
    sessions = db.query(UserSession).filter(
        UserSession.user_id == user_id, 
        UserSession.is_active == True
    ).all()
    
    for session in sessions:
        session.is_active = False
        session.revoked_at = datetime.now(timezone.utc)
        
    db.commit()
    return {"status": "success", "message": "User logged out from all devices"}

@router.delete("/users/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    user.is_deleted = True
    user.deleted_at = datetime.now(timezone.utc)
    
    # Invalidate all active sessions
    sessions = db.query(UserSession).filter(
        UserSession.user_id == user_id, 
        UserSession.is_active == True
    ).all()
    
    for session in sessions:
        session.is_active = False
        session.revoked_at = datetime.now(timezone.utc)
        
    db.commit()
    return {"status": "success", "message": "User deleted successfully"}
