from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.api import auth, expenses, incomes, accounts, reports, budgets

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Set up CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust for production dashboard host
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(expenses.router, prefix=settings.API_V1_STR)
app.include_router(incomes.router, prefix=settings.API_V1_STR)
app.include_router(accounts.router, prefix=settings.API_V1_STR)
app.include_router(reports.router, prefix=settings.API_V1_STR)
app.include_router(budgets.router, prefix=settings.API_V1_STR)

@app.get("/", tags=["status"])
def root_status():
    return {
        "status": "online",
        "service": settings.PROJECT_NAME,
        "api_v1_docs": "/docs"
    }
