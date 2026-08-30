from neo4j import GraphDatabase

from app.core.config import settings

_driver = GraphDatabase.driver(
    settings.neo4j_uri,
    auth=(settings.neo4j_user, settings.neo4j_password),
)


def get_neo4j_driver():
    return _driver


def close_neo4j_driver():
    _driver.close()