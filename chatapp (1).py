import os
import uuid
from functools import wraps
from datetime import datetime, timedelta, timezone
from flask import Flask, request, jsonify
from flask_cors import CORS
# Make sure quantum_otp_generator.py is in the same directory
import quantum_otp_generator as q_otp

# --- In-memory store (for development) ---
# In production, replace this with a database like Redis.
otp_store = {}

# --- A decorator to protect API routes ---
def require_api_key(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        api_key = request.headers.get('X-API-Key')
        if not api_key or not is_valid_api_key_in_db(api_key):
            return jsonify({"error": "Unauthorized: Invalid or missing API Key"}), 401
        return f(*args, **kwargs)
    return decorated_function

def is_valid_api_key_in_db(key):
    # This is a placeholder for your database lookup logic.
    # In a real app, you would query your `api_keys` table.
    # For this example, 'SECRET-KEY-123' is the only valid key.
    print(f"Validating API Key: {key}")
    return key == 'SECRET-KEY-123'

# --- Flask App Setup ---
app = Flask(__name__)
# Adding CORS is crucial for allowing web pages to call your API
CORS(app)

# --- API Endpoints ---

@app.route('/api/v1/request-otp', methods=['POST'])
@require_api_key
def request_otp_v1():
    data = request.get_json()
    end_user_email = data.get('email')

    if not end_user_email:
        return jsonify({"error": "The 'email' of the end-user is required"}), 400

    # 1. Generate a real quantum OTP
    otp = q_otp.generate_quantum_otp(6)
    otp_expiration = datetime.now(timezone.utc) + timedelta(minutes=5)

    # 2. Store it temporarily (simulating Redis)
    otp_store[end_user_email] = {"otp": otp, "otp_expiration": otp_expiration}

    # 3. Simulate sending the email
    try:
        q_otp.send_otp_by_email(otp, end_user_email)
        return jsonify({"message": f"OTP sent to {end_user_email}."}), 200
    except Exception as e:
        app.logger.error(f"Failed to send email: {e}")
        return jsonify({"error": "Failed to send OTP email."}), 500
    # In a real app, you would call: send_email_via_sendgrid(end_user_email, otp)
    print(f"OTP for {end_user_email} is: {otp} (This would normally be emailed)")

    return jsonify({"message": f"An OTP has been generated for {end_user_email}."}), 200


@app.route('/api/v1/verify-otp', methods=['POST'])
@require_api_key
def verify_otp_v1():
    data = request.get_json()
    end_user_email = data.get('email')
    submitted_otp = data.get('otp')

    if not end_user_email or not submitted_otp:
        return jsonify({"error": "Email and OTP are required"}), 400

    # Check the OTP against the in-memory store
    user_data = otp_store.get(end_user_email)

    if not user_data:
        return jsonify({"success": False, "message": "No OTP found for this email. Please request one first."}), 404

    if datetime.now(timezone.utc) > user_data["otp_expiration"]:
        return jsonify({"success": False, "message": "OTP has expired."}), 400
        
    if user_data["otp"] == submitted_otp:
        # Clear the OTP after successful verification
        del otp_store[end_user_email]
        return jsonify({"success": True, "message": "OTP verified successfully."}), 200
    else:
        return jsonify({"success": False, "message": "Invalid OTP."}), 400

if __name__ == '__main__':
    app.run(debug=True, port=5001)

