from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker,declarative_base

# database url
DATABASE_URL = "mysql+pymysql://root:@localhost/coders_nest"

#creating main engine for db and apis
engine = create_engine(DATABASE_URL,echo=True)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()