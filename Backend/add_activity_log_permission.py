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
            ADD COLUMN can_view_activity_log TINYINT(1) NOT NULL DEFAULT 0;
        ''')
        
        # Give owners and leaders full permissions to view activity log
        cursor.execute('''
            UPDATE project_members 
            SET can_view_activity_log=1 
            WHERE project_role IN ('Owner', 'Leader');
        ''')
    connection.commit()
    print('Added can_view_activity_log column to project_members successfully!')
except Exception as e:
    print(f'Error: {e}')
finally:
    connection.close()
