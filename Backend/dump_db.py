import pymysql

def dump_database():
    try:
        # Connect to MySQL server
        connection = pymysql.connect(
            host='localhost',
            user='root',
            password='',
            database='db',  # Let's try 'db' since the folder is d:\db
            cursorclass=pymysql.cursors.DictCursor
        )
        
        with connection.cursor() as cursor:
            # Get all tables
            cursor.execute("SHOW TABLES")
            tables = cursor.fetchall()
            
            with open(r"d:\learning\Coder's-Nest\full_database_dump.sql", "w", encoding='utf-8') as f:
                f.write("-- Database schema dump\n\n")
                
                for table_dict in tables:
                    table_name = list(table_dict.values())[0]
                    cursor.execute(f"SHOW CREATE TABLE `{table_name}`")
                    create_stmt = cursor.fetchone()
                    
                    if 'Create Table' in create_stmt:
                        f.write(f"-- Table structure for `{table_name}`\n")
                        f.write(f"DROP TABLE IF EXISTS `{table_name}`;\n")
                        f.write(create_stmt['Create Table'] + ";\n\n")
                        
            print("Successfully dumped all schemas to full_database_dump.sql")
    except Exception as e:
        print(f"Error dumping database: {e}")
        try:
            print("Trying with database name 'coders_nest'...")
            connection = pymysql.connect(
                host='localhost',
                user='root',
                password='',
                database='coders_nest',
                cursorclass=pymysql.cursors.DictCursor
            )
            with connection.cursor() as cursor:
                cursor.execute("SHOW TABLES")
                tables = cursor.fetchall()
                with open(r"d:\learning\Coder's-Nest\full_database_dump.sql", "w", encoding='utf-8') as f:
                    for table_dict in tables:
                        table_name = list(table_dict.values())[0]
                        cursor.execute(f"SHOW CREATE TABLE `{table_name}`")
                        create_stmt = cursor.fetchone()
                        if 'Create Table' in create_stmt:
                            f.write(f"DROP TABLE IF EXISTS `{table_name}`;\n")
                            f.write(create_stmt['Create Table'] + ";\n\n")
                print("Successfully dumped schemas from 'coders_nest'")
        except Exception as e2:
            print(f"Error with coders_nest: {e2}")

if __name__ == "__main__":
    dump_database()
