import ast
import os
from app.services.indexing.js_parser import parse_js_ts_file

def parse_python_file(file_path: str, repo_relative_path: str) -> dict:
    try:
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            source = f.read()
        tree = ast.parse(source, filename=repo_relative_path)
    except (SyntaxError, UnicodeDecodeError):
        return {"classes": [], "functions": [], "imports": []}

    classes = []
    functions = []
    imports = []

    for node in ast.walk(tree):
        if isinstance(node, ast.ClassDef):
            classes.append({
                "name": node.name,
                "start_line": node.lineno,
                "end_line": getattr(node, "end_lineno", node.lineno),
            })
        elif isinstance(node, ast.FunctionDef) and not _is_method(tree, node):
            functions.append({
                "name": node.name,
                "start_line": node.lineno,
                "end_line": getattr(node, "end_lineno", node.lineno),
            })
        elif isinstance(node, ast.Import):
            for alias in node.names:
                imports.append(alias.name)
        elif isinstance(node, ast.ImportFrom):
            if node.module:
                imports.append(node.module)

    return {"classes": classes, "functions": functions, "imports": imports}


def _is_method(tree: ast.AST, target: ast.FunctionDef) -> bool:
    for node in ast.walk(tree):
        if isinstance(node, ast.ClassDef):
            if target in node.body:
                return True
    return False


def parse_repository(repo_path: str) -> list[dict]:
    results = []
    ignore_dirs = {".git", "node_modules", "venv", "__pycache__", ".next", "dist", "build"}
    js_ts_extensions = {".js", ".jsx", ".ts", ".tsx"}

    for root, dirs, files in os.walk(repo_path):
        dirs[:] = [d for d in dirs if d not in ignore_dirs]
        for fname in files:
            full_path = os.path.join(root, fname)
            rel_path = os.path.relpath(full_path, repo_path)

            if fname.endswith(".py"):
                parsed = parse_python_file(full_path, rel_path)
                results.append({"file_path": rel_path, **parsed})

            elif any(fname.endswith(ext) for ext in js_ts_extensions) and not fname.endswith(".d.ts"):
                try:
                    with open(full_path, "r", encoding="utf-8", errors="ignore") as f:
                        source = f.read()
                    parsed = parse_js_ts_file(source)
                    results.append({"file_path": rel_path, **parsed})
                except Exception:
                    continue

    return results