import re
from bs4 import BeautifulSoup

with open('scraped_grabnext.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Let's search for card or product structures
# Find all occurrences of product titles and nearby images
# Let's inspect text around those vercel-storage links
chunks = html.split('ufy1gchwd7dz6awt.public.blob.vercel-storage.com/products/')
print(f"Total product chunks: {len(chunks)-1}")

for i, chunk in enumerate(chunks[1:], 1):
    img_name = chunk.split('"')[0].split("'")[0]
    # Look back or forward for text/titles/prices
    context = chunk[:500]
    print(f"\n--- Item {i} ---")
    print("Image: " + img_name)
    # clean tags from context
    clean_txt = re.sub(r'<[^>]+>', ' | ', context)
    clean_txt = re.sub(r'\s+', ' ', clean_txt)[:200]
    print("Context:", clean_txt)
