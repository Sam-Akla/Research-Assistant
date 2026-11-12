import os

from langchain.agents import create_agent
from langchain_openai import ChatOpenAI
from langgraph.checkpoint.memory import InMemorySaver


def init_model() -> ChatOpenAI:
    model_name = os.getenv("AZURE_OPENAI_MODEL")
    api_key = os.getenv("AZURE_OPENAI_API_KEY")
    endpoint = os.getenv("AZURE_OPENAI_ENDPOINT")

    if not model_name or not api_key or not endpoint:
        raise RuntimeError("One or multiple environmental variables are missing")

    return ChatOpenAI(model=model_name, base_url=endpoint, api_key=api_key)


def init_agent(model: ChatOpenAI, SYSTEM_PROMPT: str, *tools):
    return create_agent(
        model=model,
        tools=[*tools],
        system_prompt=SYSTEM_PROMPT,
        # response_format=RecipeInfo,
        checkpointer=InMemorySaver(),
    )
