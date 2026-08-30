from app.db.neo4j.driver import get_neo4j_driver


def clear_repository_graph(repository_id: str):
    """Removes any existing graph data for this repo before rebuilding it fresh."""
    driver = get_neo4j_driver()
    with driver.session() as session:
        session.run(
            "MATCH (n {repository_id: $repo_id}) DETACH DELETE n",
            repo_id=repository_id,
        )


def build_repository_graph(repository_id: str, full_name: str, parsed_files: list[dict]):
    driver = get_neo4j_driver()
    with driver.session() as session:
        session.run(
            "MERGE (r:Repository {repository_id: $repo_id}) SET r.full_name = $full_name",
            repo_id=repository_id,
            full_name=full_name,
        )

        for file_data in parsed_files:
            session.run(
                """
                MATCH (r:Repository {repository_id: $repo_id})
                MERGE (f:File {repository_id: $repo_id, path: $path})
                MERGE (r)-[:CONTAINS]->(f)
                """,
                repo_id=repository_id,
                path=file_data["file_path"],
            )

            for cls in file_data["classes"]:
                session.run(
                    """
                    MATCH (f:File {repository_id: $repo_id, path: $path})
                    MERGE (c:Class {repository_id: $repo_id, name: $name, file_path: $path})
                    MERGE (f)-[:DEFINES]->(c)
                    """,
                    repo_id=repository_id,
                    path=file_data["file_path"],
                    name=cls["name"],
                )

            for fn in file_data["functions"]:
                session.run(
                    """
                    MATCH (f:File {repository_id: $repo_id, path: $path})
                    MERGE (fn:Function {repository_id: $repo_id, name: $name, file_path: $path})
                    MERGE (f)-[:DEFINES]->(fn)
                    """,
                    repo_id=repository_id,
                    path=file_data["file_path"],
                    name=fn["name"],
                )

def build_ownership(repository_id: str, commits_with_files: list[dict]):
    """
    Derives file ownership from commit history: whoever has the most
    commits touching a file becomes its OWNS relationship in the graph.
    """
    driver = get_neo4j_driver()
    ownership_counts: dict[tuple[str, str], int] = {}

    for commit in commits_with_files:
        author = commit["author_email"]
        for file_path in commit.get("files_changed_paths", []):
            key = (author, file_path)
            ownership_counts[key] = ownership_counts.get(key, 0) + 1

    with driver.session() as session:
        for (author, file_path), count in ownership_counts.items():
            session.run(
                """
                MATCH (f:File {repository_id: $repo_id, path: $path})
                MERGE (d:Developer {repository_id: $repo_id, email: $author})
                MERGE (d)-[o:OWNS]->(f)
                SET o.commit_count = $count
                """,
                repo_id=repository_id,
                path=file_path,
                author=author,
                count=count,
            )