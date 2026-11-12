from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[2]
PAPER_DIR = PROJECT_ROOT / "papers"

SYSTEM_PROMPT = """
You are a assistant that will help me find the papers based on the topic that i am looking for.
"""
