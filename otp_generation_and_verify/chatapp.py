import os
import uuid
import hashlib 
from functools import wraps
from datetime import datetime, timedelta, timezone
from flask import Flask, request, jsonify
from flask_cors import CORS
import psycopg2
from dotenv import load_dotenv
import quantum_otp_generator as q_otp
# --- loads the confidential varibles from the env file ---
load_dotenv()

# ---function used to establish the connection between the service and database ---

def get_db_connection():
    """Establishes a connection to the database."""
    try:
        conn = psycopg2.connect(os.environ.get('DATABASE_URL'))
        return conn
    except psycopg2.OperationalError as e:
        print(f"ERROR: Could not connect to database: {e}")
        return None

# --- checks the give api key is given or not if given checks validity ---

def require_api_key(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        api_key = request.headers.get('X-API-Key')
        if not api_key or not is_valid_api_key_in_db(api_key):
            return jsonify({"error": "Unauthorized: Invalid or missing API Key"}), 401
        return f(*args, **kwargs) 
    return decorated_function

# --- checks the give api valid or not ---

def is_valid_api_key_in_db(key):
    """Checks if the provided API key exists in the database."""
    conn = get_db_connection()
    if conn is None: return False
    is_valid = False
    try:
        cur = conn.cursor()
        cur.execute("SELECT id FROM api_keys WHERE api_key = %s;", (key,))
        if cur.fetchone(): is_valid = True
        cur.close()
    except Exception as e:
        print(f"ERROR: Database query failed: {e}")
    finally:
        if conn: conn.close()
    return is_valid

# --- defines the flask serevr ---
app = Flask(__name__)
CORS(app)

# --- API Endpoints ---
# --- requests otp from the generator ---
@app.route('/api/v1/request-otp', methods=['POST'])
@require_api_key
def request_otp_v1():
    data = request.get_json()
    end_user_email = data.get('email')

    if not end_user_email:
        return jsonify({"error": "The 'email' of the end-user is required"}), 400

    otp = q_otp.generate_quantum_otp(6)
    otp_expiration = datetime.now(timezone.utc) + timedelta(minutes=5)
    
    # --- Hash the OTP before storing it in database ---
    otp_hash = hashlib.sha256(otp.encode()).hexdigest()

    conn = get_db_connection()
    if conn is None:
        return jsonify({"error": "Database service is unavailable."}), 503
        
    try:
        cur = conn.cursor()
        # Use UPSERT to insert a new OTP or update an existing one for the same email
        sql = """
            INSERT INTO active_otps (user_email, otp_hash, expires_at)
            VALUES (%s, %s, %s)
            ON CONFLICT (user_email) DO UPDATE SET
                otp_hash = EXCLUDED.otp_hash,
                expires_at = EXCLUDED.expires_at;
        """
        cur.execute(sql, (end_user_email, otp_hash, otp_expiration))
        conn.commit()
        cur.close()
    except Exception as e:
        app.logger.error(f"Failed to store OTP in DB: {e}")
        return jsonify({"error": "Failed to process OTP request."}), 500
    finally:
        if conn: conn.close()
    
    # --- Send the plain-text OTP via email ---
    try:
        q_otp.send_otp_by_email(otp, end_user_email)
        return jsonify({"message": f"OTP sent to {end_user_email}."}), 200
    except Exception as e:
        app.logger.error(f"Failed to send email: {e}")
        return jsonify({"error": "Failed to send OTP email."}), 500

@app.route('/api/v1/verify-otp', methods=['POST'])
@require_api_key
# --- otp verification ---
def verify_otp_v1():
    data = request.get_json()
    end_user_email = data.get('email')
    submitted_otp = data.get('otp')

    if not end_user_email or not submitted_otp:
        return jsonify({"error": "Email and OTP are required"}), 400

    conn = get_db_connection()
    if conn is None:
        return jsonify({"error": "Database service is unavailable."}), 503

    try:
        cur = conn.cursor()
        cur.execute("SELECT otp_hash, expires_at FROM active_otps WHERE user_email = %s;", (end_user_email,))
        result = cur.fetchone()

        if not result:
            return jsonify({"success": False, "message": "No OTP found for this email. Please request one first."}), 404

        stored_hash, expires_at = result

        if datetime.now(timezone.utc) > expires_at:
            # ---Clean up expired OTP from the DB---
            cur.execute("DELETE FROM active_otps WHERE user_email = %s;", (end_user_email,))
            conn.commit()
            return jsonify({"success": False, "message": "OTP has expired."}), 400
        
        # --- Hash the submitted OTP and compare it with the stored hash ---
        submitted_otp_hash = hashlib.sha256(submitted_otp.encode()).hexdigest()
        
        if submitted_otp_hash == stored_hash:
            # ---Clean up the used OTP from the DB ---
            cur.execute("DELETE FROM active_otps WHERE user_email = %s;", (end_user_email,))
            conn.commit()
            return jsonify({"success": True, "message": "OTP verified successfully."}), 200
        else:
            return jsonify({"success": False, "message": "Invalid OTP."}), 400

    except Exception as e:
        app.logger.error(f"Failed to verify OTP from DB: {e}")
        return jsonify({"error": "Failed to process OTP verification."}), 500
    finally:
        cur.close()
        if conn: conn.close()

if __name__ == '__main__':
    app.run(debug=True, port=5001)