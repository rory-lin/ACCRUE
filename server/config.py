import yaml
import os
from typing import Any
from urllib.parse import urlparse


_config: dict[str, Any] | None = None


def _env(key: str, default: str | None = None) -> str | None:
    val = os.environ.get(key)
    return val if val is not None else default


def _parse_database_url(url: str) -> dict[str, Any]:
    """Parse DATABASE_URL like mysql://user:password@host:port/database"""
    parsed = urlparse(url)
    return {
        "host": parsed.hostname or "localhost",
        "port": parsed.port or 3306,
        "user": parsed.username or "root",
        "password": parsed.password or "",
        "database": parsed.path.lstrip("/") or "accrue",
    }


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

    # DATABASE_URL takes priority over individual MYSQL_* vars
    database_url = _env("DATABASE_URL")
    if database_url:
        mysql_cfg = _parse_database_url(database_url)
    else:
        mysql_cfg = {
            "host": _env("MYSQL_HOST", mysql_yaml.get("host", "localhost")),
            "port": int(_env("MYSQL_PORT", str(mysql_yaml.get("port", 3306)))),
            "user": _env("MYSQL_USER", mysql_yaml.get("user", "root")),
            "password": _env("MYSQL_PASSWORD", mysql_yaml.get("password", "")),
            "database": _env("MYSQL_DATABASE", mysql_yaml.get("database", "accrue")),
        }

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
        "mysql": mysql_cfg,
    }

    return _config
