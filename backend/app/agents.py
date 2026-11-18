# TODO: Add state
# TODO: Add context
# TODO: Connect tools as well

import datetime
import logging
import os

from langchain.agents import create_agent
from langchain_openai import ChatOpenAI
from langgraph.checkpoint.memory import InMemorySaver
from langgraph.graph.state import CompiledStateGraph
from pydantic import BaseModel

logger = logging.getLogger(__name__)


class PaperInfo(BaseModel):
    title: str
    author: str
    id: int
    link: str
    category: str
    published: datetime.date | None = None
    updated: datetime.date | None = None


def init_model() -> ChatOpenAI:
    model_name = os.getenv("AZURE_OPENAI_MODEL")
    api_key = os.getenv("AZURE_OPENAI_API_KEY")
    endpoint = os.getenv("AZURE_OPENAI_ENDPOINT")

    if not model_name or not api_key or not endpoint:
        raise RuntimeError("One or multiple environmental variables are missing")

    logger.info("Initializing the model")
    return ChatOpenAI(model=model_name, base_url=endpoint, api_key=api_key)


def init_agent(model: ChatOpenAI, SYSTEM_PROMPT: str, *tools) -> CompiledStateGraph:
    logger.info("Creating OpenAI Agent")
    return create_agent(
        model=model,
        tools=[*tools],
        system_prompt=SYSTEM_PROMPT,
        response_format=PaperInfo,
        checkpointer=InMemorySaver(),
    )
