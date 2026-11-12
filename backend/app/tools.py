import json
import logging

import arxiv
from langchain.tools import tool

from backend.app.config import PAPER_DIR

logger = logging.getLogger(__name__)


@tool()
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
                    logger.info(f"Error reading {file_path}: {e!s}")
                    continue

    return f"There's no saved information related to paper {paper_id}."
