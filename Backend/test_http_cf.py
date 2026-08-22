import requests

CF_URL = 'https://personality-validation-ids-suburban.trycloudflare.com'

try:
    res = requests.get(f'{CF_URL}/', timeout=5)
    print(f"HTTP GET / status: {res.status_code}")
except Exception as e:
    print(f"HTTP GET Error: {e}")
