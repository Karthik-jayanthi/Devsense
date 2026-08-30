import os
from collections import defaultdict
from git import Repo as GitRepo

LANGUAGE_EXTENSIONS = {
    ".py": "Python", ".js": "JavaScript", ".ts": "TypeScript", ".tsx": "TypeScript",
    ".jsx": "JavaScript", ".java": "Java", ".go": "Go", ".rs": "Rust", ".rb": "Ruby",
    ".php": "PHP", ".c": "C", ".cpp": "C++", ".cs": "C#", ".html": "HTML",
    ".css": "CSS", ".md": "Markdown", ".json": "JSON", ".yml": "YAML", ".yaml": "YAML",
}

IGNORE_DIRS = {".git", "node_modules", "venv", "__pycache__", ".next", "dist", "build"}


def clone_repository(clone_url: str, dest_path: str):
    GitRepo.clone_from(clone_url, dest_path, depth=200)


def walk_and_analyze(repo_path: str) -> dict:
    language_counts = defaultdict(int)
    file_count = 0

    for root, dirs, files in os.walk(repo_path):
        dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]
        for fname in files:
            ext = os.path.splitext(fname)[1].lower()
            if ext in LANGUAGE_EXTENSIONS:
                language_counts[LANGUAGE_EXTENSIONS[ext]] += 1
            file_count += 1

    return {"languages": dict(language_counts), "file_count": file_count}


def extract_commits(repo_path: str, limit: int = 100) -> list[dict]:
    git_repo = GitRepo(repo_path)
    commits = []
    for commit in git_repo.iter_commits(max_count=limit):
        files_changed_paths = list(commit.stats.files.keys())
        commits.append({
            "sha": commit.hexsha,
            "author_email": commit.author.email or commit.author.name,
            "message": commit.message.strip().split("\n")[0],
            "committed_at": commit.committed_datetime,
            "additions": commit.stats.total.get("insertions", 0),
            "deletions": commit.stats.total.get("deletions", 0),
            "files_changed": commit.stats.total.get("files", 0),
            "files_changed_paths": files_changed_paths,
        })
    return commits