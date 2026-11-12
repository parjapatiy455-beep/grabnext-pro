from playwright.sync_api import sync_playwright
import time
import os

os.makedirs('test_record', exist_ok=True)

with sync_playwright() as p:
    browser = p.chromium.launch(
        executable_path=r'C:\Program Files\Google\Chrome\Application\chrome.exe',
        headless=True
    )
    context = browser.new_context(
        record_video_dir='test_record/',
        record_video_size={'width': 1920, 'height': 1080},
        viewport={'width': 1920, 'height': 1080}
    )
    page = context.new_page()
    page.goto('file:///' + os.path.abspath('c:/Users/Perfect Elect/Downloads/GrabNext Intro (1).html').replace('\\', '/'))
    # Click play
    page.click('#play')
    time.sleep(5)
    context.close()
    browser.close()

files = os.listdir('test_record')
print("Recorded files:", files)
for f in files:
    path = os.path.join('test_record', f)
    print(f, os.path.getsize(path), "bytes")
