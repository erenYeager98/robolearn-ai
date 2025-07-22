from scholarly import scholarly

def get_top_scholar_results(query: str, limit: int = 10):
    search_results = scholarly.search_pubs(query)
    results = []

    for i, result in enumerate(search_results):
        if i >= limit:
            break

        full_data = scholarly.fill(result)

        entry = {
            "title": full_data.get("bib", {}).get("title", "N/A"),
            "abstract": full_data.get("bib", {}).get("abstract", "Abstract not available"),
            "url": full_data.get("pub_url", "No URL found")
        }

        results.append(entry)

    return results

query = "quantum computing"
top_articles = get_top_scholar_results(query)

for idx, article in enumerate(top_articles, start=1):
    print(f"{idx}. {article['title']}")
    print(f"   URL: {article['url']}")
    print(f"   Abstract: {article['abstract']}\n")
