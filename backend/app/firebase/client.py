import os
import json
import threading
from datetime import datetime, timezone
import firebase_admin
from firebase_admin import credentials, firestore, auth

from app.config.settings import settings

_db_client = None
_is_firebase_initialized = False
_init_lock = threading.Lock()

# Local persistent memory store file path (used if Firebase credentials not provided)
LOCAL_DB_FILE = os.path.join(os.path.dirname(__file__), "local_firestore_db.json")

def init_firebase():
    global _db_client, _is_firebase_initialized
    if _is_firebase_initialized:
        return _db_client

    with _init_lock:
        if _is_firebase_initialized:
            return _db_client

        service_account_path = settings.FIREBASE_SERVICE_ACCOUNT_PATH
        if service_account_path and os.path.exists(service_account_path):
            try:
                cred = credentials.Certificate(service_account_path)
                firebase_admin.initialize_app(cred, {
                    'projectId': settings.FIREBASE_PROJECT_ID
                })
                _db_client = firestore.client()
                _is_firebase_initialized = True
                print("Firebase Admin SDK initialized successfully with service account.")
                return _db_client
            except Exception as e:
                print(f"Failed to initialize Firebase Admin SDK: {e}. Operating with local store driver.")

        # Check if Google ADC environment variable is explicitly set
        if os.getenv("GOOGLE_APPLICATION_CREDENTIALS") and os.path.exists(os.getenv("GOOGLE_APPLICATION_CREDENTIALS")):
            try:
                if not firebase_admin._apps:
                    firebase_admin.initialize_app(options={'projectId': settings.FIREBASE_PROJECT_ID})
                _db_client = firestore.client()
                _is_firebase_initialized = True
                print("Firebase Admin SDK initialized with application default credentials.")
                return _db_client
            except Exception as e:
                print(f"Firebase default credentials error: {e}. Operating with local store driver.")

        # Mark initialized as local store fallback to avoid repeated network timeouts
        _is_firebase_initialized = True
        return None

def _matches_filter(val, op, value):
    if op == "==":
        return val == value
    elif op == "!=":
        return val != value
    elif op == "in":
        return isinstance(value, list) and val in value
    elif op == ">":
        return val is not None and val > value
    elif op == ">=":
        return val is not None and val >= value
    elif op == "<":
        return val is not None and val < value
    elif op == "<=":
        return val is not None and val <= value
    return False

class LocalFirestoreMock:
    def __init__(self, file_path=LOCAL_DB_FILE):
        self.file_path = file_path
        self._lock = threading.RLock()
        self._store = self._load()

    def _load(self):
        if os.path.exists(self.file_path):
            try:
                with open(self.file_path, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception:
                pass
        # Default seed collections
        return {
            "users": {},
            "students": {},
            "teachers": {},
            "classes": {},
            "subjects": {},
            "attendance_sessions": {},
            "attendance_records": {},
            "audit_logs": {}
        }

    def _save(self):
        try:
            with open(self.file_path, "w", encoding="utf-8") as f:
                json.dump(self._store, f, indent=2, default=str)
        except Exception as e:
            print(f"Error saving local DB: {e}")

    def collection(self, collection_name):
        return LocalCollectionReference(self, collection_name)

class LocalCollectionReference:
    def __init__(self, db, collection_name):
        self.db = db
        self.collection_name = collection_name
        with self.db._lock:
            if collection_name not in self.db._store:
                self.db._store[collection_name] = {}

    def document(self, doc_id):
        return LocalDocumentReference(self.db, self.collection_name, doc_id)

    def get(self):
        with self.db._lock:
            docs = []
            col = self.db._store.get(self.collection_name, {})
            for doc_id, data in col.items():
                docs.append(LocalDocumentSnapshot(doc_id, dict(data)))
            return docs

    def where(self, field, op, value):
        with self.db._lock:
            docs = []
            col = self.db._store.get(self.collection_name, {})
            for doc_id, data in col.items():
                val = data.get(field)
                if _matches_filter(val, op, value):
                    docs.append(LocalDocumentSnapshot(doc_id, dict(data)))
            return LocalQuery(self.db, docs)

    def add(self, data, doc_id=None):
        with self.db._lock:
            if not doc_id:
                import uuid
                doc_id = str(uuid.uuid4())
            data_copy = dict(data)
            data_copy["id"] = doc_id
            now_iso = datetime.now(timezone.utc).isoformat()
            if "createdAt" not in data_copy or not data_copy["createdAt"]:
                data_copy["createdAt"] = now_iso
            data_copy["updatedAt"] = now_iso
            
            if self.collection_name not in self.db._store:
                self.db._store[self.collection_name] = {}
            self.db._store[self.collection_name][doc_id] = data_copy
            self.db._save()
            return LocalDocumentReference(self.db, self.collection_name, doc_id)

class LocalQuery:
    def __init__(self, db, docs):
        self.db = db
        self._docs = docs

    def where(self, field, op, value):
        with self.db._lock:
            filtered = []
            for snapshot in self._docs:
                val = snapshot.to_dict().get(field)
                if _matches_filter(val, op, value):
                    filtered.append(snapshot)
            return LocalQuery(self.db, filtered)

    def get(self):
        return list(self._docs)

class LocalDocumentReference:
    def __init__(self, db, collection_name, doc_id):
        self.db = db
        self.collection_name = collection_name
        self.doc_id = str(doc_id)
        self.id = str(doc_id)

    def get(self):
        with self.db._lock:
            col = self.db._store.get(self.collection_name, {})
            data = col.get(self.doc_id)
            return LocalDocumentSnapshot(self.doc_id, dict(data) if data is not None else None)

    def set(self, data, merge=False):
        with self.db._lock:
            if self.collection_name not in self.db._store:
                self.db._store[self.collection_name] = {}
            
            data_copy = dict(data)
            data_copy["id"] = self.doc_id
            now_iso = datetime.now(timezone.utc).isoformat()
            
            if merge and self.doc_id in self.db._store[self.collection_name]:
                existing = dict(self.db._store[self.collection_name][self.doc_id])
                existing.update(data_copy)
                existing["updatedAt"] = now_iso
                self.db._store[self.collection_name][self.doc_id] = existing
            else:
                if "createdAt" not in data_copy or not data_copy["createdAt"]:
                    data_copy["createdAt"] = now_iso
                data_copy["updatedAt"] = now_iso
                self.db._store[self.collection_name][self.doc_id] = data_copy
            self.db._save()

    def update(self, data):
        with self.db._lock:
            if self.collection_name in self.db._store and self.doc_id in self.db._store[self.collection_name]:
                existing = dict(self.db._store[self.collection_name][self.doc_id])
                existing.update(data)
                existing["updatedAt"] = datetime.now(timezone.utc).isoformat()
                self.db._store[self.collection_name][self.doc_id] = existing
                self.db._save()

    def delete(self):
        with self.db._lock:
            if self.collection_name in self.db._store and self.doc_id in self.db._store[self.collection_name]:
                del self.db._store[self.collection_name][self.doc_id]
                self.db._save()

class LocalDocumentSnapshot:
    def __init__(self, doc_id, data):
        self.id = doc_id
        self._data = data
        self.exists = data is not None

    def to_dict(self):
        return dict(self._data) if self._data is not None else {}

_local_db = LocalFirestoreMock()

def get_db():
    client = init_firebase()
    if client:
        return client
    return _local_db
