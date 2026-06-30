from sqlalchemy.orm import Session
from fastapi import HTTPException
from typing import Type, TypeVar, Optional

T = TypeVar('T')

def get_or_404(db: Session, model: Type[T], detail: str = "Resource not found", **filters) -> T:
    """
    Fetches a single database record matching the filters.
    If it doesn't exist, raises a 404 HTTPException.
    """
    item = db.query(model).filter_by(**filters).first()
    if not item:
        raise HTTPException(status_code=404, detail=detail)
    return item

def commit_to_db(db: Session, item: T) -> T:
    """
    Adds, commits, and refreshes an item in the database.
    """
    db.add(item)
    db.commit()
    db.refresh(item)
    return item
