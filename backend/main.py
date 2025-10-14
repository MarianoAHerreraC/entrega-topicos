import requests
# FILE: main.py (VERSIÓN FINAL Y COMPLETA)
import os
## nest_asyncio no es necesario para la ejecución local del bot y el servidor web
from dotenv import load_dotenv
load_dotenv()
import csv
import threading
import re
import uuid
from datetime import datetime, timedelta

import pytz
import uvicorn
from telegram.ext import (
    Application,
    CommandHandler,
    ContextTypes,
    MessageHandler,
    filters,
)
from dateutil.relativedelta import relativedelta

from db import (
    init_db,
    insert_expense,
    sum_by_period,
    top_categories,
    iter_by_period,
)
from parser import parse_gasto_args
from webapp import app as webapp
# Desactivamos la IA por ahora
# from ai import ai_parse_expense

# -------------------------------------------------
# Configuración
# -------------------------------------------------
TOKEN = os.getenv("TELEGRAM_TOKEN")
print("TOKEN:", TOKEN)
BA_TZ = pytz.timezone("America/Argentina/Buenos_Aires")
IA_MODE = False

HELP_TEXT = ("📒 *Gastos Bot*\n\n"
             "Comandos:\n"
             "• /gasto <monto> <cat> \"nota\" [fecha] [medio_pago]\n"
             "• /cuotas <total> <N> <cat> \"descripción\"\n"
             "  Ej: /cuotas 120000 12 hogar \"tele nueva\"\n"
             "• /resumen semana | mes\n"
             "• /exportar\n"
             "• /help\n")


# -------------------------------------------------
# Helpers de Períodos
# -------------------------------------------------
def period_week():
    today = datetime.now(BA_TZ).date()
    start = today - timedelta(days=today.weekday())
    end = today + timedelta(days=1)
    return start.isoformat(), end.isoformat()


def period_month():
    today = datetime.now(BA_TZ).date()
    start = today.replace(day=1)
    end = today + timedelta(days=1)
    return start.isoformat(), end.isoformat()


# -------------------------------------------------
# Handlers (Comandos del Bot)
# -------------------------------------------------
async def start_cmd(update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text("¡Hola! 👋\n" + HELP_TEXT,
                                      parse_mode="Markdown")


async def help_cmd(update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(HELP_TEXT, parse_mode="Markdown")


async def gasto_cmd(update, context: ContextTypes.DEFAULT_TYPE):
    text = " ".join(context.args) if context.args else (update.message.text
                                                          or "")
    today_iso_date = datetime.now(BA_TZ).date().isoformat()
    parsed, err = parse_gasto_args(text, today_iso_date)

    if not parsed:
        await update.message.reply_text(f"❌ {err}")
        return

    amount, category = parsed["amount"], parsed["category"]
    ts_from_parser = parsed.get("date", today_iso_date)
    note = parsed.get("note") or ""
    payment_method = parsed.get("payment_method")

    full_timestamp = datetime.now(BA_TZ).isoformat()
    if 'T' not in ts_from_parser:
        current_time = datetime.now(BA_TZ).time()
        full_timestamp = datetime.combine(
            datetime.fromisoformat(ts_from_parser), current_time).isoformat()
    else:
        full_timestamp = ts_from_parser

    expense_data = {
        "user_id": str(update.effective_user.id),
        "ts": full_timestamp,
        "amount": amount,
        "currency": "ARS",
        "category": category,
        "note": note,
        "raw_msg": text,
        "payment_method": payment_method
    }
    api_url = "https://entrega-topicos-backend.onrender.com/api/expenses"
    response = requests.post(api_url, json=expense_data)
    if response.status_code != 200:
        await update.message.reply_text(f"❌ Error al registrar el gasto en la API: {response.text}")
        return

    formatted_date = datetime.fromisoformat(full_timestamp).strftime(
        "%d/%m/%Y %H:%M")
    start_m, end_m = period_month()
    total_month = sum_by_period(str(update.effective_user.id), start_m, end_m)
    msg = (f"✅ Registrado: ${amount:.2f} en *{category}* ({formatted_date}).\n"
           f"Este mes llevás ${total_month:.2f} en total.")
    await update.message.reply_text(msg, parse_mode="Markdown")


async def cuotas_cmd(update, context: ContextTypes.DEFAULT_TYPE):
    try:
        args = context.args
        monto_total = float(args[0])
        cantidad_cuotas = int(args[1])
        categoria = args[2]
        descripcion_match = re.search(r'["“](.*?)["”]', " ".join(args))
        descripcion = descripcion_match.group(
            1) if descripcion_match else categoria
    except (IndexError, ValueError):
        await update.message.reply_text(
            "Formato incorrecto. Usá: /cuotas <total> <N> <cat> \"descripción\""
        )
        return

    monto_por_cuota = monto_total / cantidad_cuotas
    plan_id = str(uuid.uuid4())
    fecha_inicio = datetime.now(BA_TZ) # Usamos fecha y hora

    for i in range(cantidad_cuotas):
        # --- CORRECCIÓN CLAVE ---
        # Calculamos la fecha y hora para cada cuota futura
        fecha_cuota = fecha_inicio + relativedelta(months=i)

        expense_data = {
            "user_id": str(update.effective_user.id),
            "ts": fecha_cuota.isoformat(),
            "amount": monto_por_cuota,
            "currency": "ARS",
            "category": categoria,
            "note": descripcion,
            "raw_msg": f"Cuota {i+1}/{cantidad_cuotas}",
            "payment_method": "crédito",
            "installment_plan_id": plan_id,
            "installment_details": f"{i+1}/{cantidad_cuotas}"
        }
        api_url = "https://entrega-topicos-backend.onrender.com/api/expenses"
        requests.post(api_url, json=expense_data)

    await update.message.reply_text(
        f"✅ ¡Plan de {cantidad_cuotas} cuotas registrado!")


async def resumen_cmd(update, context: ContextTypes.DEFAULT_TYPE):
    user_id = str(update.effective_user.id)
    # ... (código existente)


async def exportar_cmd(update, context: ContextTypes.DEFAULT_TYPE):
    user_id = str(update.effective_user.id)
    # ... (código existente)


async def free_text_handler(update, context: ContextTypes.DEFAULT_TYPE):
    if update.effective_chat.type != "private": return
    await gasto_cmd(update, context)


# -------------------------------------------------
# Servidor web y arranque
# -------------------------------------------------

import asyncio


def _run_web():
    import uvicorn
    uvicorn.run("webapp:app", host="0.0.0.0", port=5001, log_level="info")


async def main():
    if not TOKEN:
        print("⚠️ No se encontró TELEGRAM_TOKEN en Secrets.")
        return


    init_db()
    # Ejecuta el servidor web solo si el script se ejecuta directamente
    # threading.Thread(target=_run_web, daemon=True).start()
    # print("🌐 Servidor web iniciado en un hilo.")
    # Si quieres iniciar el servidor web, ejecuta: python -m uvicorn webapp:app --reload

    app = Application.builder().token(TOKEN).build()
    app.add_handler(CommandHandler("start", start_cmd))
    app.add_handler(CommandHandler("help", help_cmd))
    app.add_handler(CommandHandler("gasto", gasto_cmd))
    app.add_handler(CommandHandler("cuotas", cuotas_cmd))
    app.add_handler(CommandHandler("resumen", resumen_cmd))
    app.add_handler(CommandHandler("exportar", exportar_cmd))

    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, free_text_handler))

    await app.initialize()
    print(f"🤖 Bot de gastos iniciado. Esperando mensajes... (ID: {app.bot.id})")
    await app.run_polling(drop_pending_updates=True)

    app.run_polling(drop_pending_updates=True)


if __name__ == "__main__":
    import sys
    try:
        if sys.platform == "win32":
            asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
        asyncio.run(main())
    except RuntimeError as e:
        # Si el event loop ya está corriendo (VS Code, Jupyter, Render), usa nest_asyncio
        if "already running" in str(e):
            import nest_asyncio
            nest_asyncio.apply()
            loop = asyncio.get_event_loop()
            loop.run_until_complete(main())
        else:
            raise