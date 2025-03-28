# Contact Manager Web Application

A professional contact management system with advanced search functionality and a modern UI.

## Features

- **Advanced Search**: Search contacts by name or phone number
- **Professional UI**: Clean, responsive design using Bootstrap
- **Phone Number Validation**: Real-time validation for phone numbers
  - Ensures exactly 10 digits
  - Blocks letters and special characters
  - Prevents duplicate entries
- **Prefix Selection**: Choose from predefined country codes
- **Automatic Formatting**: Formats phone numbers based on selected prefix
- **MongoDB Integration**: Stores contact data securely

## Tech Stack

- **Backend**: Flask (Python) with Flask-PyMongo
- **Database**: MongoDB
- **Frontend**: HTML, CSS, JavaScript with real-time validation
- **UI Framework**: Bootstrap

## Installation

1. Clone the repository
2. Install dependencies:
   ```
   pip install -r requirements.txt
   ```
3. Make sure MongoDB is running on your system
4. Create a `.env` file with your MongoDB connection string (default is provided)
5. Run the application:
   ```
   python app.py
   ```

## Usage

- **Add Contact**: Click the "Add New Contact" button
- **Edit Contact**: Click the edit icon on any contact card
- **Delete Contact**: Click the delete icon and confirm
- **Search**: Use the search bar to find contacts by name or phone number

## Keyboard Shortcuts

- **Alt+N**: Open the Add New Contact modal
- **Alt+F**: Focus on the search bar
- **Escape**: Close any open modal

## Database Schema

```json
{
  "name": "Bhuka Bhediya",
  "prefix": "+91",
  "phone": "6969696969",
  "email": "bhukabhediya69@gmail.com",
  "address": "Bihar, Bihar, mars"
}
```
