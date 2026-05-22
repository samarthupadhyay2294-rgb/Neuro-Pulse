import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from flask import Flask
from flask_cors import CORS

from config import (
    JWT_ACCESS_TOKEN_EXPIRES,
    JWT_SECRET_KEY,
    REPORTS_FOLDER,
    SECRET_KEY,
    UPLOAD_FOLDER,
)
from extensions import bcrypt, jwt
from routes.auth_routes import auth_bp
from routes.prediction_routes import prediction_bp


def create_app():
    app = Flask(__name__)
    app.config["SECRET_KEY"] = SECRET_KEY
    app.config["JWT_SECRET_KEY"] = JWT_SECRET_KEY
    app.config["JWT_ACCESS_TOKEN_EXPIRES"] = JWT_ACCESS_TOKEN_EXPIRES
    app.config["MAX_CONTENT_LENGTH"] = 16 * 1024 * 1024

    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
    os.makedirs(REPORTS_FOLDER, exist_ok=True)
    os.makedirs(os.path.join(os.path.dirname(__file__), "data"), exist_ok=True)

    bcrypt.init_app(app)
    jwt.init_app(app)

    CORS(
        app,
        resources={r"/*": {"origins": "*"}},
        supports_credentials=True,
    )

    app.register_blueprint(auth_bp)
    app.register_blueprint(prediction_bp)

    @app.route("/")
    def index():
        return {
            "app": "Neuro Pulse API",
            "auth": [
                "POST /auth/signup",
                "POST /auth/login",
                "POST /auth/google",
                "POST /auth/logout",
                "POST /auth/forgot-password",
                "POST /auth/reset-password",
                "GET /auth/profile",
            ],
            "screening": [
                "GET /questions",
                "POST /predict-symptoms",
                "POST /upload-audio",
                "POST /extract-features",
                "POST /predict",
                "GET /history",
                "POST /chat/messages",
            ],
        }

    return app


app = create_app()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
