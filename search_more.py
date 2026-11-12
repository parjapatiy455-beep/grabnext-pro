import urllib.request
import json

headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) GrabNext/1.0'}

queries = ["electronic loop filetype:audio", "techno loop filetype:audio", "house loop filetype:audio", "drum bass loop filetype:audio", "pop sfx filetype:audio", "bell chime filetype:audio"]

for q in queries:
    api_url = f"https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch={urllib.parse.quote(q)}&srnamespace=6&format=json"
    req = urllib.request.Request(api_url, headers=headers)
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read().decode('utf-8'))
        results = data.get('query', {}).get('search', [])
        print(f"\nQuery '{q}':")
        for r in results[:4]:
            print("  - " + r['title'])
