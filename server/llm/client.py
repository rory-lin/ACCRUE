from openai import OpenAI
from config import get_config


def get_client() -> OpenAI:
    cfg = get_config()["llm"]
    return OpenAI(
        base_url=cfg["base_url"],
        api_key=cfg["api_key"],
        timeout=30.0,
    )


def chat(system_prompt: str, user_message: str) -> str:
    client = get_client()
    cfg = get_config()["llm"]
    response = client.chat.completions.create(
        model=cfg["model"],
        temperature=cfg.get("temperature", 0.1),
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message},
        ],
    )
    return response.choices[0].message.content or ""
