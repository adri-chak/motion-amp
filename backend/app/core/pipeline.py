import numpy as np
from .pyramid import build_laplacian_pyramid, collapse_laplacian_pyramid
from .bandpass import temporal_bandpass_filter

def run_baseline_evm(frames, fps, low_hz, high_hz, alpha, levels=4, amplify_levels=None):
    T = frames.shape[0]
    if amplify_levels is None:
        amplify_levels = list(range(1, levels))

    pyramids_per_frame = [build_laplacian_pyramid(frames[t], levels) for t in range(T)]
    n_levels = levels + 1

    level_stacks = [
        np.stack([pyramids_per_frame[t][lvl] for t in range(T)], axis=0)
        for lvl in range(n_levels)
    ]

    for lvl in amplify_levels:
        filtered = temporal_bandpass_filter(level_stacks[lvl], fps, low_hz, high_hz)
        level_stacks[lvl] = level_stacks[lvl] + alpha * filtered

    out_frames = np.empty_like(frames)
    for t in range(T):
        levels_t = [level_stacks[lvl][t] for lvl in range(n_levels)]
        out_frames[t] = collapse_laplacian_pyramid(levels_t)

    return out_frames