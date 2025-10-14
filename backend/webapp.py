import csv
from datetime import datetime
from io import StringIO
from typing import Optional
import pytz
from fastapi import FastAPI, Form, Request, HTTPException
from fastapi.responses import RedirectResponse, StreamingResponse
from fastapi.templating import Jinja2Templates
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from ai_openai import ai_parse_expense_openai

from db import get_con, insert_expense, delete_expense

BA_TZ = pytz.timezone("America/Argentina/Buenos_Aires")
app = FastAPI()
templates = Jinja2Templates(directory="templates")

# --- ENDPOINTS DE API PARA TU FRONTEND ---
# Modelo para recibir gastos por API
class Expense(BaseModel):
    user_id: str
    ts: str
    amount: float
    currency: str = "ARS"
    category: str
    note: Optional[str] = None
    raw_msg: str
    payment_method: Optional[str] = None
    installment_plan_id: Optional[str] = None
    installment_details: Optional[str] = None

# Endpoint para registrar gastos vía API
@app.post("/api/expenses")
async def add_expense_api(expense: Expense):
    try:
        insert_expense(**expense.dict())
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    return {"ok": True, "message": "Gasto registrado via API"}
import csv
from datetime import datetime
from io import StringIO
from typing import Optional
import pytz
from fastapi import FastAPI, Form, Request, HTTPException
from fastapi.responses import RedirectResponse, StreamingResponse
from fastapi.templating import Jinja2Templates
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from ai_openai import ai_parse_expense_openai

from db import get_con, insert_expense, delete_expense

BA_TZ = pytz.timezone("America/Argentina/Buenos_Aires")
app = FastAPI()
templates = Jinja2Templates(directory="templates")


# --- CONFIGURACIÓN DE CORS ---
origins = [
    "https://entrega-topicos.vercel.app", # Producción Vercel
    "http://localhost:8080",
    "http://localhost:8081",
    "http://localhost:5173",
    "http://127.0.0.1:8080",
    "http://127.0.0.1:8081",
    "null"
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)


# --- ENDPOINTS DE API PARA TU FRONTEND ---
@app.delete("/api/expenses/{expense_id}")
async def delete_expense_api(expense_id: int):
    try:
        with get_con() as con:
            cur = con.execute("DELETE FROM expenses WHERE id = ?", (expense_id,))
            if cur.rowcount == 0:
                raise HTTPException(status_code=404, detail="Gasto no encontrado")
        return {"ok": True, "message": "Gasto eliminado correctamente"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

from fastapi import Body

@app.put("/api/expenses/{expense_id}")
async def update_expense_api(
    expense_id: int,
    amount: float = Body(...),
    payment_method: str = Body(...)
):
    try:
        with get_con() as con:
            cur = con.execute(
                "UPDATE expenses SET amount = ?, payment_method = ? WHERE id = ?",
                (amount, payment_method, expense_id)
            )
            if cur.rowcount == 0:
                raise HTTPException(status_code=404, detail="Gasto no encontrado")
        return {"ok": True, "message": "Gasto actualizado correctamente"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/expenses/{user_id}")
async def get_expenses_api(user_id: str):
    with get_con() as con:
        with con.cursor() as cur:
            cur.execute(
                "SELECT id, ts as date, amount, category, note as description, user_id, payment_method, installment_plan_id, installment_details "
                "FROM expenses WHERE user_id = %s ORDER BY ts DESC",
                (user_id,)
            )
            rows = cur.fetchall()
    return [dict(row) for row in rows]

@app.post("/api/expenses/parse")
async def parse_expense(request: Request):
    data = await request.json()
    text = data.get("text", "")
    if not text:
        return JSONResponse(content={"error": "No text provided"}, status_code=400)
    try:
        result = await ai_parse_expense_openai(text)
        return JSONResponse(content={"parsed": result})
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)


# --- Rutas para la web original de Replit (sin cambios) ---
def period_month():
    today = datetime.now(BA_TZ).date()
    start = today.replace(day=1).isoformat()
    end = today.isoformat()
    return start, end

@app.get("/")
async def dashboard(request: Request):
    start, end = period_month()
    with get_con() as con:
        total = float(con.execute("SELECT COALESCE(SUM(amount),0) FROM expenses WHERE ts BETWEEN ? AND ?", (start, end)).fetchone()[0] or 0.0)
        rows = [dict(r) for r in con.execute("SELECT id, ts, amount, currency, category, note FROM expenses WHERE ts BETWEEN ? AND ? ORDER BY ts DESC, id DESC", (start, end))]
    category_breakdown = {}
    for row in rows:
        cat = row["category"]
        amt = row["amount"]
        category_breakdown[cat] = category_breakdown.get(cat, 0.0) + amt
    breakdown = []
    if total > 0:
        for cat, amt in sorted(category_breakdown.items(), key=lambda x: x[1], reverse=True):
            pct = (amt / total) * 100
            breakdown.append({"category": cat, "amount": amt, "percentage": round(pct, 1)})
    return templates.TemplateResponse("index.html", {"request": request, "total": total, "breakdown": breakdown, "movements": rows, "start": start, "end": end})

@app.post("/add")
async def add_expense(amount: float = Form(...), category: str = Form(...), note: Optional[str] = Form(None), date: Optional[str] = Form(None)):
    if not date:
        date = datetime.now(BA_TZ).date().isoformat()
    insert_expense(user_id="web", ts=date, amount=amount, currency="ARS", category=category, note=note or "", raw_msg=f"web:{amount}:{category}")
    return RedirectResponse(url="/", status_code=303)

@app.get("/export")
async def export_csv():
    start, end = period_month()
    with get_con() as con:
        rows = [dict(r) for r in con.execute("SELECT id, ts, amount, currency, category, note FROM expenses WHERE ts BETWEEN ? AND ? ORDER BY ts ASC, id ASC", (start, end))]
    output = StringIO()
    writer = csv.writer(output)
    writer.writerow(["id", "ts", "amount", "currency", "category", "note"])
    for r in rows:
        writer.writerow([r["id"], r["ts"], r["amount"], r["currency"], r["category"], r["note"] or ""])
    output.seek(0)
    filename = f"gastos_{start}_a_{end}.csv"
    return StreamingResponse(iter([output.read()]), media_type="text/csv", headers={"Content-Disposition": f'attachment; filename="{filename}"'})