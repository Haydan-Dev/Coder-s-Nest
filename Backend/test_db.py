import time
from sqlalchemy import create_engine
engine = create_engine('mysql+pymysql://root:@localhost/coders_nest', connect_args={'connect_timeout': 3})
try:
    print('Connecting...')
    start = time.time()
    conn = engine.connect()
    print('Connected in', time.time() - start)
    conn.close()
except Exception as e:
    print('Error:', e)