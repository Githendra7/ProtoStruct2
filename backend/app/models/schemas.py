from pydantic import BaseModel
from typing import Optional, Dict

class ProjectCreate(BaseModel):
    problem_statement: str

class ProjectPhaseUpdate(BaseModel):
    human_approved_data: Dict
