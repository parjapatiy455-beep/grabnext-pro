import urllib.request
headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
urls = [
    ('bgm_tech_house.mp3', 'https://assets.mixkit.co/music/preview/mixkit-tech-house-vibes-130.mp3'),
    ('bgm_games_beat.mp3', 'https://assets.mixkit.co/music/preview/mixkit-games-world-beat-466.mp3'),
    ('sfx_pop.mp3', 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3'),
    ('sfx_bonus.mp3', 'https://assets.mixkit.co/active_storage/sfx/2058/2058-preview.mp3'),
    ('sfx_whoosh.mp3', 'https://assets.mixkit.co/active_storage/sfx/2574/2574-preview.mp3')
]
for fname, u in urls:
    try:
        req = urllib.request.Request(u, headers=headers)
        with urllib.request.urlopen(req) as resp:
            data = resp.read()
            with open(fname, 'wb') as f:
                f.write(data)
            print(f'Downloaded {fname}: {len(data)} bytes')
    except Exception as e:
        print(f'Failed {fname}: {e}')
