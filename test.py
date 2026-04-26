import urllib.request, json
req = urllib.request.urlopen('https://unpkg.com/simple-icons@13.0.0/_data/simple-icons.json', timeout=10)
data = json.loads(req.read())
for i in data['icons']:
    t = i.get('title', '').lower()
    if 'excel' in t or 'team' in t or 'meet' in t or 'word' in t or 'calendar' in t or 'onedrive' in t:
        print(i.get('title'))
