from flask import Flask, render_template, request, jsonify, redirect, url_for
from flask_pymongo import PyMongo
from bson.objectid import ObjectId
import os
from dotenv import load_dotenv
import re

# Load environment variables
load_dotenv()

app = Flask(__name__)

# Configure MongoDB
app.config["MONGO_URI"] = os.getenv("MONGO_URI", "mongodb://localhost:27017/contacts_db")
mongo = PyMongo(app)

# Phone number validation regex (10 digits only)
PHONE_REGEX = re.compile(r'^\d{10}$')

# Prefix list
PREFIXES = ["+91", "+1", "+44", "+61", "+86", "+33", "+49", "+81", "+7", "+55"]

@app.route('/')
def index():
    """Render the main contacts page"""
    contacts = list(mongo.db.contacts.find())
    for contact in contacts:
        contact['_id'] = str(contact['_id'])
    return render_template('index.html', contacts=contacts, prefixes=PREFIXES)

@app.route('/contacts', methods=['POST'])
def add_contact():
    """Add a new contact"""
    name = request.form.get('name', '').strip()
    prefix = request.form.get('prefix', '').strip()
    phone = request.form.get('phone', '').strip()
    email = request.form.get('email', '').strip()
    address = request.form.get('address', '').strip()
    
    # Validate phone number
    if not PHONE_REGEX.match(phone):
        return jsonify({"error": "Phone number must be exactly 10 digits"}), 400
    
    # Check for duplicate contacts based on phone number only (regardless of prefix)
    existing_contact = mongo.db.contacts.find_one({"phone": phone})
    
    if existing_contact:
        return jsonify({"error": "A contact with this phone number already exists"}), 400
    
    # Create new contact
    new_contact = {
        "name": name,
        "prefix": prefix,
        "phone": phone,
        "email": email,
        "address": address
    }
    
    result = mongo.db.contacts.insert_one(new_contact)
    
    # Return success response instead of redirecting
    return jsonify({"success": True, "message": "Contact added successfully"}), 201

@app.route('/contacts/<contact_id>', methods=['PUT'])
def update_contact(contact_id):
    """Update an existing contact"""
    name = request.form.get('name', '').strip()
    prefix = request.form.get('prefix', '').strip()
    phone = request.form.get('phone', '').strip()
    email = request.form.get('email', '').strip()
    address = request.form.get('address', '').strip()
    
    # Validate phone number
    if not PHONE_REGEX.match(phone):
        return jsonify({"error": "Phone number must be exactly 10 digits"}), 400
    
    # Check for duplicate contacts based on phone number only (excluding the current one)
    existing_contact = mongo.db.contacts.find_one(
        {"phone": phone, "_id": {"$ne": ObjectId(contact_id)}}
    )
    
    if existing_contact:
        return jsonify({"error": "A contact with this phone number already exists"}), 400
    
    # Update contact
    mongo.db.contacts.update_one(
        {"_id": ObjectId(contact_id)},
        {"$set": {
            "name": name,
            "prefix": prefix,
            "phone": phone,
            "email": email,
            "address": address
        }}
    )
    
    return jsonify({"success": True})

@app.route('/contacts/<contact_id>', methods=['DELETE'])
def delete_contact(contact_id):
    """Delete a contact"""
    mongo.db.contacts.delete_one({"_id": ObjectId(contact_id)})
    return jsonify({"success": True})

@app.route('/search', methods=['GET'])
def search_contacts():
    """Search contacts by name or phone number"""
    query = request.args.get('query', '').strip()
    
    if not query:
        return redirect(url_for('index'))
    
    # Create a regex pattern for case-insensitive search
    pattern = re.compile(f'.*{re.escape(query)}.*', re.IGNORECASE)
    
    # Search by name or phone number
    contacts = list(mongo.db.contacts.find({
        "$or": [
            {"name": pattern},
            {"phone": pattern}
        ]
    }))
    
    for contact in contacts:
        contact['_id'] = str(contact['_id'])
    
    return render_template('index.html', contacts=contacts, prefixes=PREFIXES, search_query=query)

@app.route('/api/contacts', methods=['GET'])
def api_get_contacts():
    """API endpoint to get all contacts"""
    contacts = list(mongo.db.contacts.find())
    for contact in contacts:
        contact['_id'] = str(contact['_id'])
    return jsonify(contacts)

@app.route('/api/search', methods=['GET'])
def api_search_contacts():
    """API endpoint to search contacts by name or phone number"""
    query = request.args.get('query', '').strip()
    
    if not query:
        # Return all contacts if no query
        contacts = list(mongo.db.contacts.find())
    else:
        # Create a regex pattern for case-insensitive search
        pattern = re.compile(f'.*{re.escape(query)}.*', re.IGNORECASE)
        
        # Search by name or phone number
        contacts = list(mongo.db.contacts.find({
            "$or": [
                {"name": pattern},
                {"phone": pattern}
            ]
        }))
    
    # Convert ObjectId to string for JSON serialization
    for contact in contacts:
        contact['_id'] = str(contact['_id'])
    
    return jsonify(contacts)

if __name__ == '__main__':
    app.run(debug=True)
