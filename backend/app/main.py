import logging
from contextlib import asynccontextmanager

import uvicorn
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.requests import Request
from langchain.agents.middleware.tool_selection import DEFAULT_SYSTEM_PROMPT
from langgraph.graph.state import CompiledStateGraph
from pydantic import BaseModel

from backend.app.agents import PaperInfo, init_agent, init_model
from backend.app.tools import extract_info, search_papers

load_dotenv()


@asynccontextmanager
async def lifespan(app: FastAPI):
    model = init_model()
    app.state.agent = init_agent(
        model, DEFAULT_SYSTEM_PROMPT, search_papers, extract_info
    )
    yield


app = FastAPI(title="Research Assistant App", lifespan=lifespan)

logger = logging.getLogger(__name__)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_methods=["POST"],
    allow_headers=["Content-Type"],
)


class ChatRequest(BaseModel):
    message: str
    thread_id: str


class ChatResponse(BaseModel):
    response: str


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/chat", response_model=PaperInfo)
async def chat(payload: ChatRequest, request: Request) -> PaperInfo:
    agent: CompiledStateGraph = request.app.state.agent
    result = await agent.ainvoke(
        {"messages": [{"role": "user", "content": payload.message}]},
        config={"configurable": {"thread_id": payload.thread_id}},
    )
    return result["structured_response"]


# def chat_loop(agent, config):
#     logger.info("Chat started. Type 'exit' or 'quit' to stop.")
#
#     while True:
#         try:
#             query = input("\nYou: ").strip()
#
#             if query.lower() in ("exit", "quit"):
#                 logger.info("Goodbye!")
#                 break
#
#             if not query:
#                 continue
#
#             response = agent.invoke(
#                 {"messages": [HumanMessage(content=query)]},
#                 config=config,
#             )
#
#             print(f"\nAssistant: {response['messages'][-1].content}")
#
#         except (KeyboardInterrupt, EOFError):
#             logger.info("\nGoodbye!")
#             break
#
#         except Exception as e:
#             logger.info(f"\nError: {e}")
#


def main():
    logger.info("Starting server")
    uvicorn.run(app=app)


if __name__ == "__main__":
    main()
