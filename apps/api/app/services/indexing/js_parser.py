import re


def _find_matching_brace(source: str, open_brace_index: int) -> int:
    """Given the index of a '{', finds the index of its matching '}'."""
    depth = 0
    for i in range(open_brace_index, len(source)):
        if source[i] == "{":
            depth += 1
        elif source[i] == "}":
            depth -= 1
            if depth == 0:
                return i
    return len(source) - 1


def parse_js_ts_file(source: str) -> dict:
    classes = []
    functions = []
    imports = []

    class_pattern = re.compile(r"^\s*(?:export\s+)?(?:default\s+)?class\s+(\w+)", re.MULTILINE)
    for match in class_pattern.finditer(source):
        name = match.group(1)
        brace_index = source.find("{", match.end())
        if brace_index == -1:
            continue
        end_index = _find_matching_brace(source, brace_index)
        classes.append({
            "name": name,
            "start_line": source[:match.start()].count("\n") + 1,
            "end_line": source[:end_index].count("\n") + 1,
        })

    func_pattern = re.compile(
        r"^\s*(?:export\s+)?(?:default\s+)?(?:async\s+)?function\s+(\w+)\s*\(", re.MULTILINE
    )
    arrow_pattern = re.compile(
        r"^\s*(?:export\s+)?(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>\s*\{", re.MULTILINE
    )

    for pattern in (func_pattern, arrow_pattern):
        for match in pattern.finditer(source):
            name = match.group(1)
            brace_index = source.find("{", match.end() - 1)
            if brace_index == -1:
                continue
            end_index = _find_matching_brace(source, brace_index)
            functions.append({
                "name": name,
                "start_line": source[:match.start()].count("\n") + 1,
                "end_line": source[:end_index].count("\n") + 1,
            })

    import_pattern = re.compile(r"""from\s+['"]([^'"]+)['"]""")
    require_pattern = re.compile(r"""require\(\s*['"]([^'"]+)['"]\s*\)""")
    for pattern in (import_pattern, require_pattern):
        for match in pattern.finditer(source):
            imports.append(match.group(1))

    return {"classes": classes, "functions": functions, "imports": imports}