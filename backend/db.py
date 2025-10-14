# FILE: db.py (VERSIÓN CON SOPORTE PARA CUOTAS)
import sqlite3

DB_FILE = "expenses.db"

def get_con():
    con = sqlite3.connect(DB_FILE)
    con.row_factory = sqlite3.Row
    return con

def init_db():
    with get_con() as con:
        con.execute(
            """
            CREATE TABLE IF NOT EXISTS expenses (
                id INTEGER PRIMARY KEY,
                user_id TEXT NOT NULL,
                ts TEXT NOT NULL,
                amount REAL NOT NULL,
                currency TEXT NOT NULL,
                category TEXT NOT NULL,
                note TEXT,
                raw_msg TEXT
            )
            """
        )
        try:
            con.execute("ALTER TABLE expenses ADD COLUMN payment_method TEXT")
        except sqlite3.OperationalError:
            pass

        # --- NUEVO: AÑADIMOS COLUMNAS PARA CUOTAS ---
        try:
            con.execute("ALTER TABLE expenses ADD COLUMN installment_plan_id TEXT")
            con.execute("ALTER TABLE expenses ADD COLUMN installment_details TEXT")
        except sqlite3.OperationalError:
            # Las columnas ya existen
            pass

# --- NUEVO: AÑADIMOS PARÁMETROS PARA CUOTAS ---
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