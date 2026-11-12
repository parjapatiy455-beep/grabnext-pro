import os
import urllib.request
import json
import re

os.makedirs('product_images', exist_ok=True)

headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'}

with open('scraped_grabnext.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Extract products from the JSON inside HTML
# Look for product objects
img_urls = re.findall(r'https://ufy1gchwd7dz6awt\.public\.blob\.vercel-storage\.com/products/[a-zA-Z0-9_\-\.]+', html)
unique_imgs = sorted(list(set(img_urls)))

print(f"Found {len(unique_imgs)} unique product images on grabnext.pages.dev")

for url in unique_imgs:
    fname = os.path.basename(url)
    out_path = os.path.join('product_images', fname)
    if not os.path.exists(out_path):
        print(f"Downloading: {fname}...")
        try:
            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req) as resp, open(out_path, 'wb') as out_f:
                out_f.write(resp.read())
            print(f"Saved: {fname} ({os.path.getsize(out_path)} bytes)")
        except Exception as e:
            print(f"Failed {url}: {e}")
    else:
        print(f"Already exists: {fname}")

# Also copy/check local hero bundle images
print("Done downloading product images!")
