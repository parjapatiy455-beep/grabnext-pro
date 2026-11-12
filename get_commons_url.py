import urllib.request
import json

headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) GrabNext/1.0'}

def get_file_url(title):
    api_url = f"https://commons.wikimedia.org/w/api.php?action=query&titles={urllib.parse.quote(title)}&prop=imageinfo&iiprop=url&format=json"
    req = urllib.request.Request(api_url, headers=headers)
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read().decode('utf-8'))
        pages = data.get('query', {}).get('pages', {})
        for _, page in pages.items():
            ii = page.get('imageinfo', [])
            if ii:
                return ii[0].get('url')
    return None

for title in ["File:Duomagnetix M.wav", "File:Magnetic Cat M.wav"]:
    url = get_file_url(title)
    print(title, "->", url)
