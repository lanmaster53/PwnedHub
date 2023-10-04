from flask import Blueprint, g, current_app, request, jsonify, abort, Response, url_for
from flask_restful import Resource, Api
from pwnedapi import db
from pwnedapi.constants import DEFAULT_NOTE
from pwnedapi.decorators import token_auth_required, roles_required, validate_json, csrf_protect
from pwnedapi.models import Config, User, Note, Message, Tool, Scan, Room
from pwnedapi.utils import generate_code, get_bearer_token, encode_jwt, decode_jwt, unfurl_url, send_email, CsrfToken
from pwnedapi.validators import is_valid_command
from datetime import datetime
from sqlalchemy import select, text
import jwt
import requests

resources = Blueprint('resources', __name__)
api = Api()
api.init_app(resources)

# PRE-REQUEST FUNCTIONS

@resources.before_app_request
def parse_jwt():
    request.jwt = {}
    token = request.cookies.get('access_token')
    if Config.get_value('BEARER_AUTH_ENABLE'):
        bearer_token = get_bearer_token(request.headers)
    try:
        payload = decode_jwt(bearer_token)
    except:
        return
    request.jwt = payload

@resources.before_app_request
def load_user():
    g.user = None
    uid = request.jwt.get('sub')
    if uid:
        g.user = User.query.get(uid)

# API RESOURCE CLASSES

class TokenList(Resource):

    def post(self):
        '''Returns a JWT for the user that owns the provided credentials.'''
        json_data = request.get_json(force=True)
        code = json_data.get('code')
        code_token = json_data.get('code_token')
        id_token = json_data.get('id_token')
        username = json_data.get('username')
        user = None
        default_message = 'Invalid username.'
        # process passwordless credentials
        if code and code_token:
            try:
                payload = decode_jwt(code_token)
            except:
                payload = {}
            if code == payload.get('code'):
                user = User.query.get(payload.get('sub'))
            else:
                default_message = 'Expired or invalid Passwordless Authentication code.'
        # process OIDC credentials (ID token)
        elif id_token:
            try:
                if Config.get_value('JWT_VERIFY'):
                    well_known_url = current_app.config['OAUTH_PROVIDERS']['google']['DISCOVERY_DOC']
                    with requests.get(well_known_url) as response:
                        jwks_url = response.json()['jwks_uri']
                    jwks_client = jwt.PyJWKClient(jwks_url)
                    header = jwt.get_unverified_header(id_token)
                    key = jwks_client.get_signing_key(header['kid']).key
                    # Google doesn't encrypt the ID token, so no need for the wrapper
                    payload = jwt.decode(id_token, key=key, algorithms=[header['alg']], options={'verify_aud': False})
                else:
                    # Google doesn't encrypt the ID token, so no need for the wrapper
                    payload = jwt.decode(id_token, options={'verify_signature': False})
            except:
                payload = {}
            email = payload.get('email')
            if email:
                user = User.get_by_email(email)
                if not user:
                    # register the user
                    user = User(
                        username=email.split('@')[0],
                        email=email,
                        avatar=payload['picture'],
                        signature='',
                        name=payload['name'],
                    )
                    db.session.add(user)
                    db.session.commit()
            else:
                default_message = 'Expired or invalid ID token.'
        # initialize passwordless authentication
        elif username:
            user = User.get_by_username(username)
            if user:
                code = generate_code(6)
                # email code to user
                send_email(
                    sender = User.query.first().email,
                    recipient = user.email,
                    subject = 'PwnedHub Passwordless Authentication',
                    body = f"Hi {user.name}!<br><br>Below is your Passwordless Authentication code.<br><br>{code}<br><br>If you did not trigger a login attempt, please respond to this email to reach an administrator. Thank you.",
                )
                # add random code to claims
                claims = {'code': code}
                # create a JWT
                code_token = encode_jwt(user.id, claims=claims, expire_delta={'days': 0, 'seconds': 300})
                data = {
                    'error': 'code_required',
                    'code_token': code_token
                }
                return data, 403
        # handle authentication
        if user and user.is_enabled:
            data = {'user': user.serialize()}
            # build other claims
            claims = {}
            # create a JWT
            token = encode_jwt(user.id, claims=claims)
            # send the JWT as a Bearer token when the feature is enabled
            if Config.get_value('BEARER_AUTH_ENABLE'):
                data['access_token'] = token
                # remove any existing access token cookie
                return data, 201, {'Set-Cookie': 'access_token=; Expires=Thu, 01-Jan-1970 00:00:00 GMT'}
            # default to cookie authentication
            # return a CSRF token when using cookie authentication
            csrf_obj = CsrfToken(user.id)
            csrf_obj.sign(current_app.config['SECRET_KEY'])
            data['csrf_token'] = csrf_obj.serialize()
            # set the JWT as a HttpOnly cookie
            return data, 201, {'Set-Cookie': f"access_token={token}; HttpOnly"}
        abort(400, default_message)

    def delete(self):
        response = Response(None, 204)
        response.delete_cookie('access_token')
        return response

api.add_resource(TokenList, '/access-token')


class UserList(Resource):

    @token_auth_required
    def get(self):
        users = [u.serialize() for u in User.query.all()]
        return {'users': users}

    @validate_json(['username', 'email', 'name'])
    def post(self):
        '''Creates an account.'''
        username = request.json.get('username')
        if User.query.filter_by(username=username).first():
            abort(400, 'Username already exists.')
        email = request.json.get('email')
        if User.query.filter_by(email=email).first():
            abort(400, 'Email already exists.')
        user = User(**request.json)
        db.session.add(user)
        db.session.commit()
        return {'success': True}, 201

api.add_resource(UserList, '/users')


class UserInst(Resource):

    @token_auth_required
    def get(self, uid):
        user = User.query.get_or_404(uid)
        return user.serialize()

    @token_auth_required
    @csrf_protect
    @validate_json(['username', 'email', 'name'])
    def patch(self, uid):
        if uid != 'me' and uid != str(g.user.id):
            abort(403)
        user = g.user
        # validate that the provided username doesn't belong to another user
        username = request.json.get('username', user.username)
        untrusted_user = User.query.filter_by(username=username).first()
        if untrusted_user and untrusted_user != g.user:
            abort(400, 'Username already exists.')
        # validate that the provided email doesn't belong to another user
        email = request.json.get('email', user.email)
        untrusted_user = User.query.filter_by(email=email).first()
        if untrusted_user and untrusted_user != g.user:
            abort(400, 'Email already exists.')
        # update the user object
        user.username = username
        user.email = email
        user.name = request.json.get('name', user.name)
        user.avatar = request.json.get('avatar', user.avatar)
        user.signature = request.json.get('signature', user.signature)
        db.session.add(user)
        db.session.commit()
        return user.serialize()

api.add_resource(UserInst, '/users/<string:uid>')


class AdminUserInst(Resource):

    @token_auth_required
    @roles_required('admin')
    def patch(self, uid):
        user = User.query.get_or_404(uid)
        if user == g.user:
            abort(400, 'Self-administration not permitted.')
        user.role = request.json.get('role', user.role)
        user.status = request.json.get('status', user.status)
        db.session.add(user)
        db.session.commit()
        return user.serialize()

api.add_resource(AdminUserInst, '/admin/users/<string:uid>')


class NoteInst(Resource):

    @token_auth_required
    def get(self):
        note = g.user.notes.first()
        content = note.content if note else DEFAULT_NOTE
        return {'content': content}

    @token_auth_required
    @validate_json(['content'])
    def put(self):
        note = g.user.notes.first()
        if not note:
            note = Note(name='Notes', owner=g.user)
        note.content = request.json.get('content')
        db.session.add(note)
        db.session.commit()
        return {'success': True}

api.add_resource(NoteInst, '/notes')


class RoomMessageList(Resource):

    @token_auth_required
    def get(self, rid):
        room = Room.query.get_or_404(rid)
        if room not in g.user.rooms.all():
            abort(403)
        result = {
            'messages': [],
            'cursor': None,
            'next': None,
        }
        cursor = float(request.args.get('cursor', datetime.now().timestamp()))
        size = request.args.get('size', 8)
        messages = room.messages.filter(Message.created < datetime.fromtimestamp(cursor)).order_by(Message.created.desc()).all()
        if messages:
            paged_messages = messages[:size]
            next_cursor = str(paged_messages[-1].created.timestamp())
            next_url = None
            if messages[-1].created < paged_messages[-1].created:
                next_url = url_for('resources.roommessagelist', rid=room.id, cursor=next_cursor, _external=True)
            paged_messages.reverse()
            result = {
                'messages': [m.serialize() for m in paged_messages],
                'cursor': next_cursor,
                'next': next_url,
            }
        resp = jsonify(result)
        resp.mimetype = 'text/html'
        return resp

api.add_resource(RoomMessageList, '/rooms/<string:rid>/messages')


class UnfurlList(Resource):

    def post(self):
        url = request.json.get('url')
        headers = {}
        if url:
            try:
                data = unfurl_url(url, headers)
                status = 201
            except Exception as e:
                data = {'error': 'UnfurlError', 'message': str(e)}
                status = 500
        else:
            data = {'error': 'RequestError', 'message': 'Invalid request.'}
            status = 400
        return data, status

api.add_resource(UnfurlList, '/unfurl')


class ToolList(Resource):

    @token_auth_required
    def get(self):
        tools = [t.serialize() for t in Tool.query.all()]
        return {'tools': tools}

    @token_auth_required
    @roles_required('admin')
    @validate_json(['name', 'path', 'description'])
    def post(self):
        tool = Tool(
            name=request.json.get('name'),
            path=request.json.get('path'),
            description=request.json.get('description'),
        )
        db.session.add(tool)
        db.session.commit()
        return tool.serialize(), 201

api.add_resource(ToolList, '/tools')


class ToolInst(Resource):

    @token_auth_required
    def get(self, tid):
        query = select(Tool.id, Tool.name, Tool.path, Tool.description).where(text('id={}'.format(tid)))
        tool = {}
        try:
            row = db.session.execute(query).first()
            if row:
                tool = dict(row._mapping)
        except:
            pass
        return tool

    @token_auth_required
    @roles_required('admin')
    def delete(self, tid):
        tool = Tool.query.get_or_404(tid)
        db.session.delete(tool)
        db.session.commit()
        return '', 204

api.add_resource(ToolInst, '/tools/<string:tid>')


class ScanList(Resource):

    @token_auth_required
    def get(self):
        scans = [s.serialize() for s in g.user.scans.order_by(Scan.created.asc())]
        return {'scans': scans}

    @token_auth_required
    @validate_json(['tid', 'args'])
    def post(self):
        tool = Tool.query.get(request.json.get('tid') or -1)
        if not tool:
            abort(400, 'Invalid tool ID.')
        path = tool.path
        args = request.json.get('args')
        cmd = '{} {}'.format(path, args)
        error = False
        if not is_valid_command(cmd):
            abort(400, 'Command contains invalid characters.')
        job = current_app.api_task_queue.enqueue('pwnedapi.tasks.execute_tool', cmd)
        sid = job.get_id()
        scan = Scan(id=sid, command=cmd, owner=g.user)
        db.session.add(scan)
        db.session.commit()
        return scan.serialize(), 201

api.add_resource(ScanList, '/scans')


class ScanInst(Resource):

    @token_auth_required
    def delete(self, sid):
        scan = Scan.query.get_or_404(sid)
        if scan.owner != g.user:
            abort(403)
        db.session.delete(scan)
        db.session.commit()
        return '', 204

api.add_resource(ScanInst, '/scans/<string:sid>')


class ResultsInst(Resource):

    @token_auth_required
    def get(self, sid):
        scan = Scan.query.get_or_404(sid)
        if scan.owner != g.user:
            abort(403)
        return {'results': scan.results}

api.add_resource(ResultsInst, '/scans/<string:sid>/results')
