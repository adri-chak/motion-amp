import numpy as np
from scipy import signal

def temporal_bandpass_filter(data, fps, low_hz, high_hz, order=4):
    nyquist = fps / 2.0
    low = low_hz / nyquist
    high = high_hz / nyquist

    if not (0 < low < high < 1):
        raise ValueError(
            f"Invalid band [{low_hz}, {high_hz}] Hz for fps={fps} "
            f"(Nyquist limit is {nyquist} Hz -- band must stay below this)"
        )

    sos = signal.butter(order, [low, high], btype="band", output="sos")
    return signal.sosfiltfilt(sos, data, axis=0)