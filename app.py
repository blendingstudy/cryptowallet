from flask import Flask, render_template, request, jsonify, send_from_directory, redirect, url_for, session
from flask_cors import CORS
from datetime import datetime
from models import User, Wallet, Transaction
from db_setup import db
import logging
import os

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///database.db'
app.secret_key = 'your_secret_key'  # 세션을 위해 비밀키 설정
db.init_app(app)
CORS(app)

#if __name__ == '__main__':
#   with app.app_context():
#        db.create_all()
#    app.run(debug=True)

# CORS 설정
@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE')
    return response

@app.route('/')
def home():
    return render_template('cryptowallet.html')

@app.route('/signup')
def signup():
    return render_template('creataccount.html')

@app.route('/login', methods=['GET', 'POST'])
def login_page():
    if request.method == 'POST':
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')

        user = User.query.filter_by(username=username).first()
        if user and user.password == password:
            session['is_logged_in'] = True
            session['username'] = username
            session['user_id'] = user.id
            redirect_url = request.args.get('redirect', url_for('wallet'))
            return jsonify({"status": "success", "userId": user.id, "redirect": redirect_url}), 200
        return jsonify({"status": "failure", "message": "Invalid credentials"}), 401

    return render_template('login.html')

@app.route('/wallet')
def wallet():
    if not session.get('is_logged_in'):
        return redirect(url_for('login_page', redirect='wallet'))
    return render_template('wallet.html')

@app.route('/transactions_page')
def transactions_page():
    if not session.get('is_logged_in'):
        return redirect(url_for('login_page', redirect='transactions_page'))
    return render_template('transactions.html')

@app.route('/settings_page')
def settings_page():
    if not session.get('is_logged_in'):
        return redirect(url_for('login_page', redirect='settings_page'))
    return render_template('settings.html')

@app.route('/static/<path:path>')
def send_static(path):
    return send_from_directory('static', path)

@app.route('/<path:path>')
def catch_all(path):
    return render_template('cryptowallet.html')

# 회원가입 엔드포인트
@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    email = data.get('email')

    if User.query.filter_by(username=username).first() or User.query.filter_by(email=email).first():
        return jsonify({'error': 'Username or email already exists'}), 400

    user = User(username=username, password=password, email=email)
    db.session.add(user)
    db.session.commit()

    wallet = Wallet(user_id=user.id)
    db.session.add(wallet)
    db.session.commit()

    return jsonify({'message': 'User registered successfully'}), 201

# 로그 설정
logging.basicConfig(level=logging.DEBUG)

# 지갑 잔고 및 보유 코인 가져오기 엔드포인트
@app.route('/wallet', methods=['GET'])
def get_wallet():
    user_id = request.args.get('user_id')
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404

    wallet = user.wallet
    balance = wallet.balance
    coins = [{'coin': tx.coin, 'amount': tx.amount} for tx in wallet.transactions.filter_by(type='deposit')]

    return jsonify({'balance': balance, 'coins': coins}), 200

# 거래내역 가져오기 엔드포인트
@app.route('/transactions', methods=['GET'])
def get_transactions():
    user_id = request.args.get('user_id')
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404

    wallet = user.wallet
    transactions = [{'type': tx.type, 'coin': tx.coin, 'amount': tx.amount, 'date': tx.date.isoformat()} for tx in wallet.transactions]

    return jsonify({'transactions': transactions}), 200

# 자금 추가 엔드포인트
@app.route('/add-funds', methods=['POST'])
def add_funds():
    data = request.get_json()
    user_id = data.get('user_id')
    amount = data.get('amount')
    payment_method = data.get('payment_method')

    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404

    wallet = user.wallet
    wallet.balance += amount

    transaction = Transaction(wallet_id=wallet.id, type='deposit', coin='USD', amount=amount, date=datetime.now())
    db.session.add(transaction)
    db.session.commit()

    return jsonify({'message': 'Funds added successfully'}), 200

# 비밀번호 변경 엔드포인트
@app.route('/change-password', methods=['PUT'])
def change_password():
    data = request.get_json()
    user_id = data.get('user_id')
    current_password = data.get('current_password')
    new_password = data.get('new_password')

    user = User.query.get(user_id)
    if not user or user.password != current_password:
        return jsonify({'error': 'Invalid current password'}), 401

    user.password = new_password
    db.session.commit()

    return jsonify({'message': 'Password changed successfully'}), 200

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True)