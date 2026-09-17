"""
Student Outcome and Achievement Data Collection - Flask & MongoDB Backend
Runs with Python Flask & PyMongo
"""

import os
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from pymongo import MongoClient
from bson.objectid import ObjectId
import json
from datetime import datetime

app = Flask(__name__)
CORS(app)

# MongoDB Configuration
MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017/student_outcomes")
DB_NAME = os.getenv("DB_NAME", "student_outcomes")

client = None
db = None

try:
    client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=4000)
    db = client[DB_NAME]
    # Quick ping
    client.admin.command('ping')
    print(f"Connected to MongoDB at {MONGODB_URI}")
except Exception as e:
    print(f"Warning: Could not connect to MongoDB ({e}). Submissions will be logged to local file.")
    client = None
    db = None

@app.route('/api/health', methods=['GET'])
def health():
    count = 0
    is_mongo = False
    if db is not None:
        try:
            count = db.submissions.count_documents({})
            is_mongo = True
        except Exception:
            pass
    return jsonify({
        "status": "ok",
        "backend": "Python Flask",
        "database": "MongoDB" if is_mongo else "Local File Store",
        "isMongo": is_mongo,
        "totalSubmissions": count
    })

@app.route('/api/submissions', methods=['GET'])
def get_submissions():
    academic_year = request.args.get('academicYear')
    semester = request.args.get('semester')
    search = request.args.get('search')

    query = {}
    if academic_year:
        query['academicYear'] = academic_year
    if semester:
        query['semester'] = semester
    if search:
        query['$or'] = [
            {'enrollmentNumber': {'$regex': search, '$options': 'i'}},
            {'fullName': {'$regex': search, '$options': 'i'}}
        ]

    if db is not None:
        try:
            cursor = db.submissions.find(query).sort('submittedAt', -1)
            results = []
            for doc in cursor:
                doc['_id'] = str(doc['_id'])
                results.append(doc)
            return jsonify(results)
        except Exception as e:
            return jsonify({"error": str(e)}), 500
    
    # Fallback to local json
    try:
        with open('data/submissions.json', 'r') as f:
            items = json.load(f)
            return jsonify(items)
    except Exception:
        return jsonify([])

@app.route('/api/submissions', methods=['POST'])
def create_submission():
    data = request.get_json()
    if not data or not data.get('enrollmentNumber') or not data.get('fullName'):
        return jsonify({"error": "Enrollment number and Full Name are required"}), 400

    data['submittedAt'] = data.get('submittedAt') or datetime.utcnow().isoformat()

    if db is not None:
        try:
            res = db.submissions.insert_one(data)
            return jsonify({
                "success": True,
                "id": str(res.inserted_id),
                "message": "Saved to MongoDB database successfully"
            }), 201
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    # Local fallback
    os.makedirs('data', exist_ok=True)
    items = []
    if os.path.exists('data/submissions.json'):
        with open('data/submissions.json', 'r') as f:
            try:
                items = json.load(f)
            except Exception:
                items = []
    data['id'] = str(int(datetime.utcnow().timestamp() * 1000))
    items.insert(0, data)
    with open('data/submissions.json', 'w') as f:
        json.dump(items, f, indent=2)

    return jsonify({
        "success": True,
        "id": data['id'],
        "message": "Saved to local storage successfully"
    }), 201

if __name__ == '__main__':
    port = int(os.getenv("PORT", 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
