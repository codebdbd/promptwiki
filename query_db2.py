import sqlite3

db_path = r'C:\Users\ostee\.local\share\mimocode\mimocode.db'
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Check schema of key tables
for table in ['session', 'message', 'part', 'task']:
    print(f"\n=== {table} schema ===")
    cursor.execute(f"PRAGMA table_info({table})")
    for row in cursor.fetchall():
        print(f"  {row[1]}: {row[2]}")

# Sample session data
print("\n=== Sample session ===")
cursor.execute("SELECT * FROM session LIMIT 2")
for row in cursor.fetchall():
    print(row)

# Sample message data
print("\n=== Sample message ===")
cursor.execute("SELECT * FROM message LIMIT 2")
for row in cursor.fetchall():
    print(row)

# Sample part data
print("\n=== Sample part ===")
cursor.execute("SELECT * FROM part LIMIT 2")
for row in cursor.fetchall():
    print(row)

conn.close()
