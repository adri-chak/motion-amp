import cv2
import numpy as np

_R1_KERNEL = np.array([[-0.5, 0, 0.5]], dtype=np.float32)
_R2_KERNEL = np.array([[-0.5], [0], [0.5]], dtype=np.float32)

def compute_riesz_pair(subband):
    r1 = cv2.filter2D(subband, -1, _R1_KERNEL, borderType=cv2.BORDER_REPLICATE)
    r2 = cv2.filter2D(subband, -1, _R2_KERNEL, borderType=cv2.BORDER_REPLICATE)
    return r1, r2