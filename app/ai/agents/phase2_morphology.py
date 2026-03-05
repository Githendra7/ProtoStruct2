import json
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from pydantic import BaseModel, Field
from typing import List, Dict

from app.core.config import settings
from app.ai.tools.component_search import Hardware_Component_Search
from app.ai.agents.validators import ValidationResult

class SolutionPrinciple(BaseModel):
    principle: str = Field(description="A real, physical mechanism combining engineering principles.")
    description: str = Field(description="Brief explanation of how it satisfies the function.")

class FunctionSolutionMapping(BaseModel):
    function: str = Field(description="The abstract engineering function.")
    solutions: List[SolutionPrinciple] = Field(description="At least 3 physical solution principles for the function.")

class MorphologicalChart(BaseModel):
    mappings: List[FunctionSolutionMapping] = Field(description="Mapping of functions to solutions.")

# Generator
generator_llm = ChatGroq(temperature=0.7, model_name="llama-3.3-70b-versatile", groq_api_key=settings.GROQ_API_KEY)
generator_with_tools = generator_llm.bind_tools([Hardware_Component_Search])

generator_prompt = ChatPromptTemplate.from_messages([
    ("system", "You are an Ideation & Mechatronics Agent. Your task is to map each abstract function from the provided tree to 3-5 physical solution principles, creating a morphological chart. Rules:\n1) Solutions must be real, physical mechanisms or hardware.\n2) Must obey basic physics.\n3) No empty mappings.\nYou can use hardware component search to find physical mechanisms."),
    ("human", "Functional Tree: {functional_tree}\n\nValidation Feedback (if any): {validation_feedback}\n\nPlease generate the Morphological Chart mapping.")
])

phase2_generator = generator_prompt | generator_with_tools.with_structured_output(MorphologicalChart)

# Validator
validator_llm = ChatGroq(temperature=0.0, model_name="llama-3.1-8b-instant", groq_api_key=settings.GROQ_API_KEY)

validator_prompt = ChatPromptTemplate.from_messages([
    ("system", "You are an Engineering Validator. Evaluate the morphological chart mappings. Rules to check:\n1) Every function MUST have at least 3 distinct solutions.\n2) Solutions cannot be duplicated within a function.\n3) Avoid non-physical abstractions (must be tangible physical mechanisms/components).\nIf valid, return is_valid=True and empty feedback. If invalid, return is_valid=False and detail the exact violations."),
    ("human", "Morphological Chart JSON to validate: {morphological_chart}")
])

phase2_validator = validator_prompt | validator_llm.with_structured_output(ValidationResult)
