import sys
import os

# Insert backend path for imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.config import settings
from app.models import Category
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

CATEGORIES = [
    {"name": "Food & Dining", "icon": "🍽️", "color": "#FF5733"},
    {"name": "Transportation", "icon": "🚗", "color": "#33FF57"},
    {"name": "Housing", "icon": "🏠", "color": "#3357FF"},
    {"name": "Utilities", "icon": "🔌", "color": "#F3FF33"},
    {"name": "Shopping", "icon": "🛒", "color": "#FF33F3"},
    {"name": "Healthcare", "icon": "💊", "color": "#33FFF3"},
    {"name": "Education", "icon": "🎓", "color": "#9933FF"},
    {"name": "Entertainment", "icon": "🎉", "color": "#33FF99"},
    {"name": "Travel", "icon": "✈️", "color": "#33CCFF"},
    {"name": "Personal Care", "icon": "👕", "color": "#66FF33"},
    {"name": "Family", "icon": "👶", "color": "#FFCC33"},
    {"name": "Financial Obligations", "icon": "🏦", "color": "#3366FF"},
    {"name": "Business/Work", "icon": "💼", "color": "#FF9933"},
    {"name": "Investments", "icon": "📈", "color": "#FF3333"},
    {"name": "Miscellaneous", "icon": "📦", "color": "#808080"},
]

def try_seed(url: str):
    print(f"Trying connection URL: {url.split('@')[1]}")
    engine = create_engine(url, pool_pre_ping=True)
    SessionLocal = sessionmaker(bind=engine)
    db = SessionLocal()
    try:
        # First, delete all default categories to prevent old category names from persisting
        db.query(Category).filter(Category.user_id.is_(None), Category.is_default == True).delete()
        db.flush()
        
        inserted_count = 0
        for cat_data in CATEGORIES:
            cat = Category(
                user_id=None,
                name=cat_data["name"],
                icon=cat_data["icon"],
                color=cat_data["color"],
                is_default=True
            )
            db.add(cat)
            inserted_count += 1
                
        db.commit()
        print(f"✅ Seeding completed! Re-seeded {inserted_count} production-ready categories.")
        return True
    except Exception as e:
        db.rollback()
        print(f"❌ Failed under this URL: {e}")
        return False
    finally:
        db.close()

if __name__ == "__main__":
    url_5432 = settings.DATABASE_URL
    url_6543 = url_5432.replace(":5432/", ":6543/")
    
    # Try 6543 first (often more stable on cloud connections)
    if not try_seed(url_6543):
        print("Retrying with original URL...")
        if not try_seed(url_5432):
            print("❌ Both connections failed.")
            sys.exit(1)
            
    sys.exit(0)
