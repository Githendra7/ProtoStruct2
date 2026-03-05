from app.core.config import supabase_client

def create_project_in_db(user_id: str, problem_statement: str):
    res = supabase_client.table("projects").insert({
        "user_id": user_id,
        "problem_statement": problem_statement
    }).execute()
    return res.data[0]

def get_project_from_db(project_id: str):
    res = supabase_client.table("projects").select("*").eq("id", project_id).execute()
    return res.data[0] if res.data else None
