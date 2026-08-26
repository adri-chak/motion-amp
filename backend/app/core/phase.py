import numpy as np

def reference_orientation(r1_stack, r2_stack):
    mean_r1 = r1_stack.mean(axis=0)
    mean_r2 = r2_stack.mean(axis=0)
    return np.arctan2(mean_r2, mean_r1)


def compute_phase_signal(i_stack, r1_stack, r2_stack, theta):
    q = r1_stack * np.cos(theta) + r2_stack * np.sin(theta)
    amplitude = np.sqrt(i_stack ** 2 + q ** 2)
    phase = np.arctan2(q, i_stack)
    phase = np.unwrap(phase, axis=0)
    return phase, amplitude