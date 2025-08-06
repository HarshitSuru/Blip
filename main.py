import os
import requests
import google.generativeai as genai
import asyncio
import json
import time
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from datetime import datetime, timezone
from typing import Optional

# --- SETUP ---
load_dotenv()
TAVILY_API_KEY = os.getenv("TAVILY_API_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel('gemini-1.5-flash-latest')

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- CACHING ---
CACHE = {}
CACHE_EXPIRATION_SECONDS = 300 # 5 minutes

async def process_article_with_gemini(result: dict, query_tags: list) -> dict:
    """Processes one article with Gemini, designed to be run in parallel."""
    content = result.get('raw_content')
    if not content:
        return None

    prompt = f"""
    Analyze the following news article. Article: "{content}"
    Perform two tasks:
    1. Summarize the article in one engaging sentence for a news feed.
    2. Extract up to 4 relevant tags (like locations, people, organizations, or topics). Format them as a comma-separated list.
    Return your response as a single JSON object with two keys: "summary" and "tags".
    Example: {{"summary": "A summary sentence.", "tags": ["Tag1", "Tag2", "Tag3"]}}
    """
    
    try:
        gemini_response = await model.generate_content_async(prompt)
        cleaned_text = gemini_response.text.strip().replace("`", "").replace("json", "")
        response_data = json.loads(cleaned_text)
        summary = response_data.get("summary", result.get('content', 'Summary not available.'))
        extracted_tags = response_data.get("tags", [])

    except (Exception, json.JSONDecodeError) as e:
        print(f"Error processing with Gemini: {e}")
        summary = result.get('content', "Summary could not be generated.")[:150] + "..."
        extracted_tags = [tag.capitalize() for tag in query_tags[:2]]

    return {
        "id": result.get('url'),
        "title": result.get('title'),
        "url": result.get('url'),
        "summary": summary,
        "source": result.get('source'),
        "tags": extracted_tags,
        "publishedAt": datetime.now(timezone.utc).isoformat()
    }

@app.get("/news")
async def get_news(
    tags: str = Query("latest world news", min_length=3, max_length=100),
    exclude_urls: Optional[str] = None
):
    cache_key = f"{tags}:{exclude_urls}"
    current_time = time.time()
    if exclude_urls is None and cache_key in CACHE and (current_time - CACHE[cache_key]['timestamp']) < CACHE_EXPIRATION_SECONDS:
        print(f"CACHE HIT for tags: {tags}")
        return CACHE[cache_key]['data']
    
    print(f"CACHE MISS for tags: {tags}")

    if not TAVILY_API_KEY or not GEMINI_API_KEY:
        raise HTTPException(status_code=500, detail="API keys are not configured.")

    excluded_url_list = exclude_urls.split(',') if exclude_urls else []
    
    try:
        tavily_payload = {
            "api_key": TAVILY_API_KEY,
            "query": tags,
            "search_depth": "advanced",
            "include_raw_content": True,
            "max_results": 10,
            "exclude_urls": excluded_url_list
        }
        response = requests.post("https://api.tavily.com/search", json=tavily_payload)
        response.raise_for_status()
        tavily_results = response.json().get('results', [])
        if not tavily_results: return []
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=502, detail=f"Error from Tavily API: {e}")

    tasks = [process_article_with_gemini(result, tags.split()) for result in tavily_results]
    processed_results = await asyncio.gather(*tasks)
    final_articles = [article for article in processed_results if article is not None]
    
    if exclude_urls is None:
        CACHE[cache_key] = {'timestamp': current_time, 'data': final_articles}
    
    return final_articles   