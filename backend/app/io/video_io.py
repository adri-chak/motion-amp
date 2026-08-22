import cv2
import numpy as np

def read_video_frames(path):
    cap = cv2.VideoCapture(path)
    fps = cap.get(cv2.CAP_PROP_FPS)

    frames = []
    while True:
        ok, frame = cap.read()