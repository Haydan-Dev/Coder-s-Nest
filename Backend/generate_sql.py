import re

data = """
active_collaborators.frm: PRIMARY InnoDB active_collaborator_id project_id workspace_id file_id user_id collaboration_session_id cursor_line cursor_column is_editing joined_at last_active_at
activity_logs.frm: PRIMARY InnoDB activity_log_id user_id project_id workspace_id action entity_type entity_id metadata id_address created_at metadatajson_valid metadata
admin_audit_logs.frm: PRIMARY InnoDB audit_log_id admin_user_id action target_type target_id previous_value new_value reason ip_address user_agent created_at previous_valuejson_valid previous_value new_valuejson_valid new_value
admin_login.frm: PRIMARY InnoDB admin_id admin_name admin_email admin_pass created_date
ai_conversations.frm: PRIMARY InnoDB ai_conversation_id user_id project_id title created_at updated_at
ai_requests.frm: PRIMARY InnoDB ai_request_id ai_conversation_id user_id prompt response model_name tokens_used latency_ms created_at
ai_usage_logs.frm: PRIMARY InnoDB ai_usage_log_id user_id ai_request_id project_id toekns_used model_name cost_estimate requset_type status created_at Success Failed
billing_system.frm: auto_renew start_date end_date payment_status created_at updated_at Free Pro Team Enterprise Active Inactive Cancelled Past_Due Monthly Yearly Paid Unpaid Failed Refunded
collaboration_sessions.frm: PRIMARY InnoDB collaboration_session_id project_id workspace_id file_id user_id session_status joined_at last_activity_at ended_at disconnected_reason Active Paused Current Disconnected
conversations.frm: PRIMARY InnoDB conversation_id project_id created_by_user_id conversation_name conversation_type description is_private is_archived created_at updated_at Project Team Private System
conversation_members.frm: PRIMARY InnoDB conversation_member_id conversation_id user_id member_role joined_at left_at is_active Admin Member Leader Owner
feedback.frm: PRIMARY InnoDB user_id type title description votes rating status created_at bug suggestion survey poll open under_review planned completed rejected
files.frm: PRIMARY InnoDB file_id workspace_id folder_id file_name file_extension mime_type file_content file_size created_by_user_id last_edited_by_user_id is_deleted created_at updated_at
file_versions.frm: PRIMARY InnoDB file_version file_id version_number file_content changes_summary creted_by_user_id created_at
folders.frm: PRIMARY InnoDB folder_id workspace_id parent_folder_id folder_name created_by_user_id created_at updated_at
messages.frm: conversation_id sender_id reply_to_message_id message_type content attachment_url attachment_type is_pinned is_forwarded is_edited is_deleted created_at updated_at Text Code File Image System Audio Video
message_reads.frm: PRIMARY InnoDB message_read_id message_id user_id read_at
notifications.frm: PRIMARY InnoDB notifications_id user_id type title message reference_id is_read created_at
notification_preferences.frm: PRIMARY InnoDB preference_id user_id email_enable push_enable in_app_enable project_invites messages ai_updates updated_at
oauth_accounts.frm: F7T PRIMARY InnoDB oauth_account_id user_id provider_name provider_user_id created_at updated_at
otp_verifications.frm: PRIMARY InnoDB otp_verification_id otp_code_hash otp_type target_type verification_target is_used expires_at created_at attempts signup login forgot_password two_factor change_email change_phone email phone_number
projects.frm: PRIMARY InnoDB project_id project_name project_description project_visibility project_avatar_url is_private created_at updated_at is_archived Private Public
project_invitations.frm: project_id invite_user_id invited_by_user_id invitation_role invitation_type invitation_status expires_at created_at responded_at Owner Leader Member Guest Project_Invite Ownership_Transfer Pending Accepted Rejected Cancelled Expired
project_members.frm: PRIMARY InnoDB project_member_id project_id user_id project_role managed_by_user_id invited_by_user_id is_active joined_at Owner Leader Member Guest
security_logs.frm: PRIMARY InnoDB security_log_id user_id event_type ip_address user_agent location status metadata created_at Success Failed Blocked metadatajson_valid metadata
users.frm: full_name email phone_number password_hash profile_pic_url bio platform_role is_email_verified is_phone_verified two_factor_enabled last_seen_at last_login_at is_deleted deleted_at created_at updated_at Member Guest Project_Owner Project_leader
user_sessions.frm: InnoDB session_id user_id refresh_token_hash device_type device_name device_os browser_name ip_address fcm_token is_active last_active_at expires_at created_at updated_at location revoked_at Mobile Desktop Web
workspaces.frm: PRIMARY InnoDB workspace_id project_id workspace_name workspace_description created_by_user_id is_default created_at updated_at
"""

sql = "-- Database: `coders_nest`\nCREATE DATABASE IF NOT EXISTS `coders_nest`;\nUSE `coders_nest`;\n\n"

for line in data.strip().split("\n"):
    parts = line.split(": ")
    if len(parts) != 2:
        continue
    table_file = parts[0]
    table_name = table_file.replace(".frm", "")
    columns_raw = parts[1].split(" ")
    
    # filter out words that are likely not column names (e.g. PRIMARY, InnoDB, Enums)
    ignore = ["PRIMARY", "InnoDB", "F7T", "metadatajson_valid", "previous_valuejson_valid", "new_valuejson_valid"]
    columns = []
    enums = []
    
    for word in columns_raw:
        if not word or word in ignore:
            continue
        # If it starts with uppercase, it's probably an enum value from the .frm string table
        if word[0].isupper() and word.lower() != word:
            enums.append(word)
        elif word.lower() in ["bug", "suggestion", "survey", "poll", "open", "under_review", "planned", "completed", "rejected"]:
            enums.append(word) # feedback enums
        elif word.lower() in ["signup", "login", "forgot_password", "two_factor", "change_email", "change_phone", "email", "phone_number"]:
            if word not in columns: # skip if it's actually a column
                enums.append(word)
        else:
            if word not in columns:
                columns.append(word)
            
    sql += f"DROP TABLE IF EXISTS `{table_name}`;\n"
    sql += f"CREATE TABLE `{table_name}` (\n"
    
    col_defs = []
    for i, col in enumerate(columns):
        if i == 0 and ("id" in col.lower() or "version" in col.lower()):
            col_defs.append(f"  `{col}` INT AUTO_INCREMENT PRIMARY KEY")
        elif "id" in col.lower() and not col.startswith("is_"):
            col_defs.append(f"  `{col}` INT")
        elif "created_at" in col or "updated_at" in col or "joined_at" in col or "last_active_at" in col:
            col_defs.append(f"  `{col}` DATETIME DEFAULT CURRENT_TIMESTAMP")
        elif "is_" in col or "enable" in col.lower() or "auto_renew" in col:
            col_defs.append(f"  `{col}` BOOLEAN DEFAULT FALSE")
        elif "description" in col or "bio" in col or "content" in col or "metadata" in col:
            col_defs.append(f"  `{col}` TEXT")
        else:
            col_defs.append(f"  `{col}` VARCHAR(255)")
            
    sql += ",\n".join(col_defs)
    sql += "\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;\n\n"

with open(r"d:\learning\Coder's-Nest\coders_nest_full.sql", "w", encoding='utf-8') as f:
    f.write(sql)
