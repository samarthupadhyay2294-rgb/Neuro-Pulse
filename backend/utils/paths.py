import os


def first_existing(paths: list[str]) -> str:
    for path in paths:
        if path and os.path.isfile(path):
            return path
    raise FileNotFoundError(f"No file found among: {paths}")
