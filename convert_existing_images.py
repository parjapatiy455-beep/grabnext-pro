"""
Script: convert_existing_images.py
Purpose: Download and convert any remaining .png images in the database to .webp,
         and generate SQL updates for Cloudflare D1 / SQLite.
"""

import os
import sqlite3
import urllib.request
import re
from PIL import Image

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "data", "grabnext.db")
PUBLIC_UPLOADS_DIR = os.path.join(BASE_DIR, "public", "uploads")
os.makedirs(PUBLIC_UPLOADS_DIR, exist_ok=True)

def convert_url_or_file_to_webp(image_url, save_filename):
    """
    Downloads image_url if remote, or opens local file,
    converts to WebP, and saves in public/uploads/
    """
    dest_path = os.path.join(PUBLIC_UPLOADS_DIR, save_filename + ".webp")
    temp_download = os.path.join(PUBLIC_UPLOADS_DIR, "temp_" + save_filename)
    
    try:
        if image_url.startswith("http://") or image_url.startswith("https://"):
            req = urllib.request.Request(image_url, headers={"User-Agent": "Mozilla/5.0"})
            with urllib.request.urlopen(req, timeout=15) as response, open(temp_download, "wb") as out:
                out.write(response.read())
            img_source = temp_download
        else:
            img_source = os.path.join(BASE_DIR, "public", image_url.lstrip("/"))

        if not os.path.exists(img_source):
            return None

        with Image.open(img_source) as img:
            rgb_img = img.convert("RGBA")
            rgb_img.save(dest_path, "WEBP", quality=85, method=4)
        
        if os.path.exists(temp_download):
            os.remove(temp_download)
            
        rel_url = f"/uploads/{save_filename}.webp"
        return rel_url
    except Exception as e:
        print(f"Error processing {image_url}: {e}")
        if os.path.exists(temp_download):
            os.remove(temp_download)
        return None

def main():
    if not os.path.exists(DB_PATH):
        print(f"Database not found at {DB_PATH}")
        return

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    sql_updates = []

    # Check products
    cursor.execute("SELECT id, title, imageUrl FROM products WHERE imageUrl LIKE '%.png%' OR imageUrl LIKE '%.jpg%'")
    products = cursor.fetchall()
    print(f"Found {len(products)} products with non-webp images in local db.")

    # Check banners if table exists
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='banners'")
    has_banners = cursor.fetchone()
    if has_banners:
        cursor.execute("SELECT id, title, imageUrl FROM banners WHERE imageUrl LIKE '%.png%' OR imageUrl LIKE '%.jpg%'")
        banners = cursor.fetchall()
        print(f"Found {len(banners)} banners with non-webp images.")
    
    conn.close()

if __name__ == "__main__":
    main()
