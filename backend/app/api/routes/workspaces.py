"""
Workspace CRUD routes.
All operations are scoped to the authenticated user — users cannot access each other's workspaces.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.dependencies import get_db, get_current_user
from app.database.models.user import User
from app.database.models.workspace import Workspace
from app.schemas.workspace import WorkspaceCreate, WorkspaceUpdate, WorkspaceResponse

router = APIRouter(prefix="/api/workspaces", tags=["Workspaces"])


def _get_workspace_or_404(workspace_id: int, user: User, db: Session) -> Workspace:
    """Shared helper: fetch a workspace and verify it belongs to the requesting user."""
    ws = db.query(Workspace).filter(
        Workspace.id == workspace_id,
        Workspace.user_id == user.id,
    ).first()
    if not ws:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found.")
    return ws


@router.get("", response_model=List[WorkspaceResponse])
def list_workspaces(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Return all workspaces belonging to the authenticated user."""
    workspaces = db.query(Workspace).filter(Workspace.user_id == current_user.id).all()
    result = []
    for ws in workspaces:
        ws_dict = {
            "id": ws.id,
            "user_id": ws.user_id,
            "name": ws.name,
            "description": ws.description,
            "document_count": len(ws.documents),
            "conversation_count": len(ws.conversations),
            "created_at": ws.created_at,
            "updated_at": ws.updated_at,
        }
        result.append(WorkspaceResponse(**ws_dict))
    return result


@router.post("", response_model=WorkspaceResponse, status_code=status.HTTP_201_CREATED)
def create_workspace(
    request: WorkspaceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ws = Workspace(
        user_id=current_user.id,
        name=request.name.strip(),
        description=request.description,
    )
    db.add(ws)
    db.commit()
    db.refresh(ws)
    return WorkspaceResponse(
        id=ws.id, user_id=ws.user_id, name=ws.name, description=ws.description,
        document_count=0, conversation_count=0, created_at=ws.created_at, updated_at=ws.updated_at,
    )


@router.get("/{workspace_id}", response_model=WorkspaceResponse)
def get_workspace(
    workspace_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ws = _get_workspace_or_404(workspace_id, current_user, db)
    return WorkspaceResponse(
        id=ws.id, user_id=ws.user_id, name=ws.name, description=ws.description,
        document_count=len(ws.documents), conversation_count=len(ws.conversations),
        created_at=ws.created_at, updated_at=ws.updated_at,
    )


@router.patch("/{workspace_id}", response_model=WorkspaceResponse)
def update_workspace(
    workspace_id: int,
    request: WorkspaceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ws = _get_workspace_or_404(workspace_id, current_user, db)
    if request.name is not None:
        ws.name = request.name.strip()
    if request.description is not None:
        ws.description = request.description
    db.commit()
    db.refresh(ws)
    return WorkspaceResponse(
        id=ws.id, user_id=ws.user_id, name=ws.name, description=ws.description,
        document_count=len(ws.documents), conversation_count=len(ws.conversations),
        created_at=ws.created_at, updated_at=ws.updated_at,
    )


@router.delete("/{workspace_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_workspace(
    workspace_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ws = _get_workspace_or_404(workspace_id, current_user, db)

    # 1. Clean up vectors associated with this workspace
    from app.services.vector_store import delete_workspace_vectors
    delete_workspace_vectors(workspace_id)

    # 2. Clean up files on disk
    import os, shutil
    from app.core.config import settings
    ws_dir = os.path.join(settings.resolved_upload_dir, str(current_user.id), str(workspace_id))
    if os.path.exists(ws_dir):
        shutil.rmtree(ws_dir, ignore_errors=True)

    # 3. Delete database record (cascades documents and conversations)
    db.delete(ws)
    db.commit()
