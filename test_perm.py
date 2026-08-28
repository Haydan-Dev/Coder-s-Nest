import os
import sys

# Add Backend folder to path
sys.path.append(os.path.abspath("d:/learning/Coder's-Nest/Backend"))

from app.database.db import SessionLocal
from app.services.project_service import ProjectService
from app.models.project import Project
from app.models.project_member import ProjectMember

db = SessionLocal()

try:
    project = db.query(Project).first()
    if not project:
        print("No project found.")
        sys.exit(0)
    
    owner = db.query(ProjectMember).filter(ProjectMember.project_id == project.project_id, ProjectMember.project_role == "Owner").first()
    member = db.query(ProjectMember).filter(ProjectMember.project_id == project.project_id, ProjectMember.project_role != "Owner").first()
    
    if not owner or not member:
        print("Need at least one owner and one member.")
        sys.exit(0)
        
    print(f"Testing with Project {project.project_id}, Owner {owner.user_id}, Target {member.user_id}")
    
    data = {
        "can_edit_files": not member.can_edit_files
    }
    
    res = ProjectService.update_member_permissions(project.project_id, member.user_id, data, owner.user_id, db)
    print("Success:", res)
    
except Exception as e:
    print("Error:", e)
    import traceback
    traceback.print_exc()
finally:
    db.close()
