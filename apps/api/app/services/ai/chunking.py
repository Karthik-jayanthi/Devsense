def chunk_file(content: str, parsed: dict) -> list[dict]:
    lines = content.splitlines()
    chunks = []

    for cls in parsed["classes"]:
        start, end = cls["start_line"], cls["end_line"]
        snippet = "\n".join(lines[start - 1:end])
        chunks.append({
            "chunk_type": "class",
            "symbol_name": cls["name"],
            "start_line": start,
            "end_line": end,
            "content": snippet[:4000],
        })

    for fn in parsed["functions"]:
        start, end = fn["start_line"], fn["end_line"]
        snippet = "\n".join(lines[start - 1:end])
        chunks.append({
            "chunk_type": "function",
            "symbol_name": fn["name"],
            "start_line": start,
            "end_line": end,
            "content": snippet[:4000],
        })

    if not chunks:
        chunks.append({
            "chunk_type": "file",
            "symbol_name": None,
            "start_line": 1,
            "end_line": len(lines),
            "content": content[:4000],
        })

    return chunks