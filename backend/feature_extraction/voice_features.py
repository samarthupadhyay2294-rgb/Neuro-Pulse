import os
import tempfile

import librosa
import numpy as np
from pydub import AudioSegment
from scipy import signal


SR = 22050


def _load_audio(path: str) -> tuple[np.ndarray, int]:
    ext = os.path.splitext(path)[1].lower().lstrip(".")
    if ext in ("mp3", "m4a", "webm", "ogg"):
        seg = AudioSegment.from_file(path)
        seg = seg.set_channels(1).set_frame_rate(SR)
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
            seg.export(tmp.name, format="wav")
            y, sr = librosa.load(tmp.name, sr=SR, mono=True)
        os.unlink(tmp.name)
        return y, sr
    y, sr = librosa.load(path, sr=SR, mono=True)
    return y, sr


def _reduce_noise(y: np.ndarray) -> np.ndarray:
    y_trim, _ = librosa.effects.trim(y, top_db=25)
    if len(y_trim) < SR // 2:
        y_trim = y
    return y_trim


def _pitch_track(y: np.ndarray, sr: int) -> np.ndarray:
    f0, voiced_flag, _ = librosa.pyin(
        y,
        fmin=librosa.note_to_hz("C2"),
        fmax=librosa.note_to_hz("C7"),
        sr=sr,
    )
    f0 = f0[voiced_flag] if voiced_flag is not None else f0
    f0 = f0[~np.isnan(f0)] if f0 is not None else np.array([])
    return f0.astype(float) if len(f0) else np.array([0.0])


def extract_voice_features(audio_path: str) -> dict:
    y, sr = _load_audio(audio_path)
    y = _reduce_noise(y)

    if len(y) < sr:
        raise ValueError("Audio too short. Please record at least 3 seconds.")

    f0 = _pitch_track(y, sr)
    fo = float(np.mean(f0)) if len(f0) else 0.0

    periods = np.diff(1.0 / np.maximum(f0, 1e-6)) if len(f0) > 1 else np.array([0.0])
    jitter = float(np.std(periods) / (np.mean(np.abs(periods)) + 1e-9) * 100)

    rms = librosa.feature.rms(y=y)[0]
    shimmer = float(np.std(rms) / (np.mean(rms) + 1e-9))

    spec = np.abs(librosa.stft(y))
    freqs = librosa.fft_frequencies(sr=sr)
    harmonic, percussive = librosa.decompose.hpss(spec)
    harm_energy = np.sum(harmonic)
    noise_energy = np.sum(percussive) + 1e-9
    nhr = float(noise_energy / (harm_energy + noise_energy))
    hnr = float(harm_energy / noise_energy) if noise_energy > 0 else 0.0

    pitch_variation = float(np.std(f0)) if len(f0) else 0.0
    frequency_stability = float(1.0 / (pitch_variation + 1e-6))

    fhi = float(np.percentile(f0, 90)) if len(f0) else 0.0
    flo = float(np.percentile(f0, 10)) if len(f0) else 0.0

    return {
        "jitter": round(jitter, 6),
        "shimmer": round(shimmer, 6),
        "fo": round(fo, 4),
        "nhr": round(nhr, 6),
        "hnr": round(hnr, 4),
        "fhi": round(fhi, 4),
        "flo": round(flo, 4),
        "pitch_variation": round(pitch_variation, 4),
        "frequency_stability": round(frequency_stability, 4),
    }
