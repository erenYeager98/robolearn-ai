from fastapi import FastAPI, Query, APIRouter
from fastapi.responses import FileResponse
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
import tempfile
import os

router = APIRouter()

# Path to your Chrome profile
CHROME_PROFILE_PATH = r"C:\Users\eren\AppData\Local\Google\Chrome\User Data\Default"  # Linux
# On Windows: r"C:\Users\<YourUser>\AppData\Local\Google\Chrome\User Data\Default"

@router.get("/screenshot")
def screenshot(url: str = Query(..., description="URL to capture")):
    if not url.startswith(("http://", "https://")):
        url = "https://" + url

    tmp_file = tempfile.NamedTemporaryFile(suffix=".png", delete=False)
    tmp_path = tmp_file.name
    tmp_file.close()

    chrome_options = Options()
    chrome_options.add_argument(f"user-data-dir={os.path.dirname(CHROME_PROFILE_PATH)}")
    chrome_options.add_argument(f"profile-directory={os.path.basename(CHROME_PROFILE_PATH)}")
    chrome_options.add_argument("--headless=new")  # Headless Chrome
    chrome_options.add_argument("--disable-gpu")
    chrome_options.add_argument("--window-size=1280,800")

    driver = webdriver.Chrome(options=chrome_options)
    driver.get(url)
    driver.save_screenshot(tmp_path)
    driver.quit()

    return FileResponse(tmp_path, media_type="image/png", filename="screenshot.png")
