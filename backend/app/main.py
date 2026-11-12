import logging

from dotenv import load_dotenv
from langchain.agents.middleware.tool_selection import DEFAULT_SYSTEM_PROMPT
from langchain.messages import HumanMessage
from langchain_core.runnables import RunnableConfig

from backend.app.agents import init_agent, init_model
from backend.app.tools import extract_info, search_papers

load_dotenv()


logger = logging.getLogger(__name__)


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


def main():
    config: RunnableConfig = {"configurable": {"thread_id": "1"}}
    model = init_model()
    agent = init_agent(model, DEFAULT_SYSTEM_PROMPT, search_papers, extract_info)
    logger.info("agent init complete")

    chat_loop(agent, config)


if __name__ == "__main__":
    main()
