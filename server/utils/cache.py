import time
from functools import wraps
from typing import Callable


_cache_store: dict[str, tuple[float, any]] = {}


def ttl_cache(key: str, ttl: float = 120):
    """Simple TTL cache decorator. Caches the return value keyed by prefix + args."""
    def decorator(fn: Callable):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            # Build a cache key that includes arguments
            arg_key = f"{key}:{args}:{sorted(kwargs.items())}"
            now = time.time()
            cached = _cache_store.get(arg_key)
            if cached and now - cached[0] < ttl:
                return cached[1]
            result = fn(*args, **kwargs)
            _cache_store[arg_key] = (now, result)
            return result
        return wrapper
    return decorator


def invalidate_cache(*keys: str):
    """Invalidate all cache entries matching any of the given key prefixes."""
    to_delete = [k for k in _cache_store if any(k.startswith(prefix + ":") or k == prefix for prefix in keys)]
    for k in to_delete:
        del _cache_store[k]
