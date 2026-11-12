import urllib.request
import json

headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) GrabNext/1.0'}
api_url = "https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=electronic%20music%20filetype:audio&srnamespace=6&format=json"

try:
    req = urllib.request.Request(api_url, headers=headers)
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read().decode('utf-8'))
        results = data.get('query', {}).get('search', [])
        print(f"Found {len(results)} audio results on Wikimedia Commons:")
        for r in results[:10]:
            print("- " + r['title'])
except Exception as e:
    print("Error:", e)
