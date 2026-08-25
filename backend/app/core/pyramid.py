import cv2
import numpy as np

def build_laplacian_pyramid(frame, levels):
    gaussian = [frame.astype(np.float32)]
    for _ in range(levels):
        gaussian.append(cv2.pyrDown(gaussian[-1]))

    laplacian = []
    for i in range(levels):
        size = (gaussian[i].shape[1], gaussian[i].shape[0])
        upsampled = cv2.pyrUp(gaussian[i + 1], dstsize=size)
        laplacian.append(gaussian[i] - upsampled)

    
    laplacian.append(gaussian[-1])
    return laplacian

def collapse_laplacian_pyramid(laplacian_levels):
    recon = laplacian_levels[-1]
    for level in reversed(laplacian_levels[:-1]):
        size = (level.shape[1], level.shape[0])
        recon = cv2.pyrUp(recon, dstsize=size) + level

    return recon