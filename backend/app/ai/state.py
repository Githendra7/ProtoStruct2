import operator
from typing import Any, TypedDict, Annotated, List, Dict, Optional

class EngineeringState(TypedDict):
    project_id: str
    problem_statement: str
    functional_tree: Dict[str, Any]
    morphological_alternatives: Dict[str, Any]
    risk_checklist: Dict[str, Any]
    current_phase: str
    validation_feedback: Optional[str]
    revision_count: Annotated[int, operator.add] # Tracks retries to prevent infinite loops
