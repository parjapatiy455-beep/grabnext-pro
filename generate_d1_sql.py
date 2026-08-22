"""
Generate SQL INSERT statements for Cloudflare D1 remote database
"""
import sqlite3
import json

DB_PATH = r"c:\Users\Perfect Elect\Downloads\grabnext-main\grabnext-main\data\grabnext.db"

conn = sqlite3.connect(DB_PATH)
conn.row_factory = sqlite3.Row
cursor = conn.cursor()

# Get the 27 newly inserted products (they have no slug/images columns as those don't exist locally)
# Get all products ordered by createdAt - the newest 27 are our new ones
cursor.execute("""
    SELECT id, title, description, price, category, tags, imageUrl, downloadUrl, 
           isActive, salesCount, pageCode, createdBy, createdAt, updatedAt
    FROM products 
    ORDER BY createdAt DESC 
    LIMIT 27
""")

rows = cursor.fetchall()
conn.close()

import re, time

def make_slug(title, short_id):
    slug = re.sub(r'[^a-z0-9\s-]', '', title.lower()).strip()
    slug = re.sub(r'\s+', '-', slug)
    slug = re.sub(r'-+', '-', slug)[:80]
    return slug + '-' + short_id

sql_lines = []
for row in rows:
    r = dict(row)
    slug = make_slug(r['title'], r['id'][:6])
    images = json.dumps([r['imageUrl']]) if r['imageUrl'] else '[]'
    tags = r['tags'] or '[]'
    desc = (r['description'] or '').replace("'", "''")
    title = r['title'].replace("'", "''")
    image = (r['imageUrl'] or '').replace("'", "''")
    download = (r['downloadUrl'] or '').replace("'", "''")
    page_code = 'NULL'
    created_by = (r['createdBy'] or 'admin').replace("'", "''")
    
    sql = f"""INSERT OR IGNORE INTO products (id, title, description, price, originalPrice, category, tags, imageUrl, images, slug, downloadUrl, isActive, salesCount, pageCode, pageType, createdBy, createdAt, updatedAt) VALUES ('{r["id"]}', '{title}', '{desc}', {r["price"]}, NULL, '{r["category"]}', '{tags}', '{image}', '{images}', '{slug}', '{download}', {r["isActive"]}, {r["salesCount"]}, {page_code}, 'shop', '{created_by}', {r["createdAt"]}, {r["updatedAt"]});"""
    sql_lines.append(sql)

output_sql = '\n'.join(sql_lines)

with open(r"c:\Users\Perfect Elect\Downloads\grabnext-main\grabnext-main\insert_products_d1.sql", 'w', encoding='utf-8') as f:
    f.write(output_sql)

print(f"Generated {len(sql_lines)} INSERT statements")
print("Saved to insert_products_d1.sql")
print("\nFirst statement preview:")
print(sql_lines[0][:200] + "..." if sql_lines else "No statements")
