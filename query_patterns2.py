import sqlite3
import json
from datetime import datetime, timedelta

db_path = r'C:\Users\ostee\.local\share\mimocode\mimocode.db'
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

cutoff_ms = int((datetime.now() - timedelta(days=30)).timestamp() * 1000)

# Find repeated bash commands (potential workflows)
print("=== Repeated Bash Commands ===")
cursor.execute("""
    SELECT json_extract(p.data, '$.state.input') as cmd, count(*) as n
    FROM message m
    JOIN part p ON p.message_id = m.id
    WHERE json_extract(m.data, '$.role') = 'assistant'
      AND json_extract(p.data, '$.type') = 'tool'
      AND json_extract(p.data, '$.tool') = 'bash'
      AND m.time_created > ?
    GROUP BY cmd
    HAVING n > 2
    ORDER BY n DESC
    LIMIT 25
""", (cutoff_ms,))
for row in cursor.fetchall():
    cmd = str(row[0])[:150] if row[0] else "None"
    print(f"  {row[1]}x: {cmd}")

# Find repeated edit patterns (same file edited multiple times)
print("\n=== Repeated Edit Targets ===")
cursor.execute("""
    SELECT json_extract(p.data, '$.state.input') as inp, count(*) as n
    FROM message m
    JOIN part p ON p.message_id = m.id
    WHERE json_extract(m.data, '$.role') = 'assistant'
      AND json_extract(p.data, '$.type') = 'tool'
      AND json_extract(p.data, '$.tool') = 'edit'
      AND m.time_created > ?
    GROUP BY inp
    HAVING n > 3
    ORDER BY n DESC
    LIMIT 20
""", (cutoff_ms,))
for row in cursor.fetchall():
    inp = str(row[0])[:150] if row[0] else "None"
    print(f"  {row[1]}x: {inp}")

# Find user requests that are repeated (exact or near-exact)
print("\n=== Repeated User Requests ===")
cursor.execute("""
    SELECT substr(json_extract(m.data, '$.content'), 1, 150) as msg, count(*) as n
    FROM message m
    WHERE json_extract(m.data, '$.role') = 'user'
      AND m.time_created > ?
      AND json_extract(m.data, '$.content') IS NOT NULL
    GROUP BY msg
    HAVING n > 1
    ORDER BY n DESC
    LIMIT 15
""", (cutoff_ms,))
for row in cursor.fetchall():
    msg = str(row[0])[:120] if row[0] else "None"
    print(f"  {row[1]}x: {msg}")

# Find repeated grep patterns (searching for same thing)
print("\n=== Repeated Grep Searches ===")
cursor.execute("""
    SELECT json_extract(p.data, '$.state.input') as inp, count(*) as n
    FROM message m
    JOIN part p ON p.message_id = m.id
    WHERE json_extract(m.data, '$.role') = 'assistant'
      AND json_extract(p.data, '$.type') = 'tool'
      AND json_extract(p.data, '$.tool') = 'grep'
      AND m.time_created > ?
    GROUP BY inp
    HAVING n > 2
    ORDER BY n DESC
    LIMIT 15
""", (cutoff_ms,))
for row in cursor.fetchall():
    inp = str(row[0])[:150] if row[0] else "None"
    print(f"  {row[1]}x: {inp}")

# Find sessions with specific project directories
print("\n=== Sessions by Directory ===")
cursor.execute("""
    SELECT directory, count(*) as n
    FROM session
    WHERE time_created > ? AND parent_id IS NULL
    GROUP BY directory
    ORDER BY n DESC
    LIMIT 10
""", (cutoff_ms,))
for row in cursor.fetchall():
    print(f"  {row[1]}x: {row[0]}")

conn.close()
