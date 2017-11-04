from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_spyne import Spyne
from flask_session import Session
from datetime import datetime


db = SQLAlchemy()
spyne = Spyne()
sess = Session()


def create_app(config='Development'):

    # setting the static_url_path to blank serves static
    # files from the web root, allowing for robots.txt
    app = Flask(__name__, static_url_path='')
    app.config.from_object('pwnedhub.config.{}'.format(config.title()))

    db.init_app(app)
    spyne.init_app(app)
    sess.init_app(app)

    # register new jinja global for the current date
    # used in the layout to keep the current year
    app.jinja_env.globals['date'] = datetime.now()

    from views import ph_bp
    app.register_blueprint(ph_bp)

    return app


def init_db(config='Development'):
    app = create_app(config)
    with app.app_context():
        db.create_all()
    print 'Database initialized.'


def drop_db(config='Development'):
    app = create_app(config)
    with app.app_context():
        db.drop_all()
    print 'Database dropped.'


def make_admin(username, config='Development'):
    app = create_app(config)
    with app.app_context():
        user = models.User.get_by_username(username)
        user.role = 0
        db.session.add(user)
        db.session.commit()


def start():
    app = create_app()
    app.run()
