# FILE: parser.py (VERSIÓN FINAL CON TILDES Y ALIAS)
from datetime import datetime
import re

# Ampliamos la lista para incluir variantes con y sin tilde, y alias comunes como "mp"
PAYMENT_METHODS = [
    "efectivo", 
    "crédito", "credito", 
    "débito", "debito", 
    "mercadopago", "mp",
    "modo", 
    "transferencia", 
    "binance"
]

def parse_gasto_args(text: str, today_iso: str):
    print("--- EJECUTANDO PARSER v4 (con tildes) ---") 

    # 1. Extraer y quitar la nota (texto entre comillas)
    note = None
    note_match = re.search(r'["“](.*?)["”]', text)
    if note_match:
        note = note_match.group(1).strip()
        text = text.replace(note_match.group(0), "", 1).strip()

    # 2. Extraer y quitar el método de pago
    payment_method = None
    text_lower_for_search = text.lower()
    for method in PAYMENT_METHODS:
        if re.search(r'\b' + re.escape(method) + r'\b', text_lower_for_search):
            # Normalizamos al nombre sin tilde para consistencia
            if method == "crédito": payment_method = "credito"
            elif method == "débito": payment_method = "debito"
            else: payment_method = method

            text = re.sub(r'\b' + re.escape(method) + r'\b', '', text, flags=re.IGNORECASE).strip()
            break

    parts = text.split()
    if not parts:
        return None, "Faltan argumentos. Usá: /gasto <monto> <categoría> [...]"

    # 3. Extraer el monto
    try:
        amount_str = parts.pop(0).replace(",", ".")
        amount = float(amount_str)
    except (ValueError, IndexError):
        return None, "No se pudo encontrar el monto."

    # 4. Lo que queda es la categoría y (opcionalmente) la fecha
    remaining_text = " ".join(parts)
    date_str = None
    category = remaining_text

    date_match = re.search(r'(\d{4}-\d{2}-\d{2})$', remaining_text)
    if date_match:
        date_str = date_match.group(1)
        category = remaining_text.replace(date_str, "").strip()

    ts = today_iso
    if date_str:
        try:
            ts = datetime.strptime(date_str, "%Y-%m-%d").date().isoformat()
        except ValueError:
            pass

    if not category:
        return None, "Falta la categoría después del monto."

    return {
        "amount": amount,
        "category": category.lower().strip(),
        "note": note,
        "date": ts,
        "currency": "ARS",
        "payment_method": payment_method
    }, None