import cv2
import numpy as np

def read_video_frames(path):
    cap = cv2.VideoCapture(path)
    fps = cap.get(cv2.CAP_PROP_FPS)

    frames = []
    while True:
        ok, frame = cap.read()
        if not ok:
            break
        frames.append(frame)
    cap.release()

    if not frames:
        raise ValueError(f"No frames read from: {path}")

    return np.stack(frames).astype(np.float32), fps

def write_video(path, frames, fps):
    frames_u8 = np.clip(frames, 0, 255).astype(np.uint8)

    h, w = frames_u8.shape[1:3]
    fourcc = cv2.VideoWriter_fourcc(*"mp4v")
    writer = cv2.VideoWriter(path, fourcc, fps, (w, h))
    for f in frames_u8:
        writer.write(f)
    writer.release()