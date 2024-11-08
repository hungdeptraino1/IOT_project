import cv2
import numpy as np
import os
import logging
from flask import Flask, render_template, Response
from flask_socketio import SocketIO
import time
from typing import List

app = Flask(__name__)
socketio = SocketIO(app)

logging.basicConfig(
    filename='app.log',
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
)

url = 'http://192.168.0.195/320x320.jpg'  #URL của esp32

whT = 320
confThreshold = 0.5
nmsThreshold = 0.3
classesfile = 'coco.names'
modelConfig = 'yolov3.cfg'
modelWeights = 'yolov3.weights'

with open(classesfile, 'rt',encoding='utf-8') as f:
    classNames = f.read().rstrip('\n').split('\n')

net = cv2.dnn.readNetFromDarknet(modelConfig, modelWeights)
net.setPreferableBackend(cv2.dnn.DNN_BACKEND_OPENCV)
net.setPreferableTarget(cv2.dnn.DNN_TARGET_CPU)

detected_objects = []
cap = None

def findObjects(outputs: List[np.ndarray], img: np.ndarray) -> List[str]:
    global detected_objects
    hT, wT, _ = img.shape
    bbox, classIds, confs = [], [], []

    for output in outputs:
        for det in output:
            scores = det[5:]
            classId = np.argmax(scores)
            confidence = scores[classId]
            if confidence > confThreshold:
                w, h = int(det[2] * wT), int(det[3] * hT)
                x, y = int((det[0] * wT) - w / 2), int((det[1] * hT) - h / 2)
                bbox.append([x, y, w, h])
                classIds.append(classId)
                confs.append(float(confidence))

    try:
        indices = cv2.dnn.NMSBoxes(bbox, confs, confThreshold, nmsThreshold)
        if indices is not None and len(indices) > 0:
            for i in indices.flatten():
                box = bbox[i]
                x, y, w, h = box
                cv2.rectangle(img, (x, y), (x + w, y + h), (255, 0, 255), 2)
                label = f'{classNames[classIds[i]].upper()} {int(confs[i] * 100)}%'
                cv2.putText(img, label, (x, y - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 0, 255), 2)
                detected_objects.append(classNames[classIds[i]])
    except Exception as e:
        logging.error("Lỗi nhận dạng vật thể: %s", e)

    socketio.emit('update_objects', {
        'objects': list(set(detected_objects)),
        'count_object': len(set(detected_objects))
    })
    return detected_objects, time.sleep(0.2)

def get_frame():
    global cap
    if cap is None:
        cap = cv2.VideoCapture(url)
        if not cap.isOpened():
            logging.error("Không thể mở camera.")
            return None

    ret, img = cap.read()
    if not ret:
        logging.warning("Không thể nhận khung hình từ camera. Đang khởi tạo lại camera...")
        cap.release() 
        cap = None  
        return None

    return img

def gen_frames():
    frame_count = 0 
    process_per_frame = 1

    while True:
        img = get_frame()
        if img is None:
            continue 

        if frame_count % process_per_frame == 0:
            #inpur vào YOLO
            blob = cv2.dnn.blobFromImage(img, 1 / 255, (whT, whT), [0, 0, 0], 1, crop=False)
            net.setInput(blob)
            layernames = net.getLayerNames()
            outputNames = [layernames[i - 1] for i in net.getUnconnectedOutLayers().flatten()]
            outputs = net.forward(outputNames)

            findObjects(outputs, img)

        ret, buffer = cv2.imencode('.jpg', img)
        if not ret:
            continue

        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + buffer.tobytes() + b'\r\n')

        frame_count += 1

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/video_feed')
def video_feed():
    return Response(gen_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5003))
    socketio.run(app, host='0.0.0.0', port=port, debug=True, allow_unsafe_werkzeug=True)