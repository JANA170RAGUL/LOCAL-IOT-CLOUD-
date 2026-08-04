import urllib.request
import urllib.error

try:
    url = "http://localhost:8000/organizations/?page=1&page_size=10"
    req = urllib.request.Request(url)
    # The endpoint is protected by auth, so it will probably return 401. 
    # But if it returns 404, we know the route is missing!
    response = urllib.request.urlopen(req)
    print("Status:", response.status)
except urllib.error.HTTPError as e:
    print("HTTPError:", e.code)
    print(e.read().decode('utf-8'))
except Exception as e:
    print("Error:", e)
