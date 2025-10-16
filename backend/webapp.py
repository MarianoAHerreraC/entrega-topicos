import csv
from datetime import datetime
from io import StringIO
from typing import Optional
import pytz
from fastapi import FastAPI, Form, Request, HTTPException, Body
from fastapi.responses import RedirectResponse, StreamingResponse, JSONResponse
from fastapi.templating import Jinja2Templates
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from db import get_con, insert_expense, delete_expense, init_db

BA_TZ = pytz.timezone("America/Argentina/Buenos_Aires")
app = FastAPI()
init_db()
templates = Jinja2Templates(directory="templates")

# --- DEFINE period_month FUNCTION ---
def period_month():
    today = datetime.now(BA_TZ).date()
    start = today.replace(day=1).isoformat()
    end = today.isoformat()
    return start, end

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
        insert_expense(
            user_id=expense.user_id,
            ts=expense.ts,
            amount=expense.amount,
            currency=expense.currency,
            category=expense.category,
            note=expense.note,
            raw_msg=expense.raw_msg,
            payment_method=expense.payment_method,
            installment_plan_id=expense.installment_plan_id,
            installment_details=expense.installment_details,
        )
        return {"ok": True, "message": "Gasto registrado via API"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
## ...existing code...


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
            cur = con.cursor()
            # Buscar si el gasto tiene installment_plan_id
            cur.execute("SELECT installment_plan_id FROM expenses WHERE id = %s", (expense_id,))
            row = cur.fetchone()
            if row is None:
                cur.close()
                raise HTTPException(status_code=404, detail="Gasto no encontrado")
            plan_id = row[0]
            if plan_id:
                # Eliminar todas las cuotas asociadas
                cur.execute("DELETE FROM expenses WHERE installment_plan_id = %s", (plan_id,))
            else:
                # Eliminar solo el gasto
                cur.execute("DELETE FROM expenses WHERE id = %s", (expense_id,))
            con.commit()
            cur.close()
        return {"ok": True, "message": "Gasto(s) eliminado(s) correctamente"}
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
            cur = con.cursor()
            cur.execute(
                "UPDATE expenses SET amount = %s, payment_method = %s WHERE id = %s",
                (amount, payment_method, expense_id)
            )
            con.commit()
            if cur.rowcount == 0:
                cur.close()
                raise HTTPException(status_code=404, detail="Gasto no encontrado")
            cur.close()
        return {"ok": True, "message": "Gasto actualizado correctamente"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/expenses/{user_id}")
async def get_expenses_api(user_id: str):
    with get_con() as con:
        cur = con.cursor()
        cur.execute(
            "SELECT id, ts as date, amount, category, note as description, user_id, payment_method, installment_plan_id, installment_details "
            "FROM expenses WHERE user_id = %s ORDER BY ts DESC",
            (user_id,)
        )
        rows = cur.fetchall()
        result = [dict(zip([desc[0] for desc in cur.description], row)) for row in rows]
        cur.close()
    return result



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
        cur = con.cursor()
        cur.execute("SELECT COALESCE(SUM(amount),0) FROM expenses WHERE ts BETWEEN %s AND %s", (start, end))
        total = float(cur.fetchone()[0] or 0.0)
        cur.execute("SELECT id, ts, amount, currency, category, note FROM expenses WHERE ts BETWEEN %s AND %s ORDER BY ts DESC, id DESC", (start, end))
        rows = [dict(zip([desc[0] for desc in cur.description], r)) for r in cur.fetchall()]
        cur.close()
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
        cur = con.cursor()
        cur.execute("SELECT id, ts, amount, currency, category, note FROM expenses WHERE ts BETWEEN %s AND %s ORDER BY ts ASC, id ASC", (start, end))
        rows = [dict(zip([desc[0] for desc in cur.description], r)) for r in cur.fetchall()]
        cur.close()
    output = StringIO()
    writer = csv.writer(output)
    writer.writerow(["id", "ts", "amount", "currency", "category", "note"])
    for r in rows:
        writer.writerow([r["id"], r["ts"], r["amount"], r["currency"], r["category"], r["note"] or ""])
    output.seek(0)
    filename = f"gastos_{start}_a_{end}.csv"
    return StreamingResponse(iter([output.read()]), media_type="text/csv", headers={"Content-Disposition": f'attachment; filename="{filename}"'})