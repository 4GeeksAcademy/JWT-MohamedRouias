"""
This module takes care of starting the API Server, Loading the DB and Adding the endpoints
"""
import os
from flask import Flask, request, jsonify, url_for, send_from_directory
from flask_migrate import Migrate
from flask_swagger import swagger
from api.utils import APIException, generate_sitemap
from api.models import db
from api.routes import api
from api.admin import setup_admin
from api.commands import setup_commands
from flask_jwt_extended import create_access_token, get_jwt, get_jwt_identity, jwt_required, JWTManager
from flask_bcrypt import Bcrypt
from api.models import db,  User
from flask_cors import CORS

# from models import Person

ENV = "development" if os.getenv("FLASK_DEBUG") == "1" else "production"
static_file_dir = os.path.join(os.path.dirname(
    os.path.realpath(__file__)), '../dist/')
app = Flask(__name__)
app.url_map.strict_slashes = False
bcrypt = Bcrypt(app)

CORS(app,

     origins=["https://literate-funicular-69gqxjprj4jphrp7r-3000.app.github.dev/"],
     supports_credentials=True,
     allow_headers=["Content-Type", "Authorization"],
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])

# database condiguration
db_url = os.getenv("DATABASE_URL")
if db_url is not None:
    app.config['SQLALCHEMY_DATABASE_URI'] = db_url.replace(
        "postgres://", "postgresql://")
else:
    app.config['SQLALCHEMY_DATABASE_URI'] = "sqlite:////tmp/test.db"


app.config["JWT_SECRET_KEY"] = os.getenv('JWT_KEY')
jwt = JWTManager(app)

app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
MIGRATE = Migrate(app, db, compare_type=True)
db.init_app(app)

# add the admin
setup_admin(app)

# add the admin
setup_commands(app)

# Add all endpoints form the API with a "api" prefix
app.register_blueprint(api, url_prefix='/api')

# Handle/serialize errors like a JSON object


@app.errorhandler(APIException)
def handle_invalid_usage(error):
    return jsonify(error.to_dict()), error.status_code

# generate sitemap with all your endpoints


@app.route('/')
def sitemap():
    if ENV == "development":
        return generate_sitemap(app)
    return send_from_directory(static_file_dir, 'index.html')

# any other endpoint will try to serve it like a static file


@app.route('/<path:path>', methods=['GET'])
def serve_any_other_file(path):
    if not os.path.isfile(os.path.join(static_file_dir, path)):
        path = 'index.html'
    response = send_from_directory(static_file_dir, path)
    response.cache_control.max_age = 0  # avoid cache memory
    return response

# -------------------------------USER----------------------------------
# lo usaré para la primera prueba


@app.route('/users/<int:id>', methods=['GET'])
@jwt_required()
def get_user_by_id(id):
    # query.get solo funciona para devolver primary key. para devolver otro campo usar query.filter_by
    user = User.query.get(id)
    print(user)
    acces_token = create_access_token(identity=user.email)  # genero token
    if user is None:
        return jsonify({'msg': 'Usuario no encontrado'}), 404
    return jsonify({'msg': 'ok', 'token': acces_token, 'result': user.serialize()}), 200


# -------------------------------REGISTER ----------------------------------


@app.route('/register', methods=['POST'])
def register():
    body = request.get_json(silent=True)
    if body is None:
        return jsonify({'msg': 'Debes enviar informarmación en el body'}), 400
    if 'email' not in body:
        return jsonify({'msg': 'El campo email es obligatorio'}), 400
    if 'password' not in body:
        return jsonify({'msg': 'El campo password es obligatorio'}), 400
    new_user = User()
    new_user.email = body['email']
    new_user.password = bcrypt.generate_password_hash(
        body['password']).decode('utf-8')  # se guardo contraseña encriptada
    new_user.is_active = True
    db.session.add(new_user)
    db.session.commit()
    return jsonify({'msg': f'Usuario {new_user.email} CREADO'}), 201


# -------------------------------LOGIN ----------------------------------


@app.route('/login', methods=['POST'])
def login():

    body = request.get_json(silent=True)
    print(body)
    if body is None:
        return jsonify({'msg': 'Debes enviar información en el body'}), 400
    if 'email' not in body:
        return jsonify({'msg': 'El campo email es obligatorio'}), 400
    if 'password' not in body:
        return jsonify({'msg': 'El campo password es obligatorio'}), 400

    user = User.query.filter_by(email=body['email']).first()

    if user is None:
        return jsonify({'msg': 'Usuario o contraseña errónea'}), 400

    print(user.password)

    password_correct = bcrypt.check_password_hash(

        # returns True. chequea si la contraseña recibida es la misma de la BD
        user.password, body['password'])

    if not password_correct:
        return jsonify({'msg': 'Usuario o contraseña errónea'}), 400

    acces_token = create_access_token(identity=user.email)  # genero token
    return jsonify({'msg': 'OK',
                    'Token': acces_token,
                    'user': {
                        'id': user.id,
                        'email': user.email
                    }}), 200


# -------------------------------PROTECTED ----------------------------------


@app.route('/protected', methods=['GET'])
@jwt_required()
def protected():
    # sabemos quien es el usuario que hace la petición
    current_user_id = get_jwt_identity()
    return jsonify({'msg': f'Acceso del usuario {current_user_id} ACEPTADO'}), 200


# -------------------------------PRIVATE ---OK--------------------------------

@app.route('/private', methods=['GET'])
@jwt_required()
def private():
    current_user_email = get_jwt_identity()
    user = User.query.filter_by(email=current_user_email).first()

    if user is None:
        return jsonify({'msg': 'Usuario no encontrado'}), 404

    return jsonify({
        'msg': 'Acceso autorizado',
        'user': user.serialize()
    }), 200


# this only runs if `$ python src/main.py` is executed
if __name__ == '__main__':
    PORT = int(os.environ.get('PORT', 3001))
    app.run(host='0.0.0.0', port=PORT, debug=True)
