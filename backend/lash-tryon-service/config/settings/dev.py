from .base import *  # noqa: F401,F403

DEBUG = True
ALLOWED_HOSTS = ["*"]

# BrowsableAPIRenderer solo en dev: es útil para probar a mano en el
# navegador, pero en prod es superficie extra sin necesidad (JSON puro basta).
REST_FRAMEWORK["DEFAULT_RENDERER_CLASSES"] = [  # noqa: F405
    "rest_framework.renderers.JSONRenderer",
    "rest_framework.renderers.BrowsableAPIRenderer",
]
