import sqlite3
import json
from datetime import datetime, timedelta

db_path = r'C:\Users\ostee\.local\share\mimocode\mimocode.db'
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Get recent sessions (last 30 days)
cutoff_ms = int((datetime.now() - timedelta(days=30)).timestamp() * 1000)
print(f"Analyzing sessions since {datetime.fromtimestamp(cutoff_ms/1000).strftime('%Y-%m-%d')}")

# Count sessions in period
cursor.execute("SELECT COUNT(*) FROM session WHERE time_created > ?", (cutoff_ms,))
session_count = cursor.fetchone()[0]
print(f"Total sessions in period: {session_count}")

# Get session titles to understand work types
print("\n=== Session Titles (recent) ===")
cursor.execute("""
    SELECT id, title, time_created 
    FROM session 
    WHERE time_created > ? AND parent_id IS NULL
    ORDER BY time_created DESC 
    LIMIT 30
""", (cutoff_ms,))
for row in cursor.fetchall():
    dt = datetime.fromtimestamp(row[2]/1000).strftime('%m-%d %H:%M')
    print(f"  {dt} [{row[0][:20]}...] {row[1][:80]}")

# Find repeated tool usage patterns
print("\n=== Repeated Tool Usage (last 30 days) ===")
cursor.execute("""
    SELECT json_extract(p.data, '$.tool') as tool,
           count(*) as n
    FROM message m
    JOIN part p ON p.message_id = m.id
    WHERE json_extract(m.data, '$.role') = 'assistant'
      AND json_extract(p.data, '$.type') = 'tool'
      AND m.time_created > ?
    GROUP BY tool
    ORDER BY n DESC
    LIMIT 20
""", (cutoff_ms,))
for row in cursor.fetchall():
    print(f"  {row[1]}x {row[0]}")

# Find repeated user message patterns
print("\n=== User Message Patterns ===")
cursor.execute("""
    SELECT substr(json_extract(m.data, '$.content'), 1, 200) as msg, count(*) as n
    FROM message m
    WHERE json_extract(m.data, '$.role') = 'user'
      AND m.time_created > ?
    GROUP BY msg
    HAVING n > 1
    ORDER BY n DESC
    LIMIT 15
""", (cutoff_ms,))
for row in cursor.fetchall():
    print(f"  {row[1]}x: {row[0][:120]}...")

# Find repeated file paths in tool calls
print("\n=== Repeated File Paths ===")
cursor.execute("""
    SELECT json_extract(p.data, '$.state.input') as inp, count(*) as n
    FROM message m
    JOIN part p ON p.message_id = m.id
    WHERE json_extract(m.data, '$.role') = 'assistant'
      AND json_extract(p.data, '$.type') = 'tool'
      AND json_extract(p.data, '$.tool') = 'edit'
      AND m.time_created > ?
    GROUP BY inp
    ORDER BY n DESC
    LIMIT 15
""", (cutoff_ms,))
for row in cursor.fetchall():
    print(f"  {row[1]}x: {str(row[0])[:150]}")

conn.close()
