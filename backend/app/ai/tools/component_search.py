from langchain_community.tools.tavily_search import TavilySearchResults
from langchain_core.tools import tool
from app.core.config import settings

# Initialize Tavily using the key from settings
tavily_search = TavilySearchResults(
    tavily_api_key=settings.TAVILY_API_KEY,
    max_results=5, 
    search_depth="advanced"
)

@tool
def Engineering_Research_Scraper(query: str, phase: str) -> str:
    """
    Scrapes specific domains based on the engineering phase:
    phase1: hackster.io, instructables.com (Functional Logic)
    phase2: octopart.com, hackaday.io, digikey.com (Components/Prices)
    phase3: patents.google.com, reddit.com/r/hardware (Market/Legal)
    """
    domain_map = {
        "phase1": "site:hackster.io OR site:instructables.com",
        "phase2": "site:octopart.com OR site:hackaday.io OR site:digikey.com",
        "phase3": "site:patents.google.com OR site:reddit.com/r/hardware OR site:kickstarter.com OR site:amazon.com"
    }
    
    target_domains = domain_map.get(phase, "phase1")
    enhanced_query = f"{query} {target_domains}"
    
    try:
        results = tavily_search.invoke(enhanced_query)
        return "\n---\n".join([f"Source: {r['url']}\nContent: {r['content']}" for r in results])
    except Exception as e:
        return f"Scraping error: {str(e)}"