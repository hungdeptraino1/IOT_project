import cv2
import numpy as np
import os
import logging
from flask import Flask, render_template, Response
from flask_socketio import SocketIO
from flask_sqlalchemy import SQLAlchemy
import time
from typing import List

object_categories = {
  'Inorganic': [
      'bicycle', 'car', 'motorbike', 'aeroplane', 'bus',
      'train', 'truck', 'boat', 'traffic light', 'fire hydrant',
      'stop sign', 'parking meter', 'bench', 'backpack', 'umbrella',
      'handbag', 'tie', 'suitcase', 'frisbee', 'skis', 'snowboard',
      'sports ball', 'kite', 'baseball bat', 'baseball glove',
      'skateboard', 'surfboard', 'tennis racket', 'bottle', 'wine glass',
      'cup', 'fork', 'knife', 'spoon', 'bowl', 'chair', 'sofa',
      'pottedplant', 'bed', 'diningtable', 'toilet', 'tvmonitor',
      'laptop', 'mouse', 'remote', 'keyboard', 'cell phone',
      'microwave', 'oven', 'toaster', 'sink', 'refrigerator', 'book',
      'clock', 'vase', 'scissors'
  ],
  'Organic': [
      'banana', 'apple', 'sandwich', 'orange', 'broccoli',
      'carrot', 'hot dog', 'pizza', 'donut', 'cake'
  ],
  'Animal': [
      'person', 'bird', 'cat', 'dog', 'horse', 'sheep',
      'cow', 'elephant', 'bear', 'zebra', 'giraffe', 'teddy bear'
  ]
}

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///detected_objects.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)
socketio = SocketIO(app)


logging.basicConfig(
    filename='app.log',
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
)


class DetectedObject(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False)
    count = db.Column(db.Integer, nullable=False)
    type = db.Column(db.String(50), nullable=False)

    def __repr__(self):
        return f'<DetectedObject {self.name}: {self.count}: {self.type}>'


with app.app_context():
    db.create_all()

whT = 320
confThreshold = 0.5
nmsThreshold = 0.3
classesfile = 'coco.names'
modelConfig = 'yolov3.cfg'
modelWeights = 'yolov3.weights'

with open(classesfile, 'rt', encoding='utf-8') as f:
    classNames = f.read().rstrip('\n').split('\n')

net = cv2.dnn.readNetFromDarknet(modelConfig, modelWeights)
net.setPreferableBackend(cv2.dnn.DNN_BACKEND_OPENCV)
net.setPreferableTarget(cv2.dnn.DNN_TARGET_CPU)

detected_objects = {}
cap = None

def classify_object(object_name):
    for category, objects in object_categories.items():
        if object_name in objects:
            return category
    return "Khác"

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
        with app.app_context():
            indices = cv2.dnn.NMSBoxes(bbox, confs, confThreshold, nmsThreshold)
            current_detected = {}

            if indices is not None and len(indices) > 0:
                for i in indices.flatten():
                    box = bbox[i]
                    x, y, w, h = box
                    cv2.rectangle(img, (x, y), (x + w, y + h), (255, 0, 255), 2)
                    label = f'{classNames[classIds[i]].upper()} {int(confs[i] * 100)}%'
                    cv2.putText(img, label, (x, y - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 0, 255), 2)

                    object_name = classNames[classIds[i]]
                    current_detected[object_name] = current_detected.get(object_name, 0) + 1

            # Phân loại và cập nhật detected_objects
            for obj, count in current_detected.items():
                category = classify_object(obj)
                detected_objects[obj] = detected_objects.get(obj, 0) + count

                # Lưu vào database
                detected_object = DetectedObject.query.filter_by(name=obj).first()
                if detected_object:
                    detected_object.count += count
                else:
                    detected_object = DetectedObject(name=obj, count=count, type=category)
                    db.session.add(detected_object)

            db.session.commit()

            # Phát sự kiện cho frontend
            socketio.emit('update_objects', {
                'objects': [{'name': obj, 'count': detected_objects[obj], 'type': classify_object(obj)} for obj in detected_objects],
                'total_count': sum(detected_objects.values())
            })

    except Exception as e:
        logging.error("Lỗi nhận dạng vật thể: %s", e)

    return list(detected_objects.keys()), time.sleep(0.2)

def get_frame():
    global cap
    if cap is None:
        cap = cv2.VideoCapture(0)
        if not cap.isOpened():
            logging.error("Không thể mở camera.")
            return None
    time.sleep(0.2)
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
            blob = cv2.dnn.blobFromImage(img, 1 / 255, (whT, whT), [0, 0, 0], 1, crop=False)
            net.setInput(blob)
            layernames = net.getLayerNames()
            outputNames = [layernames[i - 1] for i in net.getUnconnectedOutLayers().flatten()]
            outputs = net.forward(outputNames)

            with app.app_context():
                findObjects(outputs, img)

        ret, buffer = cv2.imencode('.jpg', img)
        if not ret:
            continue

        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + buffer.tobytes() + b'\r\n')

        frame_count += 1

@app.route('/')
def login():
    return render_template('login.html')

@app.route('/index')
def index():
    return render_template('index.html')

@app.route('/video_feed')
def video_feed():
    return Response(gen_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5003))
    socketio.run(app, host='0.0.0.0', port=port, debug=True, allow_unsafe_werkzeug=True)