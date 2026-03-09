import json
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from pydantic import BaseModel, Field
from typing import List, Dict

from app.ai.tools.component_search import Engineering_Research_Scraper
from app.core.config import settings
from app.ai.tools.risk_databases import FMEA_Lookup
from app.ai.agents.validators import ValidationResult

class RiskItem(BaseModel):
    risk_category: str = Field(description="Category of the risk (e.g., Mechanical, Electrical, Thermal, Manufacturing, Integration).")
    cause: str = Field(description="A clear engineering cause for the risk based on physical hardware.")
    trade_off: str = Field(description="A key engineering trade-off associated with the risk.")

class RiskChecklist(BaseModel):
    risks: List[RiskItem] = Field(description="List of engineering risks and trade-offs.")

class SWOTAnalysis(BaseModel):
    strengths: List[str]
    weaknesses: List[str] = Field(description="Highlight if BOM cost from phase 2 > market price found in scraping.")
    opportunities: List[str] = Field(description="Needs identified from Reddit/Social sentiment.")
    threats: List[str] = Field(description="Legal risks from Google Patents claims.")

# Generator
generator_llm = ChatGroq(temperature=0.7, model_name="llama-3.3-70b-versatile", groq_api_key=settings.GROQ_API_KEY)
generator_with_tools = generator_llm.bind_tools([Engineering_Research_Scraper])

generator_prompt = ChatPromptTemplate.from_messages([
    ("system", "You are a Market & Risk Agent. Use 'Engineering_Research_Scraper' with phase='phase3' to check patents and sentiment..."),
    ("human", "Goal: {problem_statement}\nMorphology: {morphological_alternatives}")
])


phase3_generator = generator_prompt | generator_llm.bind_tools([Engineering_Research_Scraper]).with_structured_output(SWOTAnalysis)
# Validator
validator_llm = ChatGroq(temperature=0.0, model_name="llama-3.1-8b-instant", groq_api_key=settings.GROQ_API_KEY)

validator_prompt = ChatPromptTemplate.from_messages([
    ("system", "You are an Engineering Validator. Evaluate the structured engineering risk checklist. Rules to check:\n1) No generic business or market risks (must be engineering specific).\n2) Must have a clear engineering cause.\n3) Must clearly identify a trade-off.\nIf valid, return is_valid=True and empty feedback. If invalid, return is_valid=False and detail the exact violations."),
    ("human", "Risk Checklist JSON to validate: {risk_checklist}")
])

phase3_validator = validator_prompt | validator_llm.with_structured_output(ValidationResult)
