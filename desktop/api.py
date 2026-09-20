"""
desktop/api.py  Outbound / inbound call dispatch for desktop Voice Agent.

Run: python api.py
Docs: http://localhost:8000/docs
"""

from __future__ import annotations

import asyncio
import csv
import io
import json
import logging
import os
import threading
import time
import uuid
from typing import List, Optional

import httpx
from dotenv import load_dotenv
from fastapi import BackgroundTasks, FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from livekit import api
from livekit.protocol.agent_dispatch import CreateAgentDispatchRequest
from pydantic import BaseModel

load_dotenv()
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("voice-agent.api")

AGENT_NAME = os.getenv("AGENT_NAME", "voice-agent-desktop")
LIVEKIT_URL = os.getenv("LIVEKIT_URL")
API_KEY = os.getenv("LIVEKIT_API_KEY")
API_SECRET = os.getenv("LIVEKIT_API_SECRET")
OUTBOUND_TRUNK = os.getenv("OUTBOUND_TRUNK_ID", "")
APP_API_URL = os.getenv("APP_URL", "http://localhost:4000").rstrip("/")
DESKTOP_API_KEY = os.getenv("DESKTOP_WORKER_KEY", "desktop-dev-key")

app = FastAPI(title="Voice Agent  Call Dispatch API", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])


class Lead(BaseModel):
    phone_number: str
    contact_name: str
    company_name: str = ""


class OutboundCallRequest(BaseModel):
    lead: Lead


lead_store: List[Lead] = []


def format_phone(raw: str) -> str:
    if "." in raw or "E" in raw.lower():
        try:
            raw = str(int(float(raw)))
        except Exception:
            pass
    digits = "".join(filter(str.isdigit, raw))
    if len(digits) == 10:
        digits = "1" + digits
    return "+" + digits


async def saas_create_call(direction: str, lead: Lead, room_name: str) -> Optional[str]:
    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            res = await client.post(
                f"{APP_API_URL}/api/desktop/events",
                headers={"x-desktop-key": DESKTOP_API_KEY},
                json={
                    "type": "call_queued",
                    "direction": direction,
                    "phoneNumber": format_phone(lead.phone_number),
                    "contactName": lead.contact_name,
                    "roomName": room_name,
                    "notes": lead.company_name or None,
                },
            )
            if res.status_code < 300:
                data = res.json()
                return data.get("callLogId")
    except Exception as e:
        logger.warning(f"SaaS call create failed: {e}")
    return None


async def dispatch_outbound_call_async(lead: Lead) -> str:
    phone = format_phone(lead.phone_number)
    room_name = f"va-outbound-{uuid.uuid4().hex[:8]}"
    call_log_id = await saas_create_call("outbound", lead, room_name)
    metadata = json.dumps(
        {
            "direction": "outbound",
            "phone_number": phone,
            "contact_name": lead.contact_name,
            "company_name": lead.company_name,
            "call_log_id": call_log_id,
        }
    )

    lk_api = api.LiveKitAPI(LIVEKIT_URL, API_KEY, API_SECRET)
    try:
        dispatch = await lk_api.agent_dispatch.create_dispatch(
            CreateAgentDispatchRequest(agent_name=AGENT_NAME, room=room_name, metadata=metadata)
        )
        return f"Dispatch {dispatch.id} room:{room_name}"
    finally:
        await lk_api.aclose()


def dispatch_outbound_call(lead: Lead) -> str:
    return asyncio.run(dispatch_outbound_call_async(lead))


def parse_csv(content: str) -> List[Lead]:
    leads = []
    reader = csv.DictReader(io.StringIO(content))
    for row in reader:
        raw_phone = (row.get("Phone Number") or row.get("phone") or "").strip()
        name = (row.get("Name") or row.get("Contact Name") or "").strip()
        company = (row.get("Company Name") or row.get("company") or "").strip()
        if not raw_phone or not name:
            continue
        leads.append(Lead(phone_number=format_phone(raw_phone), contact_name=name, company_name=company))
    return leads


@app.get("/", response_class=HTMLResponse)
def home():
    trunk = OUTBOUND_TRUNK if OUTBOUND_TRUNK else "NOT SET"
    return f"""
    <html><body style="font-family:sans-serif;padding:40px;background:#070b12;color:#e8eef7">
    <h1>Voice Agent  Call Dispatch</h1>
    <p>Agent: <code>{AGENT_NAME}</code></p>
    <p>Outbound trunk: <code>{trunk}</code></p>
    <p>SaaS: <code>{APP_API_URL}</code></p>
    <p>Leads loaded: <strong>{len(lead_store)}</strong></p>
    <a href="/docs" style="color:#2ee6c8">Open API docs</a>
    </body></html>
    """


@app.get("/health")
def health():
    return {
        "status": "ok",
        "agent": AGENT_NAME,
        "outbound_trunk": OUTBOUND_TRUNK or "NOT SET",
        "livekit": bool(LIVEKIT_URL and API_KEY),
        "leads_loaded": len(lead_store),
    }


@app.post("/call/outbound")
async def single_outbound_call(request: OutboundCallRequest, background_tasks: BackgroundTasks):
    phone = format_phone(request.lead.phone_number)
    background_tasks.add_task(dispatch_outbound_call, request.lead)
    return {
        "status": "queued",
        "message": f"Agent will call {request.lead.contact_name} at {phone}",
        "contact": request.lead.contact_name,
        "phone": phone,
    }


@app.post("/call/batch")
async def batch_outbound_calls(
    file: UploadFile = File(...),
    delay_seconds: int = Form(default=60),
    auto_call: bool = Form(default=True),
):
    global lead_store
    if not file.filename or not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files accepted.")
    raw = await file.read()
    lead_store = parse_csv(raw.decode("utf-8"))
    if not lead_store:
        raise HTTPException(status_code=400, detail="No valid leads found.")
    if auto_call:
        def call_all():
            for i, lead in enumerate(lead_store):
                try:
                    dispatch_outbound_call(lead)
                    if i < len(lead_store) - 1:
                        time.sleep(delay_seconds)
                except Exception as e:
                    logger.error(f"Call failed: {e}")
        threading.Thread(target=call_all, daemon=True).start()
    return {"status": "success", "leads_loaded": len(lead_store), "auto_calling": auto_call}


@app.get("/leads")
def list_leads():
    return {"total": len(lead_store), "leads": [l.model_dump() for l in lead_store]}


if __name__ == "__main__":
    import uvicorn

    print("=" * 60)
    print("  Voice Agent  Outbound Call API")
    print(f"  Agent: {AGENT_NAME}")
    print(f"  Docs:  http://localhost:8000/docs")
    print("=" * 60)
    uvicorn.run("api:app", host=os.getenv("HOST", "0.0.0.0"), port=int(os.getenv("PORT", 8000)), reload=False)
