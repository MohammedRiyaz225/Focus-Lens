import datetime
from typing import Optional, List
from sqlalchemy import Integer, Float, String, Boolean, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), default="Local User")
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime, default=datetime.datetime.utcnow)

    sessions: Mapped[List["Session"]] = relationship("Session", back_populates="user", cascade="all, delete-orphan")


class Session(Base):
    __tablename__ = "sessions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), default=1)
    mode: Mapped[str] = mapped_column(String(50), default="Coding")  # Coding, Study, Reading, Meeting
    start_time: Mapped[datetime.datetime] = mapped_column(DateTime, default=datetime.datetime.utcnow)
    end_time: Mapped[Optional[datetime.datetime]] = mapped_column(DateTime, nullable=True)
    planned_duration_sec: Mapped[int] = mapped_column(Integer, default=1500)  # 25 min default
    duration_sec: Mapped[int] = mapped_column(Integer, default=0)
    focus_pct: Mapped[float] = mapped_column(Float, default=0.0)
    away_pct: Mapped[float] = mapped_column(Float, default=0.0)
    uncertain_pct: Mapped[float] = mapped_column(Float, default=0.0)
    longest_focus_sec: Mapped[int] = mapped_column(Integer, default=0)
    drop_count: Mapped[int] = mapped_column(Integer, default=0)
    status: Mapped[str] = mapped_column(String(20), default="running")  # running, paused, completed, cancelled
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    user: Mapped["User"] = relationship("User", back_populates="sessions")
    events: Mapped[List["AttentionEvent"]] = relationship("AttentionEvent", back_populates="session", cascade="all, delete-orphan")


class AttentionEvent(Base):
    __tablename__ = "attention_events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    session_id: Mapped[int] = mapped_column(Integer, ForeignKey("sessions.id"), index=True)
    timestamp: Mapped[datetime.datetime] = mapped_column(DateTime, default=datetime.datetime.utcnow, index=True)
    score: Mapped[float] = mapped_column(Float)
    state: Mapped[str] = mapped_column(String(30))  # away, possibly_distracted, engaged, highly_engaged
    face_detected: Mapped[bool] = mapped_column(Boolean, default=True)
    yaw: Mapped[float] = mapped_column(Float, default=0.0)
    pitch: Mapped[float] = mapped_column(Float, default=0.0)
    gaze_x: Mapped[float] = mapped_column(Float, default=0.5)
    gaze_y: Mapped[float] = mapped_column(Float, default=0.5)

    session: Mapped["Session"] = relationship("Session", back_populates="events")


class SettingRecord(Base):
    __tablename__ = "settings"

    key: Mapped[str] = mapped_column(String(100), primary_key=True)
    value: Mapped[dict] = mapped_column(JSON)
    updated_at: Mapped[datetime.datetime] = mapped_column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
