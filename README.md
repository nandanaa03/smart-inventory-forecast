# Smart Inventory & Demand Forecasting System

A full-stack inventory management system with AI-powered restocking recommendations using Retrieval-Augmented Generation (RAG). Built with React, Flask, PostgreSQL (Supabase), and pgvector. Deployed on Render.

---

## Live Demo

[https://smart-inventory-forecast-wil6.onrender.com](https://smart-inventory-forecast-wil6.onrender.com)

---

## What it does

Businesses often overstock or understock products because demand is estimated manually. This system solves that by combining real sales history with uploaded business documents (CSV datasets, PDF reports, supplier notes) to generate context-aware restocking recommendations.

When a forecast is requested for a product, the system:
1. Calculates average daily demand and predicted weekly demand from sales history
2. Embeds the query using OpenRouter's embedding API
3. Retrieves semantically relevant document chunks from pgvector using cosine similarity search
4. Combines sales data and retrieved context into a structured prompt sent to an LLM
5. Returns urgency level, recommended restock quantity, reasoning, action, and a confidence score

---

## Features

**Inventory Management**
- Add, edit, and delete products with stock levels and pricing
- Real-time stock deduction when a sale is logged
- Inventory health scoring per product (Healthy / Moderate / At Risk / Critical)
- Low stock alerts and inventory value on the dashboard

**Sales Tracking**
- Log daily sales per product with optional date override
- View full sales history per product

**Analytics**
- Daily sales volume bar chart per product
- Sales trend line chart
- Product comparison doughnut chart
- Performance table with trend indicators

**Document Intelligence**
- Upload CSV datasets, PDF reports, or plain text notes
- CSV files are automatically parsed into human-readable monthly insights before embedding
- Global market context — upload industry-wide datasets that apply across all products
- Delete individual document chunks

**RAG-Powered Forecasting**
- Moving average demand forecasting from sales history
- API-based embeddings via OpenRouter (no local model, production-friendly)
- Cosine similarity search via pgvector retrieves the most relevant chunks
- LLM combines sales data and retrieved context to generate structured recommendations
- Urgency classification: Low, Medium, High, Critical
- Confidence score based on data quantity and retrieval quality

---

## Architecture

```
React Frontend (Vite) — served as static files by Flask
        │
        ▼
Flask REST API (/api/v1/...)
        │
        ├── Connection Pool (psycopg2-pool, min 2, max 10)
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
├── File ingestion  — PDF text extraction (PyPDF2), CSV insight generation (pandas)
├── Chunking        — 200-word chunks
├── Embedding       — OpenRouter Embeddings API (text-embedding-ada-002)
├── Storage         — pgvector in Supabase (384-dimensional vectors)
├── Retrieval       — cosine similarity search, top-k chunks, global + product-specific
└── Generation      — OpenRouter LLM with sales data + retrieved context
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React (Vite), React Router, Axios, Chart.js |
| Backend | Python, Flask, Flask-CORS, Gunicorn |
| Database | PostgreSQL via Supabase, pgvector |
| Embeddings | OpenRouter Embeddings API (text-embedding-ada-002) |
| LLM | OpenRouter API (NVIDIA Nemotron) |
| File Parsing | PyPDF2, pandas |
| Connection Pooling | psycopg2-pool |
| Deployment | Render |

---

## Design Decisions

**Why API-based embeddings instead of local sentence-transformers?**

The initial implementation used `sentence-transformers/all-MiniLM-L6-v2` locally. This worked well in development but exceeded Render's free tier memory limit (512MB) at startup. Switching to OpenRouter's embedding API moves the compute off the server entirely, keeping the deployment lightweight while maintaining semantic search quality. The tradeoff is an extra network call per embedding, which is acceptable given that embeddings are only generated on document upload, not on every forecast request.

**Why pgvector instead of a dedicated vector database (Pinecone, Weaviate)?**

Keeping vectors in the same PostgreSQL database as the rest of the application data simplifies the architecture significantly — one database connection, one deployment, no cross-service latency on retrieval queries. pgvector's cosine similarity performance is more than sufficient for the scale this application targets.

**Why global market context (product_id = 0)?**

Real businesses have industry-wide data (competitor analysis, seasonal trend reports, market datasets) that is relevant across all products, not just one. The global context approach allows uploading a supermarket sales CSV once and having it inform forecasts for any product, which is more realistic than requiring per-product documents for every item.

---

## Project Structure

```
smart-inventory-forecast/
├── app.py              # Flask routes, static file serving
├── db.py               # Connection pool
├── rag.py              # Embedding, retrieval, generation pipeline
├── forecast.py         # Moving average demand calculation
├── gunicorn.conf.py    # Production server config
├── requirements.txt
├── static/             # Built React app (served by Flask)
├── .env                # Environment variables (not committed)
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx   # Health scores, alerts, stats
│   │   │   ├── Products.jsx    # CRUD
│   │   │   ├── Sales.jsx       # Sale logging + history
│   │   │   ├── Documents.jsx   # File upload + chunk management
│   │   │   ├── Analytics.jsx   # Charts and performance table
│   │   │   └── Forecast.jsx    # AI recommendation + confidence
│   │   ├── api/
│   │   │   └── client.js       # Axios API client
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

In your Supabase project SQL Editor, run:

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

-- Global context product for market-wide documents
INSERT INTO products (id, name, category, current_stock, price)
VALUES (0, 'Global Market Context', 'System', 0, 0);
```

### 3. Configure environment variables

Create a `.env` file in the project root:

```env
DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres
OPENROUTER_API_KEY=your_openrouter_api_key
```

Use the Session Pooler connection string from Supabase (not Direct connection) to avoid timeout issues.

### 4. Install dependencies

```bash
pip install -r requirements.txt
cd frontend && npm install
```

### 5. Run locally

Terminal 1:
```bash
python app.py
```

Terminal 2:
```bash
cd frontend
npm run dev
```

Open `http://localhost:5173`

### 6. Build for production

```bash
cd frontend
npm run build
```

This outputs built React files to `static/` which Flask serves directly.

---

## How the RAG Pipeline Works

**1. Document Ingestion**

When you upload a file:
- CSV files are parsed by pandas, grouped by product category and month, and converted into natural language: *"Health and beauty sales in January 2019: 254 total units sold across 44 transactions, average 5.8 units per transaction."*
- PDF files are text-extracted using PyPDF2
- Text is split into 200-word chunks
- Each chunk is sent to OpenRouter's embedding API which returns a 384-dimensional vector representing its meaning
- Chunks and embeddings are stored in Supabase with pgvector

**2. Retrieval**

When a forecast is requested:
- The query is embedded via the same OpenRouter API
- pgvector performs cosine similarity search across chunks for that product AND global context (product_id = 0)
- Top 3 most semantically similar chunks are returned with similarity scores

**3. Generation**

The LLM receives a structured prompt containing:
- Product name, current stock, average daily demand, predicted weekly demand, days of stock remaining
- Full sales history
- Top 3 retrieved document chunks

It returns urgency level, restock quantity, reasoning, and action.

**4. Confidence Score**

Calculated deterministically from:
- Data quantity (50% weight) — more sales history = higher confidence
- Retrieval quality (50% weight) — average cosine similarity of retrieved chunks

---

## API Reference

All endpoints are prefixed with `/api/v1/`. Responses follow the format:
```json
{ "success": true, "data": {...} }
{ "success": false, "error": "message" }
```

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/v1/products` | List all products |
| POST | `/api/v1/products` | Add a product |
| PUT | `/api/v1/products/<id>` | Update a product |
| DELETE | `/api/v1/products/<id>` | Delete a product |
| POST | `/api/v1/sales` | Log a sale |
| GET | `/api/v1/sales/<product_id>` | Get sales history |
| POST | `/api/v1/documents/upload` | Upload file or text |
| GET | `/api/v1/documents/<product_id>` | List document chunks |
| DELETE | `/api/v1/documents/<id>` | Delete a chunk |
| POST | `/api/v1/documents/search` | Semantic search |
| GET | `/api/v1/forecast/<product_id>` | Generate AI forecast |
| GET | `/api/v1/health` | API health check |

---

## Roadmap

- [x] Product CRUD
- [x] Sales tracking with automatic stock deduction
- [x] PostgreSQL integration via Supabase with connection pooling
- [x] CSV and PDF file upload with automatic parsing
- [x] Text chunking pipeline
- [x] API-based embeddings via OpenRouter
- [x] pgvector storage and cosine similarity search
- [x] Global market context documents
- [x] Moving average demand forecasting
- [x] RAG-powered AI recommendations
- [x] Confidence scoring
- [x] Inventory health scoring
- [x] Sales analytics with Chart.js
- [x] React frontend with routing
- [x] Deployed on Render
- [ ] Authentication (Owner and Staff roles)
- [ ] Multiple forecasting models (WMA, Exponential Smoothing)
- [ ] Recommendation history and auditability
- [ ] Supplier management with lead times
- [ ] PDF export of inventory reports

---

## Future Improvements

- Switch to local Ollama embeddings for full data privacy
- ARIMA or Prophet for time-series forecasting
- Azure OpenAI integration (provider abstraction layer)
- Reranking pipeline (cross-encoder on top of vector retrieval)
- Docker containerization
- CI/CD pipeline with GitHub Actions
- Multi-tenant support for multiple businesses
