import sys
import os

# Add server directory to Python path so imports like
# "from config import ..." and "from db.database import ..." work
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "server"))

from main import app  # noqa: E402
