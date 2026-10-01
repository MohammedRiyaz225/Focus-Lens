import datetime
from typing import List, Dict
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc

from app.db.database import get_db
from app.db.models import Session, AttentionEvent
from app.schemas.schemas import DailyAnalytics, WeeklyAnalytics, AnalyticsSummary

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


@router.get("/summary", response_model=AnalyticsSummary)
async def get_analytics_summary(db: AsyncSession = Depends(get_db)):
    today_start = datetime.datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)

    # Fetch today's sessions
    today_query = select(Session).where(Session.start_time >= today_start)
    res = await db.execute(today_query)
    today_sessions = res.scalars().all()

    focus_sec_today = sum(s.duration_sec * (s.focus_pct / 100.0) for s in today_sessions)
    away_sec_today = sum(s.duration_sec * (s.away_pct / 100.0) for s in today_sessions)
    total_drops_today = sum(s.drop_count for s in today_sessions)

    # Fetch all sessions for streaks and averages
    all_sessions_res = await db.execute(select(Session).order_by(desc(Session.start_time)))
    all_sessions = all_sessions_res.scalars().all()

    avg_len = 0.0
    longest_len = 0.0
    mode_counts: Dict[str, int] = {}

    if all_sessions:
        avg_len = round(sum(s.duration_sec for s in all_sessions) / len(all_sessions) / 60.0, 1)
        longest_len = round(max(s.duration_sec for s in all_sessions) / 60.0, 1)
        for s in all_sessions:
            mode_counts[s.mode] = mode_counts.get(s.mode, 0) + 1

    # Streak Calculation (consecutive days with >= 1 session)
    streak_days = 0
    if all_sessions:
        dates_with_sessions = sorted(list(set(s.start_time.date() for s in all_sessions)), reverse=True)
        cur_date = datetime.date.today()
        # If user did a session today, streak starts from today, otherwise from yesterday
        if dates_with_sessions and (dates_with_sessions[0] == cur_date or dates_with_sessions[0] == cur_date - datetime.timedelta(days=1)):
            expected = dates_with_sessions[0]
            for d in dates_with_sessions:
                if d == expected:
                    streak_days += 1
                    expected = expected - datetime.timedelta(days=1)
                else:
                    break

    # Insight estimation: when does attention typically drop?
    insight_text = "Your visual engagement usually stays high for ~20-25 minutes before initial drops (estimate based on session history)."
    if all_sessions:
        drops_sessions = [s for s in all_sessions if s.longest_focus_sec > 0]
        if drops_sessions:
            avg_first_drop_min = int(sum(s.longest_focus_sec for s in drops_sessions) / len(drops_sessions) / 60.0)
            avg_first_drop_min = max(5, avg_first_drop_min)
            insight_text = f"Your visual engagement usually experiences initial drops after ~{avg_first_drop_min} minutes (attention estimate, not cognitive exhaustion)."

    return AnalyticsSummary(
        focus_time_today_min=round(focus_sec_today / 60.0, 1),
        away_time_today_min=round(away_sec_today / 60.0, 1),
        sessions_today=len(today_sessions),
        current_streak_days=streak_days,
        avg_session_length_min=avg_len,
        longest_session_min=longest_len,
        total_drops_today=total_drops_today,
        focus_drop_insight=insight_text,
        mode_distribution=mode_counts
    )


@router.get("/daily", response_model=List[DailyAnalytics])
async def get_daily_analytics(days: int = 7, db: AsyncSession = Depends(get_db)):
    cutoff = datetime.datetime.utcnow() - datetime.timedelta(days=days)
    query = select(Session).where(Session.start_time >= cutoff).order_by(Session.start_time)
    res = await db.execute(query)
    sessions = res.scalars().all()

    # Group by date
    daily_map: Dict[str, Dict[str, float]] = {}
    for i in range(days):
        d = (cutoff + datetime.timedelta(days=i+1)).strftime("%Y-%m-%d")
        daily_map[d] = {"focus_sec": 0.0, "away_sec": 0.0, "count": 0, "scores": [], "drops": 0}

    for s in sessions:
        d = s.start_time.strftime("%Y-%m-%d")
        if d in daily_map:
            daily_map[d]["focus_sec"] += s.duration_sec * (s.focus_pct / 100.0)
            daily_map[d]["away_sec"] += s.duration_sec * (s.away_pct / 100.0)
            daily_map[d]["count"] += 1
            daily_map[d]["scores"].append(s.focus_pct)
            daily_map[d]["drops"] += s.drop_count

    result = []
    for d, val in daily_map.items():
        avg_score = (sum(val["scores"]) / len(val["scores"])) / 100.0 if val["scores"] else 0.0
        result.append(DailyAnalytics(
            date=d,
            focus_minutes=round(val["focus_sec"] / 60.0, 1),
            away_minutes=round(val["away_sec"] / 60.0, 1),
            sessions_count=int(val["count"]),
            avg_attention_score=round(avg_score, 2),
            drop_count=int(val["drops"])
        ))
    return result
