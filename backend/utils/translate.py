from utils.questions import ANSWER_OPTIONS, QUESTIONS

_cache: dict[str, dict] = {}


def _translate_text(text: str, target: str) -> str:
    if not target or target == "en":
        return text
    try:
        from deep_translator import GoogleTranslator

        return GoogleTranslator(source="en", target=target).translate(text)
    except Exception:
        return text


def get_localized_content(lang: str = "en") -> dict:
    if lang in _cache:
        return _cache[lang]

    questions = []
    for q in QUESTIONS:
        questions.append(
            {
                **q,
                "text": _translate_text(q["text"], lang),
            }
        )

    options = []
    for opt in ANSWER_OPTIONS:
        options.append(
            {
                **opt,
                "label": _translate_text(opt["label"], lang),
            }
        )

    payload = {"questions": questions, "answer_options": options, "language": lang}
    _cache[lang] = payload
    return payload
