# FILE: ai.py (VERSIÓN FINAL CON MODELO CORREGIDO)
import os
import json
import google.generativeai as genai

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

def ai_parse_expense(text: str, today_iso: str):
    """
    Usa Google Gemini con modo JSON para un parseo confiable.
    """
    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key:
        return None, "La API Key de Google no está configurada."

    try:
        genai.configure(api_key=api_key)

        # CORRECCIÓN: Usamos el modelo 'gemini-pro' que es de disponibilidad general
        model = genai.GenerativeModel(
            'gemini-pro',
            generation_config={"response_mime_type": "application/json"}
        )

        full_prompt = SYSTEM_PROMPT.format(today_iso=today_iso) + "\n\nTexto del usuario a analizar: " + text

        response = model.generate_content(full_prompt)

        parsed_json = json.loads(response.text)

        if not parsed_json.get("amount") or not parsed_json.get("category"):
            return None, "La IA no pudo determinar el monto o la categoría."

        if "date" not in parsed_json or not parsed_json.get("date"):
            parsed_json["date"] = today_iso

        return parsed_json, None

    except Exception as e:
        print(f"Error en la llamada a Gemini: {e}")
        return None, f"Error de IA: {e}"