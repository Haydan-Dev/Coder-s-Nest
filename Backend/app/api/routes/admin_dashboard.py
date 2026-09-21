from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database.db import SessionLocal
from app.models.user import User
from app.models.project import Project
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
            }
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
