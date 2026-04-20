from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import ACTIVE_MODEL
from routers import classify, search, index

app = FastAPI(title="현대판 일상 실록 AI API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Next.js dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(classify.router, prefix="/api")
app.include_router(search.router, prefix="/api")
app.include_router(index.router, prefix="/api")


@app.get("/")
def root():
    return {"status": "ok", "active_model": ACTIVE_MODEL}


@app.get("/health")
def health():
    return {"status": "ok", "active_model": ACTIVE_MODEL}
