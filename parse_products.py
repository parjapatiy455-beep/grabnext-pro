import re
import json

with open('scraped_grabnext.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Check for Next.js __NEXT_DATA__
m = re.search(r'<script id="__NEXT_DATA__"[^>]*>(.*?)</script>', html)
if m:
    data = json.loads(m.group(1))
    print('Found NEXT_DATA keys:', list(data.keys()))
    pp = data.get('props', {}).get('pageProps', {})
    print('pageProps keys:', list(pp.keys()))
    # search recursively for products
    def find_products(obj):
        if isinstance(obj, dict):
            for k, v in obj.items():
                if k == 'products' and isinstance(v, list):
                    return v
                res = find_products(v)
                if res: return res
        elif isinstance(obj, list):
            for item in obj:
                res = find_products(item)
                if res: return res
        return None
    prods = find_products(data)
    if prods:
        print(f"Found {len(prods)} products in NEXT_DATA:")
        for p in prods[:15]:
            print(f"- {p.get('name') or p.get('title')} | Price: {p.get('price')} | Img: {p.get('image_url') or p.get('image') or p.get('thumbnail')}")
    else:
        print("No products array directly in NEXT_DATA")

# Search all img tags
img_srcs = re.findall(r'<img[^>]+src=["\']([^"\']+)["\']', html)
print(f"Total img tags: {len(img_srcs)}")
for s in set(img_srcs):
    print("IMG:", s)
