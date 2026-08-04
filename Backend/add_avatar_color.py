import pymysql

# Connect to the database
connection = pymysql.connect(
    host='localhost',
    user='root',
    password='',
    database='coders_nest'
)

try:
    with connection.cursor() as cursor:
        # Create a new column
        cursor.execute("ALTER TABLE users ADD COLUMN avatar_color VARCHAR(10) NULL;")
        
        # We need to assign colors to existing users so it's not null.
        cursor.execute("SELECT user_id FROM users")
        users = cursor.fetchall()
        
        import random
        colors = ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4']
        
        for user in users:
            user_id = user[0]
            color = random.choice(colors)
            cursor.execute("UPDATE users SET avatar_color = %s WHERE user_id = %s", (color, user_id))
            
    connection.commit()
    print("Column avatar_color added successfully!")
except Exception as e:
    print(f"Error: {e}")
finally:
    connection.close()
