-- Database: `coders_nest`
CREATE DATABASE IF NOT EXISTS `coders_nest`;
USE `coders_nest`;

DROP TABLE IF EXISTS `active_collaborators`;
CREATE TABLE `active_collaborators` (
  `active_collaborator_id` INT AUTO_INCREMENT PRIMARY KEY,
  `project_id` INT,
  `workspace_id` INT,
  `file_id` INT,
  `user_id` INT,
  `collaboration_session_id` INT,
  `cursor_line` VARCHAR(255),
  `cursor_column` VARCHAR(255),
  `is_editing` BOOLEAN DEFAULT FALSE,
  `joined_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `last_active_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

DROP TABLE IF EXISTS `activity_logs`;
CREATE TABLE `activity_logs` (
  `activity_log_id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT,
  `project_id` INT,
  `workspace_id` INT,
  `action` VARCHAR(255),
  `entity_type` VARCHAR(255),
  `entity_id` INT,
  `metadata` TEXT,
  `id_address` INT,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

DROP TABLE IF EXISTS `admin_audit_logs`;
CREATE TABLE `admin_audit_logs` (
  `audit_log_id` INT AUTO_INCREMENT PRIMARY KEY,
  `admin_user_id` INT,
  `action` VARCHAR(255),
  `target_type` VARCHAR(255),
  `target_id` INT,
  `previous_value` VARCHAR(255),
  `new_value` VARCHAR(255),
  `reason` VARCHAR(255),
  `ip_address` VARCHAR(255),
  `user_agent` VARCHAR(255),
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

DROP TABLE IF EXISTS `admin_login`;
CREATE TABLE `admin_login` (
  `admin_id` INT AUTO_INCREMENT PRIMARY KEY,
  `admin_name` VARCHAR(255),
  `admin_email` VARCHAR(255),
  `admin_pass` VARCHAR(255),
  `created_date` VARCHAR(255)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

DROP TABLE IF EXISTS `ai_conversations`;
CREATE TABLE `ai_conversations` (
  `ai_conversation_id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT,
  `project_id` INT,
  `title` VARCHAR(255),
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

DROP TABLE IF EXISTS `ai_requests`;
CREATE TABLE `ai_requests` (
  `ai_request_id` INT AUTO_INCREMENT PRIMARY KEY,
  `ai_conversation_id` INT,
  `user_id` INT,
  `prompt` VARCHAR(255),
  `response` VARCHAR(255),
  `model_name` VARCHAR(255),
  `tokens_used` VARCHAR(255),
  `latency_ms` VARCHAR(255),
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

DROP TABLE IF EXISTS `ai_usage_logs`;
CREATE TABLE `ai_usage_logs` (
  `ai_usage_log_id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT,
  `ai_request_id` INT,
  `project_id` INT,
  `toekns_used` VARCHAR(255),
  `model_name` VARCHAR(255),
  `cost_estimate` VARCHAR(255),
  `requset_type` VARCHAR(255),
  `status` VARCHAR(255),
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

DROP TABLE IF EXISTS `billing_system`;
CREATE TABLE `billing_system` (
  `auto_renew` BOOLEAN DEFAULT FALSE,
  `start_date` VARCHAR(255),
  `end_date` VARCHAR(255),
  `payment_status` VARCHAR(255),
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

DROP TABLE IF EXISTS `collaboration_sessions`;
CREATE TABLE `collaboration_sessions` (
  `collaboration_session_id` INT AUTO_INCREMENT PRIMARY KEY,
  `project_id` INT,
  `workspace_id` INT,
  `file_id` INT,
  `user_id` INT,
  `session_status` VARCHAR(255),
  `joined_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `last_activity_at` VARCHAR(255),
  `ended_at` VARCHAR(255),
  `disconnected_reason` VARCHAR(255)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

DROP TABLE IF EXISTS `conversations`;
CREATE TABLE `conversations` (
  `conversation_id` INT AUTO_INCREMENT PRIMARY KEY,
  `project_id` INT,
  `created_by_user_id` INT,
  `conversation_name` VARCHAR(255),
  `conversation_type` VARCHAR(255),
  `description` TEXT,
  `is_private` BOOLEAN DEFAULT FALSE,
  `is_archived` BOOLEAN DEFAULT FALSE,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

DROP TABLE IF EXISTS `conversation_members`;
CREATE TABLE `conversation_members` (
  `conversation_member_id` INT AUTO_INCREMENT PRIMARY KEY,
  `conversation_id` INT,
  `user_id` INT,
  `member_role` VARCHAR(255),
  `joined_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `left_at` VARCHAR(255),
  `is_active` BOOLEAN DEFAULT FALSE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

DROP TABLE IF EXISTS `feedback`;
CREATE TABLE `feedback` (
  `user_id` INT AUTO_INCREMENT PRIMARY KEY,
  `type` VARCHAR(255),
  `title` VARCHAR(255),
  `description` TEXT,
  `votes` VARCHAR(255),
  `rating` VARCHAR(255),
  `status` VARCHAR(255),
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

DROP TABLE IF EXISTS `files`;
CREATE TABLE `files` (
  `file_id` INT AUTO_INCREMENT PRIMARY KEY,
  `workspace_id` INT,
  `folder_id` INT,
  `file_name` VARCHAR(255),
  `file_extension` VARCHAR(255),
  `mime_type` VARCHAR(255),
  `file_content` TEXT,
  `file_size` VARCHAR(255),
  `created_by_user_id` INT,
  `last_edited_by_user_id` INT,
  `is_deleted` BOOLEAN DEFAULT FALSE,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

DROP TABLE IF EXISTS `file_versions`;
CREATE TABLE `file_versions` (
  `file_version` INT AUTO_INCREMENT PRIMARY KEY,
  `file_id` INT,
  `version_number` VARCHAR(255),
  `file_content` TEXT,
  `changes_summary` VARCHAR(255),
  `creted_by_user_id` INT,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

DROP TABLE IF EXISTS `folders`;
CREATE TABLE `folders` (
  `folder_id` INT AUTO_INCREMENT PRIMARY KEY,
  `workspace_id` INT,
  `parent_folder_id` INT,
  `folder_name` VARCHAR(255),
  `created_by_user_id` INT,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

DROP TABLE IF EXISTS `messages`;
CREATE TABLE `messages` (
  `conversation_id` INT AUTO_INCREMENT PRIMARY KEY,
  `sender_id` INT,
  `reply_to_message_id` INT,
  `message_type` VARCHAR(255),
  `content` TEXT,
  `attachment_url` VARCHAR(255),
  `attachment_type` VARCHAR(255),
  `is_pinned` BOOLEAN DEFAULT FALSE,
  `is_forwarded` BOOLEAN DEFAULT FALSE,
  `is_edited` BOOLEAN DEFAULT FALSE,
  `is_deleted` BOOLEAN DEFAULT FALSE,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

DROP TABLE IF EXISTS `message_reads`;
CREATE TABLE `message_reads` (
  `message_read_id` INT AUTO_INCREMENT PRIMARY KEY,
  `message_id` INT,
  `user_id` INT,
  `read_at` VARCHAR(255)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

DROP TABLE IF EXISTS `notifications`;
CREATE TABLE `notifications` (
  `notifications_id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT,
  `type` VARCHAR(255),
  `title` VARCHAR(255),
  `message` VARCHAR(255),
  `reference_id` INT,
  `is_read` BOOLEAN DEFAULT FALSE,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

DROP TABLE IF EXISTS `notification_preferences`;
CREATE TABLE `notification_preferences` (
  `preference_id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT,
  `email_enable` BOOLEAN DEFAULT FALSE,
  `push_enable` BOOLEAN DEFAULT FALSE,
  `in_app_enable` BOOLEAN DEFAULT FALSE,
  `project_invites` VARCHAR(255),
  `messages` VARCHAR(255),
  `ai_updates` VARCHAR(255),
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

DROP TABLE IF EXISTS `oauth_accounts`;
CREATE TABLE `oauth_accounts` (
  `oauth_account_id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT,
  `provider_name` INT,
  `provider_user_id` INT,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

DROP TABLE IF EXISTS `otp_verifications`;
CREATE TABLE `otp_verifications` (
  `otp_verification_id` INT AUTO_INCREMENT PRIMARY KEY,
  `otp_code_hash` VARCHAR(255),
  `otp_type` VARCHAR(255),
  `target_type` VARCHAR(255),
  `verification_target` VARCHAR(255),
  `is_used` BOOLEAN DEFAULT FALSE,
  `expires_at` VARCHAR(255),
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `attempts` VARCHAR(255)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

DROP TABLE IF EXISTS `projects`;
CREATE TABLE `projects` (
  `project_id` INT AUTO_INCREMENT PRIMARY KEY,
  `project_name` VARCHAR(255),
  `project_description` TEXT,
  `project_visibility` VARCHAR(255),
  `project_avatar_url` VARCHAR(255),
  `is_private` BOOLEAN DEFAULT FALSE,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `is_archived` BOOLEAN DEFAULT FALSE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

DROP TABLE IF EXISTS `project_invitations`;
CREATE TABLE `project_invitations` (
  `project_id` INT AUTO_INCREMENT PRIMARY KEY,
  `invite_user_id` INT,
  `invited_by_user_id` INT,
  `invitation_role` VARCHAR(255),
  `invitation_type` VARCHAR(255),
  `invitation_status` VARCHAR(255),
  `expires_at` VARCHAR(255),
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `responded_at` VARCHAR(255)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

DROP TABLE IF EXISTS `project_members`;
CREATE TABLE `project_members` (
  `project_member_id` INT AUTO_INCREMENT PRIMARY KEY,
  `project_id` INT,
  `user_id` INT,
  `project_role` VARCHAR(255),
  `managed_by_user_id` INT,
  `invited_by_user_id` INT,
  `is_active` BOOLEAN DEFAULT FALSE,
  `joined_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

DROP TABLE IF EXISTS `security_logs`;
CREATE TABLE `security_logs` (
  `security_log_id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT,
  `event_type` VARCHAR(255),
  `ip_address` VARCHAR(255),
  `user_agent` VARCHAR(255),
  `location` VARCHAR(255),
  `status` VARCHAR(255),
  `metadata` TEXT,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `full_name` VARCHAR(255),
  `password_hash` VARCHAR(255),
  `profile_pic_url` VARCHAR(255),
  `bio` TEXT,
  `platform_role` VARCHAR(255),
  `is_email_verified` BOOLEAN DEFAULT FALSE,
  `is_phone_verified` BOOLEAN DEFAULT FALSE,
  `two_factor_enabled` BOOLEAN DEFAULT FALSE,
  `last_seen_at` VARCHAR(255),
  `last_login_at` VARCHAR(255),
  `is_deleted` BOOLEAN DEFAULT FALSE,
  `deleted_at` VARCHAR(255),
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

DROP TABLE IF EXISTS `user_sessions`;
CREATE TABLE `user_sessions` (
  `session_id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT,
  `refresh_token_hash` VARCHAR(255),
  `device_type` VARCHAR(255),
  `device_name` VARCHAR(255),
  `device_os` VARCHAR(255),
  `browser_name` VARCHAR(255),
  `ip_address` VARCHAR(255),
  `fcm_token` VARCHAR(255),
  `is_active` BOOLEAN DEFAULT FALSE,
  `last_active_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `expires_at` VARCHAR(255),
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `location` VARCHAR(255),
  `revoked_at` VARCHAR(255)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

DROP TABLE IF EXISTS `workspaces`;
CREATE TABLE `workspaces` (
  `workspace_id` INT AUTO_INCREMENT PRIMARY KEY,
  `project_id` INT,
  `workspace_name` VARCHAR(255),
  `workspace_description` TEXT,
  `created_by_user_id` INT,
  `is_default` BOOLEAN DEFAULT FALSE,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

