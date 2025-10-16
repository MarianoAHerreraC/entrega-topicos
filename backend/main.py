import nest_asyncio
nest_asyncio.apply() # <-- ESTE ES EL ARREGLO PRINCIPAL

import requests
import os
from dotenv import load_dotenv
load_dotenv()
import re
import uuid
from datetime import datetime, timedelta
import pytz
import asyncio

from telegram.ext import (
    Application,
    CommandHandler,
    ContextTypes,
    MessageHandler,
    filters,
)
from dateutil.relativedelta import relativedelta

# El bot ya no necesita llamar a init_db() directamente.
# El servidor web (webapp.py) se encarga de esto al arrancar.
from parser import parse_gasto_args

# -------------------------------------------------
# Configuración
# -------------------------------------------------
TOKEN = os.getenv("TELEGRAM_TOKEN")
# La URL de tu API en Render es la única fuente de verdad
API_URL = "https://entrega-topicos-backend.onrender.com"
print("TOKEN:", TOKEN)
BA_TZ = pytz.timezone("America/Argentina/Buenos_Aires")

HELP_TEXT = ("📒 *Gastos Bot*\n\n"
             "Comandos:\n"
             "• /gasto <monto> <cat> \"nota\" [fecha] [medio_pago]\n"
             "• /cuotas <total> <N> <cat> \"descripción\"\n"
             "  Ej: /cuotas 120000 12 hogar \"tele nueva\"\n"
             "• /resumen semana | mes\n"
             "• /exportar\n"
             "• /help\n")

# ... (Las funciones de period_week y period_month no necesitan cambios) ...
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
    text = " ".join(context.args) if context.args else (update.message.text or "")
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
    
    # El bot envía el gasto a la API de Render
    response = requests.post(f"{API_URL}/api/expenses", json=expense_data)

    if response.status_code != 200:
        # Mostrar el error exacto que devuelve la API (si es JSON, mostrar el detalle)
        try:
            error_detail = response.json().get("detail", response.text)
        except Exception:
            error_detail = response.text
        await update.message.reply_text(f"❌ Error al registrar el gasto en la API: {error_detail}")
        return

    formatted_date = datetime.fromisoformat(full_timestamp).strftime("%d/%m/%Y %H:%M")

    msg = f"✅ Registrado: ${amount:.2f} en *{category}* ({formatted_date})."
    await update.message.reply_text(msg, parse_mode="Markdown")


async def cuotas_cmd(update, context: ContextTypes.DEFAULT_TYPE):
    try:
        args = context.args
        monto_total = float(args[0])
        cantidad_cuotas = int(args[1])
        categoria = args[2]
        descripcion_match = re.search(r'["“](.*?)["”]', " ".join(args))
        descripcion = descripcion_match.group(1) if descripcion_match else categoria
    except (IndexError, ValueError):
        await update.message.reply_text("Formato incorrecto. Usá: /cuotas <total> <N> <cat> \"descripción\"")
        return

    monto_por_cuota = monto_total / cantidad_cuotas
    plan_id = str(uuid.uuid4())
    fecha_inicio = datetime.now(BA_TZ)

    for i in range(cantidad_cuotas):
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
        requests.post(f"{API_URL}/api/expenses", json=expense_data)

    await update.message.reply_text(f"✅ ¡Plan de {cantidad_cuotas} cuotas registrado!")


async def resumen_cmd(update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text("Función de resumen en desarrollo para la versión API.")


async def exportar_cmd(update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text("Función de exportar en desarrollo para la versión API.")


async def free_text_handler(update, context: ContextTypes.DEFAULT_TYPE):
    if update.effective_chat.type != "private": return
    await gasto_cmd(update, context)

# -------------------------------------------------
# Arranque del Bot
# -------------------------------------------------

async def main():
    if not TOKEN:
        print("⚠️ No se encontró la variable de entorno TELEGRAM_TOKEN.")
        return

    app = Application.builder().token(TOKEN).build()
    
    app.add_handler(CommandHandler("start", start_cmd))
    app.add_handler(CommandHandler("help", help_cmd))
    app.add_handler(CommandHandler("gasto", gasto_cmd))
    app.add_handler(CommandHandler("cuotas", cuotas_cmd))
    app.add_handler(CommandHandler("resumen", resumen_cmd))
    app.add_handler(CommandHandler("exportar", exportar_cmd))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, free_text_handler))

    print("🤖 Bot de gastos iniciando...")
    await app.run_polling(drop_pending_updates=True)


if __name__ == "__main__":
    asyncio.run(main())

