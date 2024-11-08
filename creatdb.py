from flask import Flask
from flask_sqlalchemy import SQLAlchemy


app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///detected_objects.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)


class DetectedObject(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False)
    count = db.Column(db.Integer, nullable=False)
    type = db.Column(db.String(50), nullable=False)

    def __repr__(self):
        return f'<DetectedObject {self.name}: {self.count}: {self.type}>'


if __name__ == '__main__':
    with app.app_context():
        db.create_all() 
        print("Cơ sở dữ liệu đã được tạo thành công.")