import sqlite3

def upgrade():
    conn = sqlite3.connect('coder_nest.db')
    cursor = conn.cursor()
    
    try:
        cursor.execute('ALTER TABLE users ADD COLUMN username VARCHAR(50) UNIQUE')
        print("Successfully added username column to users table.")
    except sqlite3.OperationalError as e:
        print(f"Error (maybe column already exists?): {e}")
        
    conn.commit()
    conn.close()

if __name__ == '__main__':
    upgrade()
