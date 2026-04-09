import yaml
import os
from typing import Any


_config: dict[str, Any] | None = None


def get_config() -> dict[str, Any]:
    global _config
    if _config is not None:
        return _config

    config_path = os.path.join(os.path.dirname(__file__), "..", "config.yaml")
    if os.path.exists(config_path):
        with open(config_path, "r", encoding="utf-8") as f:
            _config = yaml.safe_load(f)
    else:
        _config = {
            "llm": {
                "base_url": "https://api.openai.com/v1",
                "api_key": "sk-xxx",
                "model": "gpt-4o-mini",
                "temperature": 0.1,
            },
            "app": {"port": 3001},
            "mysql": {
                "host": "localhost",
                "port": 3306,
                "user": "root",
                "password": "",
                "database": "accrue",
                "charset": "utf8mb4",
            },
        }

    return _config
