# 📦 Smart Inventory & Demand Forecasting System with RAG

A full-stack inventory management system that helps businesses manage inventory, track sales, and generate AI-powered restocking recommendations using Retrieval-Augmented Generation (RAG).

The project combines traditional inventory management with modern AI techniques by integrating PostgreSQL, vector embeddings, semantic search, and large language models.

---

## 🚀 Features

### ✅ Currently Implemented

- Product Management (Create, Read, Update, Delete)
- Sales Tracking
- Automatic Stock Deduction
- PostgreSQL Database Integration using Supabase
- Document Upload
- pgvector Integration for Vector Storage
- Flask REST APIs
- React Frontend

### 🚧 In Progress

- Document Embedding Pipeline
- Semantic Vector Search
- Demand Forecasting
- AI-powered Restocking Recommendations (RAG)

### 📌 Planned Features

- Authentication (Owner & Staff)
- Low Stock Alerts
- Analytics Dashboard
- Charts & Sales Trends
- Deployment on Render

---

## 🏗️ Project Architecture

```
React Frontend
        │
        ▼
Flask Backend (REST APIs)
        │
        ▼
PostgreSQL (Supabase)
│
├── Products
├── Sales
├── Users
└── Documents (pgvector)
        │
        ▼
RAG Pipeline
├── Document Upload
├── Text Chunking
├── Embedding Generation
├── Vector Similarity Search
└── AI Recommendation
```

---

## 🛠️ Tech Stack

### Frontend

- React (Vite)
- JavaScript
- HTML
- CSS

### Backend

- Flask
- Flask-CORS
- Python

### Database

- PostgreSQL
- Supabase
- pgvector

### AI & Machine Learning

- Sentence Transformers
- Hugging Face Transformers
- OpenRouter / Gemini (LLM Integration)
- Retrieval-Augmented Generation (RAG)

### Other Tools

- Git & GitHub
- REST APIs
- PyPDF2

---

## 📂 Project Structure

```
.
├── frontend/
│   ├── src/
│   ├── public/
│   └── package.json
│
├── app.py
├── db.py
├── forecast.py
├── rag.py
├── requirements.txt
├── README.md
└── .gitignore
```

---

## ⚙️ Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/<your-username>/smart-inventory-rag.git
cd smart-inventory-rag
```

### 2. Install backend dependencies

```bash
pip install -r requirements.txt
```

### 3. Install frontend dependencies

```bash
cd frontend
npm install
```

### 4. Configure environment variables

Create a `.env` file in the project root.

Example:

```env
SUPABASE_HOST=your_host
SUPABASE_DATABASE=your_database
SUPABASE_USER=your_user
SUPABASE_PASSWORD=your_password
GOOGLE_API_KEY=your_api_key
```

### 5. Run the backend

```bash
python app.py
```

### 6. Run the frontend

```bash
cd frontend
npm run dev
```

---

## 📈 Roadmap

- [x] Product CRUD
- [x] Sales Tracking
- [x] Stock Deduction
- [x] Document Upload
- [x] PostgreSQL Integration
- [x] pgvector Setup
- [ ] Embedding Generation
- [ ] Semantic Retrieval
- [ ] Demand Forecasting
- [ ] AI Recommendation Generation
- [ ] Authentication
- [ ] Dashboard Analytics
- [ ] Deployment

---

## 💡 Future Improvements

- Forecasting using ARIMA or Prophet
- Advanced inventory analytics
- Supplier management
- Multi-user role-based access
- Real-time inventory notifications
- Docker deployment
- CI/CD pipeline

---

