import json
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from pydantic import BaseModel, Field
from typing import List, Dict

from app.core.config import settings
from app.ai.tools.risk_databases import FMEA_Lookup
from app.ai.agents.validators import ValidationResult

class SWOTItem(BaseModel):
    function_name: str = Field(description="The engineering function title from Phase 2.")
    solution_name: str = Field(description="The specific solution principle name being evaluated.")
    strength: str = Field(description="A specific engineering strength of this solution.")
    weakness: str = Field(description="A specific engineering weakness, including its cause and associated trade-off.")
    opportunity: str = Field(description="A specific technical opportunity for future improvement.")
    threat: str = Field(description="A specific engineering threat or risk, including its cause and associated trade-off.")

class SWOTAnalysis(BaseModel):
    analysis: List[SWOTItem] = Field(description="List of engineering SWOT analysis items.")

# Generator
generator_llm = ChatGroq(temperature=0.7, model_name="llama-3.3-70b-versatile", groq_api_key=settings.GROQ_API_KEY)
generator_with_tools = generator_llm.bind_tools([FMEA_Lookup])

generator_prompt = ChatPromptTemplate.from_messages([
    ("system", "You are an Engineering Evaluation Agent. Your task is to perform a detailed SWOT analysis for EVERY engineering solution principle generated in the morphological analysis (Phase 2). Evaluate ALL alternatives for EVERY level-1 function provided. Each response must contain a complete Strengths, Weaknesses, Opportunities, and Threats assessment for every single alternative. Each Weakness and Threat must include a specific engineering cause (e.g. friction, signal noise) and trade-off (e.g. cost vs reliability). Strengths and Opportunities should highlight inherent technical advantages or future potential. Provide a comprehensive list where each item identifies both the function name and the specific solution principle name. Maintain technical depth and avoid business or market considerations. Return a flat list of all SWOT assessments without extra text."),
    ("human", "Problem Statement: {problem_statement}\nMorphological Chart (Selected Options): {morphological_alternatives}\n\nValidation Feedback (if any): {validation_feedback}\n\nPlease generate the SWOT analysis for ALL alternatives.")
])

phase3_generator = generator_prompt | generator_with_tools.with_structured_output(SWOTAnalysis)

# Validator
validator_llm = ChatGroq(temperature=0.0, model_name="llama-3.1-8b-instant", groq_api_key=settings.GROQ_API_KEY)

validator_prompt = ChatPromptTemplate.from_messages([
    ("system", "You are an Engineering Validator. Evaluate the structured engineering SWOT analysis checklist. Rules to check:\n1) No generic business or market risks (must be engineering specific).\n2) Weakness and Threat must have clear engineering causes and trade-offs.\n3) The SWOT checklist MUST contain valid items.\nIf valid, return is_valid=True and empty feedback. If invalid, return is_valid=False and detail the exact violations."),
    ("human", "SWOT Analysis JSON to validate: {risk_checklist}")
])

phase3_validator = validator_prompt | validator_llm.with_structured_output(ValidationResult)
