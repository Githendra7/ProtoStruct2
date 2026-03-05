import json
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from pydantic import BaseModel, Field
from typing import List, Dict

from app.core.config import settings
from app.ai.tools.taxonomies import Functional_Basis_Lookup, TRIZ_Principles_Query
from app.ai.agents.validators import ValidationResult

# Pydantic schema for generator output
class FunctionNode(BaseModel):
    function: str = Field(description="The abstract engineering function formulated as Verb + Noun.")
    children: List["FunctionNode"] = Field(default_factory=list, description="Child sub-functions.")

class FunctionalTree(BaseModel):
    root_function: FunctionNode = Field(description="The main top-level function of the system.")

# Generator
generator_llm = ChatGroq(temperature=0.7, model_name="llama-3.3-70b-versatile", groq_api_key=settings.GROQ_API_KEY)
# Bind tools
generator_with_tools = generator_llm.bind_tools([Functional_Basis_Lookup, TRIZ_Principles_Query])

generator_prompt = ChatPromptTemplate.from_messages([
    ("system", "You are a Functional Architect. Your task is to convert the given problem statement into an abstract engineering functional tree. \nRules:\n1) Functions MUST be strictly formulated as Verb + Noun.\n2) DO NOT include physical components, specific materials (like 'water'), or technologies (like 'solar'). Use generic flows (e.g., 'liquid', 'energy', 'solid', 'gas', 'human').\n3) Example: Instead of 'purify water', use 'separate liquid'. Instead of 'generate solar power', use 'convert energy'.\nYou can use standard engineering functional bases or TRIZ principles using tools if needed."),
    ("human", "Problem Statement: {problem_statement}\n\nValidation Feedback (if any): {validation_feedback}\n\nPlease generate the functional tree obeying the rules strictly.")
])

# Use structure for final output parsing
phase1_generator = generator_prompt | generator_with_tools.with_structured_output(FunctionalTree)

# Validator
validator_llm = ChatGroq(temperature=0.0, model_name="llama-3.1-8b-instant", groq_api_key=settings.GROQ_API_KEY)

validator_prompt = ChatPromptTemplate.from_messages([
    ("system", "You are an Engineering Validator. Evaluate the functional decomposition tree. Rules to check:\n1) NO physical components or specific real-world technologies (e.g. 'solar', 'pump', 'filter'). Note: Generic engineering flows like 'liquid', 'solid', 'gas', 'energy', 'signal' are ALLOWED and VALID abstract nouns.\n2) Functions must be abstract (Verb + Noun).\n3) There must exist a defined hierarchy (root -> children).\nIf valid, return is_valid=True and empty feedback. If invalid, return is_valid=False and specify the exact rule violations."),
    ("human", "Functional Tree JSON to validate: {functional_tree}")
])

phase1_validator = validator_prompt | validator_llm.with_structured_output(ValidationResult)
