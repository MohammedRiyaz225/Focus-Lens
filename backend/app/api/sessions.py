from typing import List, Optional
import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, func

from app.db.database import get_db
from app.db.models import Session, AttentionEvent
from app.schemas.schemas import SessionStartRequest, SessionResponse, SessionDetailResponse, AttentionEventResponse
from app.engine.session_manager import session_manager

router = APIRouter(prefix="/api/sessions", tags=["sessions"])


@router.post("/start", response_model=SessionResponse)
async def start_session(req: SessionStartRequest, db: AsyncSession = Depends(get_db)):
    # Create new session in DB
    new_session = Session(
        user_id=1,
        mode=req.mode,
        start_time=datetime.datetime.utcnow(),
        planned_duration_sec=req.planned_duration_min * 60,
        status="running"
    )
    db.add(new_session)
    await db.commit()
    await db.refresh(new_session)

    # Initialize live session manager
    session_manager.start_session(
        session_id=new_session.id,
        mode=req.mode,
        planned_min=req.planned_duration_min
    )
    return new_session


@router.post("/{session_id}/pause", response_model=SessionResponse)
async def pause_session(session_id: int, db: AsyncSession = Depends(get_db)):
    session = await db.get(Session, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    session.status = "paused"
    await db.commit()
    await db.refresh(session)

    session_manager.pause_session()
    return session


@router.post("/{session_id}/resume", response_model=SessionResponse)
async def resume_session(session_id: int, db: AsyncSession = Depends(get_db)):
    session = await db.get(Session, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    session.status = "running"
    await db.commit()
    await db.refresh(session)

    session_manager.resume_session()
    return session


@router.post("/{session_id}/end", response_model=SessionResponse)
async def end_session(session_id: int, db: AsyncSession = Depends(get_db)):
    session = await db.get(Session, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    stats = session_manager.get_session_summary_stats()
    session_manager.end_session()

    session.end_time = datetime.datetime.utcnow()
    session.status = "completed"
    session.duration_sec = stats["duration_sec"]
    session.focus_pct = stats["focus_pct"]
    session.away_pct = stats["away_pct"]
    session.uncertain_pct = stats["uncertain_pct"]
    session.longest_focus_sec = stats["longest_focus_sec"]
    session.drop_count = stats["drop_count"]

    await db.commit()
    await db.refresh(session)
    return session


@router.get("", response_model=List[SessionResponse])
async def list_sessions(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    mode: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    query = select(Session).order_by(desc(Session.start_time)).offset(offset).limit(limit)
    if mode and mode != "All":
        query = query.where(Session.mode == mode)

    result = await db.execute(query)
    sessions = result.scalars().all()
    return sessions


@router.get("/{session_id}", response_model=SessionDetailResponse)
async def get_session_detail(session_id: int, db: AsyncSession = Depends(get_db)):
    session = await db.get(Session, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Fetch events
    events_query = select(AttentionEvent).where(
        AttentionEvent.session_id == session_id
    ).order_by(AttentionEvent.timestamp)
    res = await db.execute(events_query)
    events = res.scalars().all()

    # Determine most distracted window if events exist
    most_distracted = None
    if len(events) >= 5:
        # Check in sliding windows of 5 events
        min_avg = 1.0
        min_idx = 0
        for i in range(len(events) - 4):
            window_avg = sum(e.score for e in events[i:i+5]) / 5.0
            if window_avg < min_avg:
                min_avg = window_avg
                min_idx = i
        t_start = events[min_idx].timestamp.strftime("%H:%M:%S")
        t_end = events[min(len(events)-1, min_idx+5)].timestamp.strftime("%H:%M:%S")
        most_distracted = f"{t_start} - {t_end}"

    pattern_desc = session_manager.pattern_detector.classify_pattern(session.duration_sec)

    # Generate Rule-based AI Coach summary fallback
    coach_summary = (
        f"In this {session.duration_sec // 60}m {session.mode} session, you maintained estimated visual engagement for {session.focus_pct}% of the time. "
        f"Your longest uninterrupted visual focus stretch was {session.longest_focus_sec // 60}m {session.longest_focus_sec % 60}s. "
        f"You experienced {session.drop_count} attention drops. "
        f"Note: This reflects screen visual engagement estimates and head orientation, not absolute neurological cognitive depth."
    )

    return SessionDetailResponse(
        id=session.id,
        user_id=session.user_id,
        mode=session.mode,
        start_time=session.start_time,
        end_time=session.end_time,
        planned_duration_sec=session.planned_duration_sec,
        duration_sec=session.duration_sec,
        focus_pct=session.focus_pct,
        away_pct=session.away_pct,
        uncertain_pct=session.uncertain_pct,
        longest_focus_sec=session.longest_focus_sec,
        drop_count=session.drop_count,
        status=session.status,
        notes=session.notes,
        events=[AttentionEventResponse.model_validate(e) for e in events],
        distraction_pattern=pattern_desc,
        most_distracted_window=most_distracted,
        ai_summary=coach_summary
    )
