import json
import logging
import os
from pathlib import Path

import arxiv
from dotenv import load_dotenv
from langchain.agents import create_agent
from langchain.messages import HumanMessage
from langchain.tools import tool
from langchain_core.runnables import RunnableConfig
from langchain_openai import ChatOpenAI
from langgraph.checkpoint.memory import InMemorySaver

load_dotenv()

PROJECT_ROOT = Path(__file__).resolve().parents[2]
PAPER_DIR = PROJECT_ROOT / "papers"

SYSTEM_PROMPT = """
You are a assistant that will help me find the papers based on the topic that i am looking for.
"""

logger = logging.getLogger(__name__)


@tool
def search_papers(topic: str, max_results: int = 5) -> list[str]:
    """
    Search for papers on arxiv based on topic. Store the retrived information.

    Args:
        topic: the topic to search for
        max_results: number of results to retrive. The default is 5.

    Return:
        List of paper IDs found in the search.
    """
    client = arxiv.Client()

    search = arxiv.Search(
        query=topic, max_results=max_results, sort_by=arxiv.SortCriterion.Relevance
    )

    papers = client.results(search)

    paper_dir_path = PAPER_DIR / topic.lower().replace(" ", "_")
    paper_dir_path.mkdir(parents=True, exist_ok=True)

    paper_infofile_path = paper_dir_path / "papers_info.json"

    try:
        with open(paper_infofile_path, "r") as json_file:
            papers_info = json.load(json_file)
    except (FileNotFoundError, json.JSONDecodeError):
        papers_info = {}

    paper_ids = []

    for paper in papers:
        paper_ids.append(paper.get_short_id())
        paper_info = {
            "title": paper.title,
            "authors": [author.name for author in paper.authors],
            "summary": paper.summary,
            "pdf_url": paper.pdf_url,
            "published": str(paper.published.date()),
        }
        papers_info[paper.get_short_id()] = paper_info

    # Save updated papers_info to json file
    with open(paper_infofile_path, "w") as json_file:
        json.dump(papers_info, json_file, indent=2)

    logger.info(f"Results are saved in: {paper_infofile_path}")

    return paper_ids


@tool
def extract_info(paper_id: str) -> str:
    """
    Search for information about a specific paper across all topic directories.

    Args:
        paper_id: The ID of the paper to look for

    Returns:
        JSON string with paper information if found, error message if not found
    """

    for item in PAPER_DIR.iterdir():
        if item.is_dir():
            file_path = item / "papers_info.json"
            if file_path.is_file():
                try:
                    with open(file_path, "r", encoding="utf-8") as json_file:
                        papers_info = json.load(json_file)
                        if paper_id in papers_info:
                            return json.dumps(papers_info[paper_id], indent=2)
                except (FileNotFoundError, json.JSONDecodeError) as e:
                    logger.info(f"Error reading {file_path}: {str(e)}")
                    continue

    return f"There's no saved information related to paper {paper_id}."


def chat_loop(agent, config):
    logger.info("Chat started. Type 'exit' or 'quit' to stop.")

    while True:
        try:
            query = input("\nYou: ").strip()

            if query.lower() in ("exit", "quit"):
                logger.info("Goodbye!")
                break

            if not query:
                continue

            response = agent.invoke(
                {"messages": [HumanMessage(content=query)]},
                config=config,
            )

            print(f"\nAssistant: {response['messages'][-1].content}")

        except (KeyboardInterrupt, EOFError):
            logger.info("\nGoodbye!")
            break

        except Exception as e:
            logger.info(f"\nError: {e}")


if __name__ == "__main__":
    model_name = os.getenv("AZURE_OPENAI_MODEL")
    api_key = os.getenv("AZURE_OPENAI_API_KEY")
    endpoint = os.getenv("AZURE_OPENAI_ENDPOINT")

    if not model_name or not api_key or not endpoint:
        raise RuntimeError("One or multiple environmental variables are missing")

    model = ChatOpenAI(model=model_name, base_url=endpoint, api_key=api_key)
    logger.info("Model init complete")

    agent = create_agent(
        model=model,
        tools=[
            search_papers,
            extract_info,
        ],
        system_prompt=SYSTEM_PROMPT,
        # response_format=RecipeInfo,
        checkpointer=InMemorySaver(),
    )
    config: RunnableConfig = {"configurable": {"thread_id": "1"}}
    logger.info("agent init complete")

    chat_loop(agent, config)
