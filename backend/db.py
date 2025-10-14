import psycopg2
import os

def get_con():
    return psycopg2.connect(os.getenv("DATABASE_URL"))

def init_db():
    with get_con() as con:
        cur = con.cursor()
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS expenses (
                id SERIAL PRIMARY KEY,
                user_id TEXT NOT NULL,
                ts TEXT NOT NULL,
                amount REAL NOT NULL,
                currency TEXT NOT NULL,
                category TEXT NOT NULL,
                note TEXT,
                raw_msg TEXT,
                payment_method TEXT,
                installment_plan_id TEXT,
                installment_details TEXT
            )
            """
        )
        con.commit()
        cur.close()

def insert_expense(user_id, ts, amount, currency, category, note, raw_msg, 
                   payment_method=None, installment_plan_id=None, installment_details=None):
    with get_con() as con:
        cur = con.cursor()
        cur.execute(
            "INSERT INTO expenses (user_id, ts, amount, currency, category, note, raw_msg, payment_method, installment_plan_id, installment_details) "
            "VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)",
            (user_id, ts, amount, currency, category, note, raw_msg, 
             payment_method, installment_plan_id, installment_details)
        )
        con.commit()
        cur.close()

def delete_expense(expense_id: int):
    with get_con() as con:
        cur = con.cursor()
        cur.execute("DELETE FROM expenses WHERE id = %s", (expense_id,))
        con.commit()
        cur.close()

def sum_by_period(user_id, start_date, end_date):
    with get_con() as con:
        cur = con.cursor()
        cur.execute(
            "SELECT SUM(amount) FROM expenses WHERE user_id = %s AND ts BETWEEN %s AND %s",
            (user_id, start_date, end_date)
        )
        result = cur.fetchone()[0]
        cur.close()
        return result or 0.0

def top_categories(user_id, start_date, end_date, limit=3):
    with get_con() as con:
        cur = con.cursor()
        cur.execute(
            "SELECT category, SUM(amount) as total "
            "FROM expenses WHERE user_id = %s AND ts BETWEEN %s AND %s "
            "GROUP BY category ORDER BY total DESC LIMIT %s",
            (user_id, start_date, end_date, limit)
        )
        result = cur.fetchall()
        cur.close()
        return result

def iter_by_period(user_id, start_date, end_date):
    with get_con() as con:
        cur = con.cursor()
        cur.execute(
            "SELECT * FROM expenses WHERE user_id = %s AND ts BETWEEN %s AND %s ORDER BY ts DESC",
            (user_id, start_date, end_date)
        )
        result = cur.fetchall()
        cur.close()
        return result