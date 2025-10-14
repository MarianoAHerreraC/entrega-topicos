import os
import psycopg2
from psycopg2.extras import DictCursor

# Render nos da esta variable de entorno con la dirección de la BD permanente
DATABASE_URL = os.getenv("DATABASE_URL")

def get_con():
    """Establece la conexión con la base de datos PostgreSQL en Render."""
    if not DATABASE_URL:
        raise ValueError("No se encontró la variable de entorno DATABASE_URL")
    con = psycopg2.connect(DATABASE_URL)
    con.cursor_factory = DictCursor
    return con

def init_db():
    """Inicializa la tabla de gastos si no existe."""
    with get_con() as con:
        with con.cursor() as cur:
            cur.execute("""
                CREATE TABLE IF NOT EXISTS expenses (
                    id SERIAL PRIMARY KEY,
                    user_id TEXT NOT NULL,
                    ts TIMESTAMPTZ NOT NULL,
                    amount NUMERIC(10, 2) NOT NULL,
                    currency TEXT DEFAULT 'ARS',
                    category TEXT NOT NULL,
                    note TEXT,
                    raw_msg TEXT,
                    payment_method TEXT,
                    installment_plan_id TEXT,
                    installment_details TEXT
                );
            """)
        con.commit()

def insert_expense(**kwargs):
    """Inserta un nuevo gasto en la base de datos."""
    with get_con() as con:
        with con.cursor() as cur:
            cur.execute("""
                INSERT INTO expenses (user_id, ts, amount, currency, category, note, raw_msg, payment_method, installment_plan_id, installment_details)
                VALUES (%(user_id)s, %(ts)s, %(amount)s, %(currency)s, %(category)s, %(note)s, %(raw_msg)s, %(payment_method)s, %(installment_plan_id)s, %(installment_details)s)
            """, kwargs)
        con.commit()
def insert_expense(user_id, ts, amount, currency, category, note, raw_msg, 
                   payment_method=None, installment_plan_id=None, installment_details=None):
    with get_con() as con:
        con.execute(
            "INSERT INTO expenses (user_id, ts, amount, currency, category, note, raw_msg, payment_method, installment_plan_id, installment_details) "
            "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            (user_id, ts, amount, currency, category, note, raw_msg, 
             payment_method, installment_plan_id, installment_details)
        )

def delete_expense(expense_id: int):
    with get_con() as con:
        con.execute("DELETE FROM expenses WHERE id = ?", (expense_id,))

def sum_by_period(user_id, start_date, end_date):
    with get_con() as con:
        cur = con.execute(
            "SELECT SUM(amount) FROM expenses WHERE user_id = ? AND ts BETWEEN ? AND ?",
            (user_id, start_date, end_date)
        )
        result = cur.fetchone()[0]
        return result or 0.0

def top_categories(user_id, start_date, end_date, limit=3):
    with get_con() as con:
        cur = con.execute(
            "SELECT category, SUM(amount) as total "
            "FROM expenses WHERE user_id = ? AND ts BETWEEN ? AND ? "
            "GROUP BY category ORDER BY total DESC LIMIT ?",
            (user_id, start_date, end_date, limit)
        )
        return cur.fetchall()

def iter_by_period(user_id, start_date, end_date):
    with get_con() as con:
        return con.execute(
            "SELECT * FROM expenses WHERE user_id = ? AND ts BETWEEN ? AND ? ORDER BY ts DESC",
            (user_id, start_date, end_date)
        )