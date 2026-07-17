# Smart Inventory & Demand Forecasting System

A full-stack inventory management system with AI-powered restocking recommendations using Retrieval-Augmented Generation (RAG). Built with React, Flask, PostgreSQL (Supabase), and pgvector.

---

## What it does

Businesses often overstock or understock products because demand is estimated manually. This system solves that by combining real sales history with uploaded business documents (CSV datasets, PDF reports, supplier notes) to generate context-aware restocking recommendations.

When a forecast is requested for a product, the system:
1. Calculates average daily demand and predicted weekly demand from sales history
2. Retrieves semantically relevant document chunks from pgvector using cosine similarity search
3. Combines both into a structured prompt sent to an LLM
4. Returns urgency level, recommended restock quantity, reasoning, and action

---

## Features

**Inventory Management**
- Add, edit, and delete products with stock levels and pricing
- Real-time stock deduction when a sale is logged
- Low stock alerts on the dashboard

**Sales Tracking**
- Log daily sales per product with optional date override
- View full sales history per product

**Document Intelligence**
- Upload CSV datasets, PDF reports, or plain text notes per product
- CSV files are automatically parsed into human-readable insights before embedding
- Global market context — upload industry-wide datasets that apply to all products
- Delete individual document chunks

**RAG-Powered Forecasting**
- Moving average demand forecasting from sales history
- Semantic vector search retrieves the most relevant document chunks for each query
- LLM combines sales data and retrieved context to generate structured recommendations
- Urgency classification: Low, Medium, High, Critical

---

## Architecture

```
React Frontend (Vite)
        │
        ▼
Flask REST API
        │
        ▼
PostgreSQL on Supabase
├── products       — stock levels, pricing
├── sales          — daily sales history
├── users          — authentication (planned)
└── documents      — text chunks + vector embeddings (pgvector)
        │
        ▼
RAG Pipeline
├── File ingestion  — PDF text extraction, CSV insight generation
├── Chunking        — split content into 200-word chunks
├── Embedding       — sentence-transformers (all-MiniLM-L6-v2)
├── Storage         — pgvector in Supabase
├── Retrieval       — cosine similarity search (top-k chunks)
└── Generation      — OpenRouter LLM with sales + context prompt
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React (Vite), React Router, Axios |
| Backend | Python, Flask, Flask-CORS |
| Database | PostgreSQL via Supabase, pgvector |
| Embeddings | sentence-transformers (all-MiniLM-L6-v2) |
| LLM | OpenRouter API |
| File Parsing | PyPDF2, pandas |

---

## Project Structure

```
smart-inventory-forecast/
├── app.py              # Flask routes
├── db.py               # Database connection
├── rag.py              # Embedding, retrieval, generation pipeline
├── forecast.py         # Moving average demand calculation
├── requirements.txt
├── .env                # Environment variables (not committed)
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Products.jsx
│   │   │   ├── Sales.jsx
│   │   │   ├── Documents.jsx
│   │   │   └── Forecast.jsx
│   │   ├── api/
│   │   │   └── client.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
└── README.md
```

---

## Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+
- Supabase account (free tier)
- OpenRouter API key (free tier)

### 1. Clone the repository

```bash
git clone https://github.com/nandanaa03/smart-inventory-forecast.git
cd smart-inventory-forecast
```

### 2. Set up the database

In your Supabase project, run this SQL:

```sql
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT,
  current_stock INTEGER DEFAULT 0,
  price NUMERIC,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE sales (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES products(id),
  quantity_sold INTEGER NOT NULL,
  sale_date DATE DEFAULT CURRENT_DATE
);

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT DEFAULT 'staff'
);

CREATE TABLE documents (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES products(id),
  content TEXT NOT NULL,
  embedding VECTOR(384),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Insert global context product (product_id = 0 for market-wide documents)
INSERT INTO products (id, name, category, current_stock, price)
VALUES (0, 'Global Market Context', 'System', 0, 0);
```

### 3. Configure environment variables

Create a `.env` file in the project root:

```env
DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres
OPENROUTER_API_KEY=your_openrouter_api_key
```

### 4. Install backend dependencies

```bash
pip install -r requirements.txt
```

### 5. Install frontend dependencies

```bash
cd frontend
npm install
```

### 6. Run the application

Terminal 1 — backend:
```bash
python app.py
```

Terminal 2 — frontend:
```bash
cd frontend
npm run dev
```

Open `http://localhost:5173`

---

## How the RAG Pipeline Works

**1. Document Ingestion**

When you upload a file:
- CSV files are parsed by pandas, grouped by product category and month, and converted into natural language insights: *"Health and beauty sales in January 2019: 254 total units sold across 44 transactions, average 5.8 units per transaction."*
- PDF files are text-extracted using PyPDF2
- All text is split into 200-word chunks
- Each chunk is converted to a 384-dimensional vector using `sentence-transformers/all-MiniLM-L6-v2`
- Chunks and embeddings are stored in Supabase with pgvector

**2. Retrieval**

When a forecast is requested:
- The query (e.g., "restocking and demand forecast for Hand Sanitizer") is embedded using the same model
- pgvector performs a cosine similarity search across all document chunks linked to that product AND global context (product_id = 0)
- Top 3 most relevant chunks are returned

**3. Generation**

The LLM receives:
- Product name, current stock, average daily demand, predicted weekly demand, days of stock remaining
- Full sales history
- Top 3 retrieved document chunks

It returns a structured recommendation with urgency level, restock quantity, reasoning, and action.

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/products` | List all products |
| POST | `/products` | Add a product |
| PUT | `/products/<id>` | Update a product |
| DELETE | `/products/<id>` | Delete a product |
| POST | `/sales` | Log a sale |
| GET | `/sales/<product_id>` | Get sales history |
| POST | `/documents/upload` | Upload document or file |
| GET | `/documents/<product_id>` | List documents for product |
| DELETE | `/documents/<id>` | Delete a document chunk |
| POST | `/documents/search` | Semantic search |
| GET | `/forecast/<product_id>` | Generate AI forecast |

---

## Roadmap

- [x] Product CRUD
- [x] Sales tracking with automatic stock deduction
- [x] PostgreSQL integration via Supabase
- [x] CSV and PDF file upload
- [x] Text chunking pipeline
- [x] Vector embeddings with sentence-transformers
- [x] pgvector storage and cosine similarity search
- [x] Moving average demand forecasting
- [x] RAG-powered AI recommendations
- [x] Global market context documents
- [x] React frontend with routing
- [ ] Authentication (Owner and Staff roles)
- [ ] Low stock alert notifications
- [ ] Sales trend charts
- [ ] Deployment on Render

---

## Future Improvements

- ARIMA or Prophet for more accurate time-series forecasting
- Azure OpenAI integration (provider abstraction layer)
- Supplier management module
- Docker containerization
- CI/CD pipeline with GitHub Actions
- Multi-tenant support for multiple businesses
