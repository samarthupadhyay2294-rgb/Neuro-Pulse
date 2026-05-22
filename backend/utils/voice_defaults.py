import os

import pandas as pd

from config import ROOT_DIR

# Population means from parkinsons.data (used when voice step is skipped)
_DEFAULTS = None

_COL_MAP = {
    "fo": "MDVP:Fo(Hz)",
    "jitter": "MDVP:Jitter(%)",
    "shimmer": "MDVP:Shimmer",
    "nhr": "NHR",
    "hnr": "HNR",
}


def get_default_voice_features() -> dict:
    global _DEFAULTS
    if _DEFAULTS is not None:
        return _DEFAULTS.copy()

    data_path = os.path.join(ROOT_DIR, "parkinsons.data")
    if os.path.isfile(data_path):
        df = pd.read_csv(data_path)
        _DEFAULTS = {
            "fo": round(float(df[_COL_MAP["fo"]].mean()), 4),
            "jitter": round(float(df[_COL_MAP["jitter"]].mean()), 6),
            "shimmer": round(float(df[_COL_MAP["shimmer"]].mean()), 6),
            "nhr": round(float(df[_COL_MAP["nhr"]].mean()), 6),
            "hnr": round(float(df[_COL_MAP["hnr"]].mean()), 4),
        }
    else:
        _DEFAULTS = {
            "jitter": 0.006,
            "shimmer": 0.034,
            "fo": 154.0,
            "nhr": 0.024,
            "hnr": 22.0,
        }

    return _DEFAULTS.copy()
