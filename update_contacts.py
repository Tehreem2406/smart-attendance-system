
import sqlite3
import os

db_path = r'c:\Users\hp\Desktop\BSCS-VII\smart-attendance-system\backend\fastapi_face_engine\attendance.db'

def update_contacts():
    if not os.path.exists(db_path):
        print(f"Database not found at {db_path}")
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    students = [
        ('Ansa', '+923228695486'),
        ('Zargull', '+923146968238')
    ]

    for username, contact in students:
        cursor.execute("UPDATE users SET parent_contact = ? WHERE username = ?", (contact, username))
        if cursor.rowcount > 0:
            print(f"Updated {username} with contact {contact}")
        else:
            print(f"User {username} not found or no change needed")

    conn.commit()
    conn.close()

if __name__ == "__main__":
    update_contacts()
