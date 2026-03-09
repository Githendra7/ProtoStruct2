from pydantic_settings import BaseSettings
from supabase import create_client, Client

class Settings(BaseSettings):
    SUPABASE_URL: str
    SUPABASE_ANON_KEY: str
    SUPABASE_SERVICE_ROLE_KEY: str
    GROQ_API_KEY: str
    TAVILY_API_KEY: str
    class Config:
        env_file = ".env"

settings = Settings()

# Create Supabase client using Service Role key for backend operations
supabase_client: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)
