import sqlite3
import json
from datetime import datetime, timedelta

db_path = r'C:\Users\ostee\.local\share\mimocode\mimocode.db'
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# List tables
cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
tables = [r[0] for r in cursor.fetchall()]
print("Tables:", tables)

# Get recent sessions (last 30 days)
cutoff = (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d')
print(f"\nRecent sessions (since {cutoff}):")
cursor.execute("""
    SELECT id, time_created, substr(data, 1, 200) 
    FROM session 
    WHERE time_created > ?
    ORDER BY time_created DESC 
    LIMIT 20
""", (cutoff,))
for row in cursor.fetchall():
    print(f"  {row[0]}: {row[1]} - {row[2][:100]}...")

# Find repeated tool usage
print("\nRepeated tool usage (last 30 days):")
cursor.execute("""
    SELECT json_extract(p.data, '$.tool') as tool,
           substr(json_extract(p.data, '$.state.input'), 1, 150) as input_preview,
           count(*) as n
    FROM message m
    JOIN part p ON p.message_id = m.id
    WHERE json_extract(m.data, '$.role') = 'assistant'
      AND json_extract(p.data, '$.type') = 'tool'
      AND m.time_created > ?
    GROUP BY tool, input_preview
    ORDER BY n DESC
    LIMIT 30
""", (cutoff,))
for row in cursor.fetchall():
    print(f"  {row[2]}x {row[0]}: {row[1]}")

# Find user messages with repeated keywords
print("\nUser messages with repeated patterns:")
cursor.execute("""
    SELECT m.id, m.time_created, substr(json_extract(m.data, '$.content'), 1, 200)
    FROM message m
    WHERE json_extract(m.data, '$.role') = 'user'
      AND m.time_created > ?
      AND (
        json_extract(m.data, '$.content') LIKE '%снова%' OR
        json_extract(m.data, '$.content') LIKE '%как обычно%' OR
        json_extract(m.data, '$.content') LIKE '%как в прошлый%' OR
        json_extract(m.data, '$.content') LIKE '%повтор%' OR
        json_extract(m.data, '$.content') LIKE '%again%' OR
        json_extract(m.data, '$.content') LIKE '%same as%' OR
        json_extract(m.data, '$.content') LIKE '%like last%' OR
        json_extract(m.data, '$.content') LIKE '%каждый раз%' OR
        json_extract(m.data, '$.content') LIKE '%всегда%'
      )
    ORDER BY m.time_created DESC
    LIMIT 20
""", (cutoff,))
for row in cursor.fetchall():
    print(f"  {row[0]}: {row[2][:150]}...")

conn.close()
