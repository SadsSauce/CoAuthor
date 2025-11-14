from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import difflib

from db import list_versions, get_version, create_version_entry, revert_to_version, get_document, save_document

router = APIRouter()


class VersionCreate(BaseModel):
    content: Optional[str] = None
    author: Optional[str] = None
    summary: Optional[str] = None


@router.get("/version_control/{room_name}/versions")
def api_list_versions(room_name: str, limit: int = 100):
    return {"versions": list_versions(room_name, limit=limit)}


@router.get("/version_control/{room_name}/versions/{version_id}")
def api_get_version(room_name: str, version_id: int):
    v = get_version(version_id)
    if not v or v["room_name"] != room_name:
        raise HTTPException(status_code=404, detail="Version not found")
    return {"version": v}


@router.post("/version_control/{room_name}/versions")
def api_create_version(room_name: str, payload: VersionCreate):
    # If no content provided, use current document content
    content = payload.content
    if content is None:
        doc = get_document(room_name)
        content = doc["content"] if doc else ""

    vid = create_version_entry(room_name, content, author=payload.author, summary=payload.summary)
    return {"version_id": vid}


@router.post("/version_control/versions/{version_id}/revert")
def api_revert_version(version_id: int, performed_by: Optional[str] = None):
    ok = revert_to_version(version_id, performed_by=performed_by)
    if not ok:
        raise HTTPException(status_code=404, detail="Version not found or revert failed")
    return {"reverted_to": version_id}


@router.get("/version_control/{room_name}/versions/{a}/compare/{b}")
def api_compare_versions(room_name: str, a: int, b: int):
    va = get_version(a)
    vb = get_version(b)
    if not va or not vb or va["room_name"] != room_name or vb["room_name"] != room_name:
        raise HTTPException(status_code=404, detail="One or both versions not found")

    a_lines = (va.get("content") or "").splitlines(keepends=True)
    b_lines = (vb.get("content") or "").splitlines(keepends=True)
    diff = difflib.unified_diff(a_lines, b_lines, fromfile=f"version_{a}", tofile=f"version_{b}")
    return {"diff": "".join(diff)}

