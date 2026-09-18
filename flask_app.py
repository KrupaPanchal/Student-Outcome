"""
Student Outcome and Achievement Data Collection - Flask & MongoDB Backend
Optimized: projection, indexes, connection pooling, threaded server
"""

import os
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from pymongo import MongoClient, ASCENDING, DESCENDING
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

# Projection for LIST queries — strips large base64 PDF dataUrl fields
# so each record in the list is lightweight (no PDF binary blobs)
LIST_PROJECTION = {
    "achievements": 0,
    "exitProgression.admissionDocument.dataUrl": 0,
    "exitProgression.employmentDocument.dataUrl": 0,
    "exitProgression.gstOrOfficialDocument.dataUrl": 0,
    "higherStudies.documentsUploaded": 0,
}

def ensure_indexes():
    """Create indexes for fast queries. Safe to call on every startup (no-op if already exists)."""
    if db is None:
        return
    try:
        db.submissions.create_index([("submittedAt", DESCENDING)], background=True)
        db.submissions.create_index([("academicYear", ASCENDING)], background=True)
        db.submissions.create_index([("semester", ASCENDING)], background=True)
        db.submissions.create_index([("enrollmentNumber", ASCENDING)], background=True)
        print("MongoDB indexes ensured.")
    except Exception as e:
        print(f"Index creation warning (non-fatal): {e}")

try:
    client = MongoClient(
        MONGODB_URI,
        serverSelectionTimeoutMS=5000,
        connectTimeoutMS=5000,
        socketTimeoutMS=15000,
        maxPoolSize=10,   # connection pool — reuse connections across requests
        minPoolSize=2,
        retryWrites=True,
    )
    db = client[DB_NAME]
    client.admin.command('ping')
    print(f"Connected to MongoDB at {MONGODB_URI}")
    ensure_indexes()
except Exception as e:
    print(f"Warning: Could not connect to MongoDB ({e}). Submissions will be logged to local file.")
    client = None
    db = None


# ── Health ─────────────────────────────────────────────────────────────────────

@app.route('/api/health', methods=['GET'])
def health():
    count = 0
    is_mongo = False
    if db is not None:
        try:
            # estimated_document_count is O(1) — uses collection metadata, much faster
            count = db.submissions.estimated_document_count()
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


# ── List & Create Submissions ──────────────────────────────────────────────────

@app.route('/api/submissions', methods=['GET'])
def get_submissions():
    academic_year = request.args.get('academicYear')
    semester = request.args.get('semester')
    search = request.args.get('search', '').strip()

    query = {}
    if academic_year:
        query['academicYear'] = academic_year
    if semester:
        query['semester'] = semester
    if search:
        query['$or'] = [
            {'enrollmentNumber': {'$regex': search, '$options': 'i'}},
            {'fullName': {'$regex': search, '$options': 'i'}},
        ]

    if db is not None:
        try:
            # LIST_PROJECTION skips all heavy base64 PDF data — major speed gain
            cursor = (
                db.submissions
                .find(query, LIST_PROJECTION)
                .sort('submittedAt', DESCENDING)
            )
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
            
            # Sanitize large dataUrl base64 strings to direct download URLs
            def sanitize(item):
                if not isinstance(item, dict): return item
                sub_id = item.get('id') or item.get('_id') or item.get('enrollmentNumber')
                def clean(obj):
                    if isinstance(obj, dict):
                        if 'name' in obj and 'dataUrl' in obj and isinstance(obj['dataUrl'], str) and obj['dataUrl'].startswith('data:'):
                            return {**obj, 'dataUrl': f"/api/submissions/{sub_id}/file?name={obj['name']}"}
                        return {k: clean(v) for k, v in obj.items()}
                    elif isinstance(obj, list):
                        return [clean(v) for v in obj]
                    return obj
                return clean(item)

            if request.args.get('full') != 'true':
                items = [sanitize(x) for x in items]
            return jsonify(items)
    except Exception:
        return jsonify([])

@app.route('/api/submissions/<submission_id>/file', methods=['GET'])
def get_submission_file(submission_id):
    file_name = request.args.get('name', '').lower()
    download = request.args.get('download') in ['1', 'true']
    
    # Check mongo or local
    doc = None
    if db is not None:
        try:
            doc = db.submissions.find_one({'_id': ObjectId(submission_id)})
        except Exception:
            pass
    if doc is None:
        try:
            with open('data/submissions.json', 'r') as f:
                items = json.load(f)
            doc = next((x for x in items if str(x.get('id')) == str(submission_id) or str(x.get('_id')) == str(submission_id) or str(x.get('enrollmentNumber')) == str(submission_id)), None)
        except Exception:
            pass

    if not doc:
        return jsonify({'error': 'Submission not found'}), 404

    found = []
    def extract_files(obj):
        if isinstance(obj, dict):
            if 'name' in obj and 'dataUrl' in obj and isinstance(obj['dataUrl'], str):
                found.append(obj)
            for v in obj.values():
                extract_files(v)
        elif isinstance(obj, list):
            for v in obj:
                extract_files(v)

    extract_files(doc)
    match = next((f for f in found if not file_name or f.get('name', '').lower() == file_name), None)
    if not match:
        return jsonify({'error': 'File not found'}), 404

    data_url = match.get('dataUrl', '')
    if data_url.startswith('data:'):
        import base64
        import io
        header, encoded = data_url.split(',', 1)
        mime = header.split(';')[0].replace('data:', '') or 'application/pdf'
        data_bytes = base64.b64decode(encoded)
        filename = match.get('name', 'document.pdf')
        return send_file(
            io.BytesIO(data_bytes),
            mimetype=mime,
            as_attachment=download,
            download_name=filename
        )
    elif data_url.startswith('http') or data_url.startswith('/'):
        return redirect(data_url)
    return jsonify({'error': 'Invalid file data'}), 400


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


# ── Single Submission (full doc including PDFs for edit/view) ──────────────────

@app.route('/api/submissions/<submission_id>', methods=['GET'])
def get_submission(submission_id):
    if db is not None:
        try:
            # No projection — return full document including PDF data for editing
            doc = db.submissions.find_one({'_id': ObjectId(submission_id)})
            if doc:
                doc['_id'] = str(doc['_id'])
                return jsonify(doc)
            return jsonify({'error': 'Not found'}), 404
        except Exception as e:
            return jsonify({'error': str(e)}), 500

    try:
        with open('data/submissions.json', 'r') as f:
            items = json.load(f)
        doc = next((x for x in items if x.get('id') == submission_id or x.get('_id') == submission_id), None)
        if doc:
            return jsonify(doc)
        return jsonify({'error': 'Not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/submissions/<submission_id>', methods=['PUT'])
def update_submission(submission_id):
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    data['updatedAt'] = datetime.utcnow().isoformat()
    data.pop('_id', None)

    if db is not None:
        try:
            result = db.submissions.update_one(
                {'_id': ObjectId(submission_id)},
                {'$set': data}
            )
            if result.matched_count == 0:
                return jsonify({'error': 'Record not found'}), 404
            return jsonify({'success': True, 'message': 'Record updated successfully'})
        except Exception as e:
            return jsonify({'error': str(e)}), 500

    try:
        with open('data/submissions.json', 'r') as f:
            items = json.load(f)
        updated = False
        for i, item in enumerate(items):
            if item.get('id') == submission_id or item.get('_id') == submission_id:
                items[i] = {**item, **data}
                updated = True
                break
        if not updated:
            return jsonify({'error': 'Record not found'}), 404
        with open('data/submissions.json', 'w') as f:
            json.dump(items, f, indent=2)
        return jsonify({'success': True, 'message': 'Record updated successfully'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/submissions/<submission_id>', methods=['DELETE'])
def delete_submission(submission_id):
    if db is not None:
        try:
            result = db.submissions.delete_one({'_id': ObjectId(submission_id)})
            if result.deleted_count == 0:
                return jsonify({'error': 'Record not found'}), 404
            return jsonify({'success': True, 'message': 'Record deleted'})
        except Exception as e:
            return jsonify({'error': str(e)}), 500

    try:
        with open('data/submissions.json', 'r') as f:
            items = json.load(f)
        new_items = [x for x in items if x.get('id') != submission_id and x.get('_id') != submission_id]
        if len(new_items) == len(items):
            return jsonify({'error': 'Record not found'}), 404
        with open('data/submissions.json', 'w') as f:
            json.dump(new_items, f, indent=2)
        return jsonify({'success': True, 'message': 'Record deleted'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    port = int(os.getenv("PORT", 5000))
    # threaded=True lets Flask handle multiple concurrent requests
    app.run(host='0.0.0.0', port=port, debug=True, threaded=True)
