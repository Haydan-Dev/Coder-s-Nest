import pymysql

connection = pymysql.connect(
    host='localhost',
    user='root',
    password='',
    database='coders_nest'
)

try:
    with connection.cursor() as cursor:
        cursor.execute('''
            ALTER TABLE project_members 
            ADD COLUMN can_edit_files TINYINT(1) NOT NULL DEFAULT 0,
            ADD COLUMN can_delete_files TINYINT(1) NOT NULL DEFAULT 0,
            ADD COLUMN can_rename_files TINYINT(1) NOT NULL DEFAULT 0,
            ADD COLUMN can_run_terminal TINYINT(1) NOT NULL DEFAULT 0,
            ADD COLUMN can_download_code TINYINT(1) NOT NULL DEFAULT 0,
            ADD COLUMN can_invite_members TINYINT(1) NOT NULL DEFAULT 0,
            ADD COLUMN can_manage_permissions TINYINT(1) NOT NULL DEFAULT 0;
        ''')
        
        # Optionally, give owners/leaders full permissions
        cursor.execute('''
            UPDATE project_members 
            SET can_edit_files=1, can_delete_files=1, can_rename_files=1, 
                can_run_terminal=1, can_download_code=1, can_invite_members=1, 
                can_manage_permissions=1 
            WHERE project_role IN ('Owner', 'Leader');
        ''')
    connection.commit()
    print('Added RBAC columns to project_members successfully!')
except Exception as e:
    print(f'Error: {e}')
finally:
    connection.close()
