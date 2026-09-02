"""
desktop/token_server.py — Browser / desktop staging voice session.

Run: python token_server.py
Open: http://localhost:3001
Also run: python agent.py start
"""

from __future__ import annotations

import json
import os
import uuid

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, JSONResponse
from livekit import api
from livekit.protocol.agent_dispatch import CreateAgentDispatchRequest

load_dotenv()
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_headers=["*"], allow_methods=["*"])

LIVEKIT_URL = os.getenv("LIVEKIT_URL", "")
API_KEY = os.getenv("LIVEKIT_API_KEY")
API_SECRET = os.getenv("LIVEKIT_API_SECRET")
AGENT_NAME = os.getenv("AGENT_NAME", "voice-agent-desktop")


@app.get("/token")
async def get_token():
    room_name = f"va-desk-{uuid.uuid4().hex[:8]}"
    identity = f"user-{uuid.uuid4().hex[:6]}"

    token = (
        api.AccessToken(API_KEY, API_SECRET)
        .with_identity(identity)
        .with_name("Desktop User")
        .with_grants(
            api.VideoGrants(room_join=True, room=room_name, can_publish=True, can_subscribe=True)
        )
        .to_jwt()
    )

    try:
        lk_api = api.LiveKitAPI(LIVEKIT_URL, API_KEY, API_SECRET)
        await lk_api.agent_dispatch.create_dispatch(
            CreateAgentDispatchRequest(
                agent_name=AGENT_NAME,
                room=room_name,
                metadata=json.dumps({"direction": "inbound"}),
            )
        )
        await lk_api.aclose()
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": f"Failed to dispatch agent: {e}"})

    return JSONResponse({"token": token, "room": room_name, "url": LIVEKIT_URL, "identity": identity})


@app.get("/", response_class=HTMLResponse)
async def index():
    return """
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>Voice Agent — Desktop Staging</title>
<script src="https://cdn.jsdelivr.net/npm/livekit-client/dist/livekit-client.umd.min.js"></script>
<style>
  body { font-family: Segoe UI, sans-serif; background:#070b12; color:#e8eef7; min-height:100vh; display:flex; align-items:center; justify-content:center; }
  .card { background:#101828; border:1px solid rgba(148,176,212,.14); border-radius:20px; padding:36px; width:min(480px,92vw); text-align:center; }
  .orb { width:84px; height:84px; margin:0 auto 18px; border-radius:50%; background:radial-gradient(circle,#2ee6c8,#0c1320); }
  .orb.speaking { animation:pulse 1s infinite; }
  @keyframes pulse { 0%{box-shadow:0 0 0 0 rgba(46,230,200,.35)} 70%{box-shadow:0 0 0 18px transparent} }
  button { width:100%; padding:14px; border:0; border-radius:12px; font-weight:600; cursor:pointer; margin-top:10px; }
  #connectBtn { background:#2ee6c8; color:#06211c; }
  #disconnectBtn { background:#233; color:#ff6b7a; display:none; }
  .status { margin:14px 0; padding:10px; border-radius:10px; background:#0c1320; color:#8b9bb4; font-size:14px; }
  .log { text-align:left; font:12px monospace; color:#64748b; max-height:140px; overflow:auto; margin-top:14px; }
</style>
</head>
<body>
<div class="card">
  <div class="orb" id="orb"></div>
  <h1>Desktop Voice Agent</h1>
  <p style="color:#8b9bb4;font-size:13px">Low-latency staging · interruption · noise cancel</p>
  <div class="status" id="status">Not connected</div>
  <button id="connectBtn" onclick="connect()">Connect & Talk</button>
  <button id="disconnectBtn" onclick="disconnect()">Disconnect</button>
  <div class="log" id="log">Ready…</div>
</div>
<script>
let room=null;
function log(m){const el=document.getElementById('log'); el.innerHTML+=`<div>${new Date().toLocaleTimeString()} — ${m}</div>`; el.scrollTop=el.scrollHeight;}
function setStatus(m,c){const el=document.getElementById('status'); el.textContent=m; el.style.color=c==='ok'?'#2ee6c8':c==='err'?'#ff6b7a':'#8b9bb4';}
async function connect(){
  document.getElementById('connectBtn').disabled=true;
  setStatus('Fetching token…');
  try{
    const res=await fetch('/token'); const data=await res.json();
    if(!res.ok) throw new Error(data.error||'token failed');
    room=new LivekitClient.Room({adaptiveStream:true,dynacast:true});
    room.on(LivekitClient.RoomEvent.Connected,()=>{setStatus('Connected — agent will greet you', 'ok'); document.getElementById('connectBtn').style.display='none'; document.getElementById('disconnectBtn').style.display='block';});
    room.on(LivekitClient.RoomEvent.Disconnected,()=>{setStatus('Disconnected'); document.getElementById('connectBtn').style.display='block'; document.getElementById('connectBtn').disabled=false; document.getElementById('disconnectBtn').style.display='none'; document.getElementById('orb').className='orb';});
    room.on(LivekitClient.RoomEvent.TrackSubscribed,(track)=>{ if(track.kind==='audio'){ const a=track.attach(); a.autoplay=true; document.body.appendChild(a); log('Audio subscribed'); }});
    room.on(LivekitClient.RoomEvent.ActiveSpeakersChanged,(speakers)=>{ document.getElementById('orb').className = speakers.some(s=>s.identity!==data.identity)?'orb speaking':'orb'; });
    await room.connect(data.url, data.token);
    await room.localParticipant.setMicrophoneEnabled(true);
    log('Mic on · room '+data.room);
  }catch(e){ setStatus('Error: '+e.message,'err'); log(e.message); document.getElementById('connectBtn').disabled=false; }
}
async function disconnect(){ if(room){ await room.disconnect(); room=null; } }
</script>
</body>
</html>
"""


if __name__ == "__main__":
    import uvicorn

    print("Desktop staging: http://localhost:3001")
    print("Also run: python agent.py start")
    uvicorn.run(app, host="0.0.0.0", port=3001)
