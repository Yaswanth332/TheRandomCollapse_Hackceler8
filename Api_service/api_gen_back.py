import os
import psycopg2
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import api_gen # Your updated api_gen.py file

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)

# --- Database Connection ---
def get_db_connection():
    """Establishes a connection to the database."""
    try:
        conn = psycopg2.connect(os.environ.get('DATABASE_URL'))
        return conn
    except psycopg2.OperationalError as e:
        app.logger.error(f"Could not connect to database: {e}")
        return None

# --- CORS ---
frontend_url = os.environ.get('FRONTEND_URL', '*')
CORS(app, origins=[frontend_url], supports_credentials=True)

@app.route('/api/generate-key', methods=['POST'])
def generate_key():
    """
    Generates a unique API key for a given email and stores it in the database.
    An email can only have one key.
    """
    data = request.get_json()
    email = data.get('email')
    creator = data.get('creator', 'user_request')
    company_name = data.get('company_name') # Get company name from request

    if not email:
        return jsonify({"error": "Email is required"}), 400

    conn = get_db_connection()
    if conn is None:
        return jsonify({"error": "Database connection failed."}), 500
    
    cur = conn.cursor()

    try:
        # Check if the email already has an API key
        cur.execute("SELECT api_key FROM api_keys WHERE email = %s;", (email,))
        existing_key = cur.fetchone()
        if existing_key:
            return jsonify({"message": "An API key for this email already exists."}), 409 # Using 409 Conflict is more specific

        # Generate a new, unique API key
        while True:
            new_key = api_gen.generate_quantum_api_key(52)
            cur.execute("SELECT id FROM api_keys WHERE api_key = %s;", (new_key,))
            if cur.fetchone() is None:
                break # Key is unique, exit loop

        # Insert the new key and company name into the database
        cur.execute(
            "INSERT INTO api_keys (email, api_key, created_by, company_name) VALUES (%s, %s, %s, %s);",
            (email, new_key, creator, company_name)
        )
        conn.commit()

        # Send the API key to the user's email
        try:
            api_gen.send_api_key_by_email(new_key, email)
        except Exception as e:
            app.logger.error(f"Failed to send API key email to {email}: {e}")
            # The key is in the DB, so we still return success but note the email failure.
            return jsonify({
                "message": "API key generated successfully but failed to send email.",
                "api_key": new_key 
            }), 201
            
        # Return success message and the new key
        return jsonify({
            "message": f"API key successfully generated and sent to {email}.",
            "api_key": new_key
        }), 201

    except Exception as e:
        conn.rollback()
        app.logger.error(f"An error occurred: {e}")
        return jsonify({"error": "An internal error occurred."}), 500
    finally:
        cur.close()
        conn.close()


if __name__ == '__main__':
    app.run(debug=True, port=5000)