import yaml
import os
from typing import Any


_config: dict[str, Any] | None = None


def _env(key: str, default: str | None = None) -> str | None:
    """Read from environment variable, return None if not set."""
    val = os.environ.get(key)
    return val if val is not None else default


def get_config() -> dict[str, Any]:
    global _config
    if _config is not None:
        return _config

    # Try loading config.yaml for defaults
    yaml_config: dict[str, Any] = {}
    config_path = os.path.join(os.path.dirname(__file__), "..", "config.yaml")
    if os.path.exists(config_path):
        with open(config_path, "r", encoding="utf-8") as f:
            yaml_config = yaml.safe_load(f) or {}

    # Build config: env vars override yaml values
    mysql_yaml = yaml_config.get("mysql", {})
    llm_yaml = yaml_config.get("llm", {})

    _config = {
        "llm": {
            "base_url": _env("LLM_BASE_URL", llm_yaml.get("base_url", "https://api.openai.com/v1")),
            "api_key": _env("LLM_API_KEY", llm_yaml.get("api_key", "sk-xxx")),
            "model": _env("LLM_MODEL", llm_yaml.get("model", "gpt-4o-mini")),
            "temperature": float(_env("LLM_TEMPERATURE", str(llm_yaml.get("temperature", 0.1)))),
        },
        "app": {
            "port": int(_env("PORT", str(yaml_config.get("app", {}).get("port", 3001)))),
        },
        "mysql": {
            "host": _env("MYSQL_HOST", mysql_yaml.get("host", "localhost")),
            "port": int(_env("MYSQL_PORT", str(mysql_yaml.get("port", 3306)))),
            "user": _env("MYSQL_USER", mysql_yaml.get("user", "root")),
            "password": _env("MYSQL_PASSWORD", mysql_yaml.get("password", "")),
            "database": _env("MYSQL_DATABASE", mysql_yaml.get("database", "accrue")),
            "charset": _env("MYSQL_CHARSET", mysql_yaml.get("charset", "utf8mb4")),
        },
    }

    return _config
