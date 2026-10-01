import asyncio
import logging
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.engine.session_manager import session_manager

logger = logging.getLogger(__name__)

router = APIRouter(tags=["websocket"])


@router.websocket("/ws/live")
async def live_attention_websocket(websocket: WebSocket):
    await websocket.accept()
    queue = session_manager.subscribe()
    logger.info("New WebSocket client connected to /ws/live")

    try:
        # If we have a cached last packet, send it immediately
        if session_manager._last_stream_packet:
            await websocket.send_text(session_manager._last_stream_packet.model_dump_json())

        while True:
            # Wait for next live telemetry packet from inference pipeline
            packet = await queue.get()
            await websocket.send_text(packet.model_dump_json())

    except WebSocketDisconnect:
        logger.info("WebSocket client disconnected from /ws/live")
    except Exception as e:
        logger.debug(f"WebSocket send loop ended: {e}")
    finally:
        session_manager.unsubscribe(queue)
