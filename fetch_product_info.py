"""
Fetch product images and prices from zepix.shop for the 27 valid products
Then insert them into the local SQLite database
"""
import sqlite3
import uuid
import time
import requests
from bs4 import BeautifulSoup
import re
import json
import os

# Product data: name -> final_download_link
PRODUCTS = [
    # (name, final_download_url, zepix_slug_hint)
    ("300+ Landing Pages Bundle", "https://drive.google.com/drive/folders/1uc-0v0oMqTu7rhdnXs9oGQie2s50zHQY", "300-landing-pages-bundle"),
    ("WaDefender", "https://drive.google.com/file/d/1i8dlsMnVXjslpMhbBdgr3qjxYsT2b4Md/view?usp=sharing", "wadefender"),
    ("WhatsApp Bulk Sender Software", "https://drive.google.com/drive/folders/1rk9pI7Fd0nUZGgXRTB41Q6GTyo3M4kHL?usp=sharing", "whatsapp-bulk-sender-software"),
    ("WhatsApp CRM Software", "https://zepix.shop/wp-content/uploads/woocommerce_uploads/2024/07/whatsapp-CRM-SOFTWARE-vov2wq.zip", "whatsapp-crm-software"),
    ("All Adobe Collection", "https://docs.google.com/document/d/1z0POCZ3N9M2dpvv-KC7A1fDn72vQ22KHtllo44AwGFE/edit?usp=sharing", "all-adobe-collection"),
    ("150,000+ Lightroom Presets", "https://drive.google.com/drive/folders/1TnwnDhugz0T351pGHnOxR1c41QmhkE-b", "150000-lightroom-presets"),
    ("1500 Logo Templates Bundle", "https://drive.google.com/drive/folders/11ahISDtA_LZ-S22O-DKkcy6JyUME_zuQ", "1500-logo-templates-bundle"),
    ("25,000 Vector Icons", "https://drive.google.com/drive/folders/1_Nj9LoyS5ZgBF-fs6J3UY6xLQNZ01sYt", "25000-vector-icons"),
    ("30,000 Royalty Stock Images", "http://www.mediafire.com/download/93si4n2661diik2/Part1.zip", "30000-royalty-stock-images"),
    ("30,000 Fonts Collection", "https://drive.google.com/drive/folders/1pVuqz0GODtaqIQg2Mri0C97W_JVjhNnT?usp=drive_link", "30000-fonts-collection"),
    ("3D Graphics Pack", "https://drive.google.com/file/d/1jET--zqMO5hnQ2-v01NMhvI84hZIaNot/view?usp=sharing", "3d-graphics-pack"),
    ("30K High-Converting DFY Promo Emails Bundle", "https://drive.google.com/file/d/1xWQKLb4G9Vv81oGQYvn22XNp7sSwi1Du/view?usp=sharing", "30k-high-converting-dfy-promo-emails-bundle"),
    ("6000+ Kids Worksheets (Printable)", "https://drive.google.com/file/d/1lY6A9F6DTqqG0N7tRVlkfvyYML4DOKx0", "6000-kids-worksheets-printable"),
    ("900+ Canva Ad Creative Bundle", "https://docs.google.com/document/d/1RGptnjXmHlHcM8mkWC75Le--wRnlxo0nyFkUVLSMnvU/edit?usp=sharing", "900-canva-ad-creative-bundle"),
    ("Graphic & Video Editing Bundle", "https://drive.google.com/drive/folders/1rqS9alDbsAqueG7L5i6ltNIBAKXn0BKl", "graphic-video-editing-bundle"),
    ("IIT, JEE & NEET Preparation Materials", "https://drive.google.com/drive/folders/1ipQpfq1s6flCn7sC_lEYzMvGTmsF6GfZ", "iit-jee-neet-preparation-materials"),
    ("Infographics Kit", "https://drive.google.com/drive/folders/1YIYPtLuKQFrYmWN6AlFF9-iuEo8nWgfa?usp=drive_link", "infographics-kit"),
    ("Microsoft Excel Shortcut Keys", "https://drive.google.com/file/d/1Gl2Mb3ctbJCu_vzR_Ue5B9X3CKxIIhSz/view?usp=sharing", "microsoft-excel-shortcut-keys"),
    ("Mobile Application Bundle", "https://drive.google.com/drive/folders/1y_czkyWnCbwfKfUfQQb3xDuaVvytrIHH", "mobile-application-bundle"),
    ("Movie Clipping Bundle", "https://drive.google.com/drive/folders/1mOTYdoy7KXvd-rqh7tJwtEL08v5ibt8j", "movie-clipping-bundle"),
    ("MS Office Kit Bundle", "https://drive.google.com/drive/folders/1DO3W8Dt-txUUsDeTl2LViFzaadO5waIb", "ms-office-kit-bundle"),
    ("Social Media Templates", "https://drive.google.com/drive/folders/1g3rQWtNzAb81mQ19aaB4e1U31SWa173k", "social-media-templates"),
    ("SVG Mega Bundle", "https://drive.google.com/drive/folders/137KPQ-vIpRr52lKKn-DDK_y1UOd8AOQ-", "svg-mega-bundle"),
    ("Trading Bundle Kit", "https://drive.google.com/drive/folders/1qIb6LeJXEWvXxHABwJW737bXq_nb1rtO", "trading-bundle-kit"),
    ("Video Editing Assets Bundle", "https://drive.google.com/drive/folders/1jgeRvkCCXqXzq4IyQphV6mp5Oy8kpWIk", "video-editing-assets-bundle"),
    ("Web Application Bundle", "https://docs.google.com/document/d/1q3nzry4t7NVJA8bfBZSXg-YQuoVaYtoa3e3-sDsAXQE/edit?usp=sharing", "web-application-bundle"),
    ("Wedding Bundle", "https://drive.google.com/file/d/10AmmY1RctuCLKUTn032LMmSSk4I0R9cP/view?usp=sharing", "wedding-bundle"),
]

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
}

def fetch_product_info(slug):
    """Try to fetch product page info from zepix.shop"""
    url = f"https://zepix.shop/product/{slug}/"
    try:
        resp = requests.get(url, headers=HEADERS, timeout=15, allow_redirects=True)
        if resp.status_code == 200:
            soup = BeautifulSoup(resp.text, 'html.parser')
            
            # Get price
            price = None
            price_el = soup.find('span', class_='woocommerce-Price-amount')
            if price_el:
                price_text = price_el.get_text(strip=True)
                # Remove currency symbols
                price_text = re.sub(r'[^\d.]', '', price_text)
                try:
                    price = float(price_text)
                except:
                    pass
            
            # Get image
            image_url = None
            # Try og:image meta tag first
            og_img = soup.find('meta', property='og:image')
            if og_img:
                image_url = og_img.get('content')
            
            # Fallback: product image
            if not image_url:
                img = soup.find('img', class_='wp-post-image')
                if img:
                    image_url = img.get('src') or img.get('data-src')
            
            return price, image_url, resp.url
        else:
            return None, None, f"HTTP {resp.status_code}"
    except Exception as e:
        return None, None, f"Error: {e}"

def make_slug(title, short_id):
    slug = title.lower()
    slug = re.sub(r'[^a-z0-9\s-]', '', slug)
    slug = slug.strip()
    slug = re.sub(r'\s+', '-', slug)
    slug = re.sub(r'-+', '-', slug)
    slug = slug[:80]
    return slug + '-' + short_id

# Connect to local SQLite database
DB_PATH = r"c:\Users\Perfect Elect\Downloads\grabnext-main\grabnext-main\data\grabnext.db"
conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()

# Check table columns
cursor.execute("PRAGMA table_info(products)")
cols = [row[1] for row in cursor.fetchall()]
print("Columns:", cols)

# Check existing products
cursor.execute("SELECT title FROM products")
existing = [row[0] for row in cursor.fetchall()]
print(f"Existing products: {len(existing)}")

results = []
for name, download_url, slug_hint in PRODUCTS:
    if name in existing:
        print(f"SKIP (already exists): {name}")
        continue
    
    print(f"\nFetching: {name}")
    price, image_url, status = fetch_product_info(slug_hint)
    print(f"  Price: {price}, Image: {image_url}, Status: {status}")
    
    results.append({
        'name': name,
        'slug_hint': slug_hint,
        'price': price,
        'image_url': image_url,
        'download_url': download_url,
        'status': status
    })
    time.sleep(1)

# Save results for review
with open(r'c:\Users\Perfect Elect\Downloads\grabnext-main\grabnext-main\product_fetch_results.json', 'w') as f:
    json.dump(results, f, indent=2)

print(f"\n\nFetched {len(results)} products")
print("Results saved to product_fetch_results.json")
conn.close()
