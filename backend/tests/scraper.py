from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from typing import List
import requests
from bs4 import BeautifulSoup
import json
import re

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  
    allow_credentials=True,
    allow_methods=["*"],                     
    allow_headers=["*"],                      
)

LLM_SUMMARIZER_ENDPOINT = "http://localhost:8001/summarize"
JSON_FILE_PATH = "summary_output.json"

class ScholarItem(BaseModel):
    link: str

class ScholarData(BaseModel):
    organic: List[ScholarItem]

# Utility: Clean and limit text to approx. 500 words
def clean_and_limit_text(text: str, word_limit: int = 500) -> str:
    words = text.split()
    return " ".join(words[:word_limit])

# Extract specific sections from HTML content
def extract_relevant_content(soup: BeautifulSoup) -> str:
    text_parts = []

    # Grab headings (h1–h3)
    headings = soup.find_all(['h1', 'h2', 'h3'])
    for h in headings:
        if any(kw in h.get_text(strip=True).lower() for kw in ['abstract', 'introduction', 'conclusion']):
            next_els = h.find_all_next(['p', 'div'], limit=5)  # Capture ~5 elements after heading
            section_text = h.get_text(strip=True) + "\n"
            section_text += "\n".join(e.get_text(strip=True) for e in next_els)
            text_parts.append(section_text)

    # If nothing found, fallback: first few <p> tags
    if not text_parts:
        paras = soup.find_all('p', limit=10)
        text_parts = [p.get_text(strip=True) for p in paras]

    full_text = "\n\n".join(text_parts)
    return clean_and_limit_text(full_text)

# Call external LLM summarization
def summarize_text_with_llm(text: str) -> str:
    try:
        payload = {
            "instruction": "Summarize this content in about 80 words.",
            "content": text
        }
        response = requests.post(LLM_SUMMARIZER_ENDPOINT, json=payload, timeout=20)
        return response.json().get("summary", "Summary failed.")
    except Exception as e:
        print(f"LLM summarization error: {e}")
        return "Summary failed."

# Main processing route
@app.post("/process_scholar_data")
async def process_scholar_data(data: ScholarData):
    results = []

    for item in data.organic:
        try:
            headers = {"User-Agent": "Mozilla/5.0"}
            r = requests.get(item.link, headers=headers, timeout=10)
            soup = BeautifulSoup(r.text, 'html.parser')

            extracted = extract_relevant_content(soup)
            if not extracted:
                continue

            summary = summarize_text_with_llm(extracted)

            results.append({
                "url": item.link,
                "scraped": extracted,
                "summary": summary
            })

        except Exception as e:
            print(f"Error processing {item.link}: {e}")
            continue

    # Overwrite previous file
    with open(JSON_FILE_PATH, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2, ensure_ascii=False)

    return {
        "message": f"Processed {len(results)} entries. Overwritten {JSON_FILE_PATH}.",
        "data": results
    }
