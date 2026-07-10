try:
    from api.agent import app
except ModuleNotFoundError:
    from agent import app
