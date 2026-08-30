def calculate_risk_score(additions: int, deletions: int, changed_files: int) -> float:
    """
    Simple, explainable size-based risk score, 0-10.
    Bigger diffs and more touched files score higher.
    """
    total_lines = additions + deletions
    line_score = min(total_lines / 500, 1.0) * 6
    file_score = min(changed_files / 20, 1.0) * 4
    return round(line_score + file_score, 2)

from app.db.neo4j.driver import get_neo4j_driver


def suggest_reviewers(repository_id: str, changed_file_paths: list[str]) -> list[dict]:
    if not changed_file_paths:
        return []

    driver = get_neo4j_driver()
    with driver.session() as session:
        result = session.run(
            """
            MATCH (d:Developer {repository_id: $repo_id})-[o:OWNS]->(f:File)
            WHERE f.path IN $paths
            RETURN d.email AS email, count(f) AS files_owned, collect(f.path) AS files, sum(o.commit_count) AS total_commits
            ORDER BY files_owned DESC, total_commits DESC
            LIMIT 5
            """,
            repo_id=repository_id,
            paths=changed_file_paths,
        )
        return [
            {
                "email": r["email"],
                "files_owned": r["files_owned"],
                "files": r["files"],
                "total_commits": r["total_commits"],
            }
            for r in result
        ]