from fastapi import APIRouter

router = APIRouter()

@router.get("/export")
def get_export():
    return {"export": "Export document to PDF/Word endpoint"}
