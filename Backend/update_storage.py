import pymysql

conn = pymysql.connect(host='127.0.0.1', user='root', password='', database='coders_nest')
cursor = conn.cursor()

try:
    cursor.execute("ALTER TABLE plans ADD COLUMN storage_limit_mb INT NOT NULL DEFAULT 500;")
except Exception as e:
    print("Column might already exist:", e)

cursor.execute("UPDATE plans SET storage_limit_mb = 500 WHERE name = 'Free';")
cursor.execute("UPDATE plans SET storage_limit_mb = 2048 WHERE name = 'Pro';")
cursor.execute("UPDATE plans SET storage_limit_mb = 20480 WHERE name = 'Team';")

conn.commit()
conn.close()
print("Done")
