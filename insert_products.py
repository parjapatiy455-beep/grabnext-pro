"""
Final insertion script: Insert all 27 products into SQLite database
Handles 404 products with alternate slug search
"""
import sqlite3
import uuid
import time
import json
import re
import requests
from bs4 import BeautifulSoup

DB_PATH = r"c:\Users\Perfect Elect\Downloads\grabnext-main\grabnext-main\data\grabnext.db"
RESULTS_PATH = r"c:\Users\Perfect Elect\Downloads\grabnext-main\grabnext-main\product_fetch_results.json"

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
}

# Alternate slugs for 404 products
ALTERNATE_SLUGS = {
    "150,000+ Lightroom Presets": ["150000-lightroom-presets-bundle", "lightroom-presets", "150-000-lightroom-presets"],
    "25,000 Vector Icons": ["25000-vector-icons-bundle", "vector-icons", "25-000-vector-icons"],
    "30,000 Fonts Collection": ["30000-fonts-collection-bundle", "fonts-collection", "30-000-fonts-collection"],
    "Video Editing Assets Bundle": ["video-editing-bundle", "video-editing-assets", "video-assets-bundle"],
}

# Fallback data for products that can't be found on website
FALLBACK_DATA = {
    "150,000+ Lightroom Presets": {
        "price": 2499.0,
        "image_url": "https://zepix.shop/wp-content/uploads/2024/04/35.png"
    },
    "25,000 Vector Icons": {
        "price": 1999.0,
        "image_url": "https://zepix.shop/wp-content/uploads/2024/04/36.png"
    },
    "30,000 Fonts Collection": {
        "price": 1999.0,
        "image_url": "https://zepix.shop/wp-content/uploads/2024/04/37.png"
    },
    "Video Editing Assets Bundle": {
        "price": 2999.0,
        "image_url": "https://zepix.shop/wp-content/uploads/2024/04/28.png"
    },
}

def fetch_product_page(slug):
    url = f"https://zepix.shop/product/{slug}/"
    try:
        resp = requests.get(url, headers=HEADERS, timeout=15, allow_redirects=True)
        if resp.status_code == 200:
            soup = BeautifulSoup(resp.text, 'html.parser')
            price = None
            price_el = soup.find('span', class_='woocommerce-Price-amount')
            if price_el:
                price_text = re.sub(r'[^\d.]', '', price_el.get_text(strip=True))
                try:
                    price = float(price_text)
                except:
                    pass
            image_url = None
            og_img = soup.find('meta', property='og:image')
            if og_img:
                image_url = og_img.get('content')
            if not image_url:
                img = soup.find('img', class_='wp-post-image')
                if img:
                    image_url = img.get('src') or img.get('data-src')
            return price, image_url
    except:
        pass
    return None, None

def make_slug(title, short_id):
    slug = re.sub(r'[^a-z0-9\s-]', '', title.lower()).strip()
    slug = re.sub(r'\s+', '-', slug)
    slug = re.sub(r'-+', '-', slug)[:80]
    return slug + '-' + short_id

# Load fetch results
with open(RESULTS_PATH, 'r') as f:
    results = json.load(f)

# Fix 404 products with alternate slugs
for product in results:
    name = product['name']
    if product['price'] is None or product['image_url'] is None:
        print(f"\nFixing 404 product: {name}")
        fixed = False
        if name in ALTERNATE_SLUGS:
            for alt_slug in ALTERNATE_SLUGS[name]:
                print(f"  Trying: {alt_slug}")
                p, img = fetch_product_page(alt_slug)
                if p and img:
                    product['price'] = p
                    product['image_url'] = img
                    print(f"  Found! Price: {p}, Image: {img[:60]}")
                    fixed = True
                    break
                time.sleep(0.5)
        if not fixed and name in FALLBACK_DATA:
            fb = FALLBACK_DATA[name]
            product['price'] = product['price'] or fb['price']
            product['image_url'] = product['image_url'] or fb['image_url']
            print(f"  Using fallback: Price={product['price']}, Image={product['image_url'][:60]}")

# Connect to DB
conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()

# Get existing product titles
cursor.execute("SELECT title FROM products")
existing_titles = set(row[0] for row in cursor.fetchall())
print(f"\nExisting products in DB: {len(existing_titles)}")

# Check available columns
cursor.execute("PRAGMA table_info(products)")
cols = [row[1] for row in cursor.fetchall()]
has_slug = 'slug' in cols
has_images = 'images' in cols
has_original_price = 'originalPrice' in cols
has_page_type = 'pageType' in cols
print(f"DB columns: {cols}")

inserted = 0
skipped = 0

for product in results:
    name = product['name']
    
    if name in existing_titles:
        print(f"SKIP (exists): {name}")
        skipped += 1
        continue
    
    prod_id = str(uuid.uuid4())
    short_id = prod_id[:6]
    now = int(time.time() * 1000)
    
    price = product['price'] or 999.0
    image_url = product['image_url'] or ''
    download_url = product['download_url']
    
    # Build insert based on available columns
    if has_slug and has_images and has_original_price and has_page_type:
        slug = make_slug(name, short_id)
        images = json.dumps([image_url]) if image_url else '[]'
        cursor.execute(
            """INSERT INTO products (id, title, description, price, originalPrice, category, tags, imageUrl, images, slug, downloadUrl, isActive, salesCount, pageCode, pageType, createdBy, createdAt, updatedAt)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            [prod_id, name, f"Premium digital product bundle: {name}", price, None,
             'digital', json.dumps(['digital', 'bundle']), image_url, images, slug,
             download_url, 1, 0, None, 'shop', 'admin', now, now]
        )
    else:
        cursor.execute(
            """INSERT INTO products (id, title, description, price, category, tags, imageUrl, downloadUrl, isActive, salesCount, createdBy, createdAt, updatedAt)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            [prod_id, name, f"Premium digital product bundle: {name}", price,
             'digital', json.dumps(['digital', 'bundle']), image_url,
             download_url, 1, 0, 'admin', now, now]
        )
    
    conn.commit()
    inserted += 1
    print(f"✅ Inserted: {name} | Price: ₹{price} | Image: {'YES' if image_url else 'NO'}")

print(f"\n{'='*50}")
print(f"DONE! Inserted: {inserted} | Skipped (already exists): {skipped}")
cursor.execute("SELECT COUNT(*) FROM products")
total = cursor.fetchone()[0]
print(f"Total products in DB now: {total}")
conn.close()
