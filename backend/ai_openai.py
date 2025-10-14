# FILE: ai_openai.py
import os
import openai
import json
from datetime import datetime

SYSTEM_PROMPT = """
Tu tarea es actuar como un servicio de extracción de datos. Analiza el texto del usuario sobre un gasto y devuelve SIEMPRE un objeto JSON con los siguientes campos: "amount" (number), "category" (string), "note" (string, opcional), "date" (string en formato YYYY-MM-DD), "payment_method" (string, opcional).

Reglas estrictas:
- Tu única salida debe ser el objeto JSON, sin texto adicional, explicaciones o markdown.
- Si no se especifica una fecha, usa la fecha de hoy. La fecha de hoy es: {today_iso}.
- Categorías válidas: comida, transporte, servicios, salud, ocio, educación, ropa, hogar, supermercado, tecnología, otros. Normaliza la categoría a una de estas.
- Medios de pago válidos: efectivo, débito, crédito, mercadopago, binance, transferencia, modo, otros. Normaliza a uno de estos.
- El monto debe ser un número sin símbolos. "15 mil" es 15000.
- Si no puedes determinar un campo, déjalo como null, pero siempre incluye todos los campos en el JSON.
"""

def ai_parse_expense_openai(text: str, today_iso: str):
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        return None, "La API Key de OpenAI no está configurada."

    openai.api_key = api_key

    try:
        prompt = SYSTEM_PROMPT.format(today_iso=today_iso)
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",  # o "gpt-4" si tienes acceso
            messages=[
                {"role": "system", "content": prompt},
                {"role": "user", "content": text}
            ],
            response_format={"type": "json_object"}
        )
        # La respuesta estará en response.choices[0].message.content como JSON
        parsed_json = json.loads(response.choices[0].message.content)
        if not parsed_json.get("amount") or not parsed_json.get("category"):
            return None, "La IA no pudo determinar el monto o la categoría."
        if "date" not in parsed_json or not parsed_json.get("date"):
            parsed_json["date"] = today_iso
        return parsed_json, None
    except Exception as e:
        print(f"Error en la llamada a OpenAI: {e}")
        return None, f"Error de IA: {e}"