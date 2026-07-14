import sqlite3
from datetime import datetime, timedelta

db_path = r'C:\Users\ostee\.local\share\mimocode\mimocode.db'
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

cutoff_ms = int((datetime.now() - timedelta(days=30)).timestamp() * 1000)

# Find repeated read patterns (reading same file multiple times)
print("=== Repeated Read Targets ===")
cursor.execute("""
    SELECT json_extract(p.data, '$.state.input') as inp, count(*) as n
    FROM message m
    JOIN part p ON p.message_id = m.id
    WHERE json_extract(m.data, '$.role') = 'assistant'
      AND json_extract(p.data, '$.type') = 'tool'
      AND json_extract(p.data, '$.tool') = 'read'
      AND m.time_created > ?
    GROUP BY inp
    HAVING n > 5
    ORDER BY n DESC
    LIMIT 15
""", (cutoff_ms,))
for row in cursor.fetchall():
    inp = str(row[0])[:150] if row[0] else "None"
    print(f"  {row[1]}x: {inp}")

# Find repeated write patterns
print("\n=== Repeated Write Targets ===")
cursor.execute("""
    SELECT json_extract(p.data, '$.state.input') as inp, count(*) as n
    FROM message m
    JOIN part p ON p.message_id = m.id
    WHERE json_extract(m.data, '$.role') = 'assistant'
      AND json_extract(p.data, '$.type') = 'tool'
      AND json_extract(p.data, '$.tool') = 'write'
      AND m.time_created > ?
    GROUP BY inp
    HAVING n > 3
    ORDER BY n DESC
    LIMIT 15
""", (cutoff_ms,))
for row in cursor.fetchall():
    inp = str(row[0])[:150] if row[0] else "None"
    print(f"  {row[1]}x: {inp}")

# Find task patterns
print("\n=== Task Summaries ===")
cursor.execute("""
    SELECT summary, count(*) as n
    FROM task
    WHERE created_at > ?
    GROUP BY summary
    HAVING n > 2
    ORDER BY n DESC
    LIMIT 15
""", (cutoff_ms,))
for row in cursor.fetchall():
    summary = str(row[0])[:120] if row[0] else "None"
    print(f"  {row[1]}x: {summary}")

# Find actor/subagent patterns
print("\n=== Actor Registry ===")
cursor.execute("""
    SELECT * FROM actor_registry LIMIT 10
""")
for row in cursor.fetchall():
    print(f"  {row}")

conn.close()
