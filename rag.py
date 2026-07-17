import json
import os
import io
import requests
import pandas as pd
import PyPDF2
from db import get_db_connection, release_db_connection

OPENROUTER_API_KEY = os.environ.get("OPENROUTER_API_KEY")

def embed_text(text):
    """Use a lightweight API-based embedding instead of local model."""
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": "text-embedding-ada-002",
        "input": text[:8000]  # trim to avoid token limits
    }
    try:
        res = requests.post(
            "https://openrouter.ai/api/v1/embeddings",
            headers=headers,
            json=payload,
            timeout=30
        )
        result = res.json()
        if "data" in result:
            return result["data"][0]["embedding"]
    except Exception:
        pass
    # Fallback — simple hash-based pseudo embedding (keeps app alive if API fails)
    import hashlib
    words = text.lower().split()
    vec = [0.0] * 384
    for i, word in enumerate(words[:384]):
        h = int(hashlib.md5(word.encode()).hexdigest(), 16)
        vec[i % 384] += (h % 1000) / 1000.0
    norm = sum(x**2 for x in vec) ** 0.5
    return [x / norm if norm > 0 else 0 for x in vec]

def chunk_text(text, chunk_size=200):
    words = text.split()
    chunks = []
    for i in range(0, len(words), chunk_size):
        chunk = " ".join(words[i:i + chunk_size])
        chunks.append(chunk)
    return chunks

def extract_text_from_pdf(file_bytes):
    reader = PyPDF2.PdfReader(io.BytesIO(file_bytes))
    text = ""
    for page in reader.pages:
        text += page.extract_text() or ""
    return text

def extract_insights_from_csv(file_bytes):
    df = pd.read_csv(io.BytesIO(file_bytes))
    insights = []

    # Detect date column
    date_col = None
    for col in df.columns:
        if 'date' in col.lower():
            date_col = col
            break

    # Detect quantity column
    qty_col = None
    for col in df.columns:
        if 'quantity' in col.lower() or 'qty' in col.lower():
            qty_col = col
            break

    # Detect product/category column
    cat_col = None
    for col in df.columns:
        if 'product line' in col.lower() or 'category' in col.lower() or 'product' in col.lower():
            cat_col = col
            break

    # Detect price column
    price_col = None
    for col in df.columns:
        if 'unit price' in col.lower() or 'price' in col.lower():
            price_col = col
            break

    if not qty_col or not cat_col:
        # Fallback — just convert entire CSV to text chunks
        return df.to_string()

    # Parse dates if available
    if date_col:
        try:
            df[date_col] = pd.to_datetime(df[date_col])
            df['month'] = df[date_col].dt.strftime('%B %Y')
        except:
            df['month'] = 'Unknown'
    else:
        df['month'] = 'Unknown'

    # Group by category and month
    grouped = df.groupby([cat_col, 'month'])[qty_col].agg(['sum', 'mean', 'count']).reset_index()

    for _, row in grouped.iterrows():
        category = row[cat_col]
        month = row['month']
        total = int(row['sum'])
        avg = round(float(row['mean']), 1)
        transactions = int(row['count'])

        insight = f"{category} sales in {month}: {total} total units sold across {transactions} transactions, average {avg} units per transaction."

        if price_col:
            try:
                avg_price = df[df[cat_col] == category][price_col].mean()
                insight += f" Average unit price: {round(float(avg_price), 2)}."
            except:
                pass

        insights.append(insight)

    # Overall summary per category
    overall = df.groupby(cat_col)[qty_col].agg(['sum', 'mean']).reset_index()
    for _, row in overall.iterrows():
        insight = f"Overall {row[cat_col]} performance: {int(row['sum'])} total units sold, average {round(float(row['mean']), 1)} units per transaction across entire dataset period."
        insights.append(insight)

    return "\n".join(insights)

def store_document(product_id, content, filename="manual_upload"):
    chunks = chunk_text(content)
    conn = get_db_connection()
    cur = conn.cursor()
    for chunk in chunks:
        embedding = embed_text(chunk)
        cur.execute(
            """INSERT INTO documents (product_id, content, embedding)
               VALUES (%s, %s, %s);""",
            (product_id, chunk, json.dumps(embedding))
        )
    conn.commit()
    cur.close()
    release_db_connection(conn)
    return len(chunks)

def store_file(product_id, file_bytes, filename):
    if filename.endswith('.pdf'):
        content = extract_text_from_pdf(file_bytes)
    elif filename.endswith('.csv'):
        content = extract_insights_from_csv(file_bytes)
    else:
        content = file_bytes.decode('utf-8', errors='ignore')

    return store_document(product_id, content, filename)

def retrieve_context(product_id, query, top_k=3):
    query_embedding = embed_text(query)
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute(
        """
        SELECT content, 1 - (embedding <=> %s::vector) AS similarity
        FROM documents
        WHERE product_id = %s OR product_id = 0
        ORDER BY similarity DESC
        LIMIT %s;
        """,
        (json.dumps(query_embedding), product_id, top_k)
    )
    rows = cur.fetchall()
    cur.close()
    release_db_connection(conn)
    return [{"content": r[0], "similarity": round(float(r[1]), 4)} for r in rows]

def generate_recommendation(product_name, current_stock, avg_daily_demand,
                             predicted_weekly_demand, days_of_stock,
                             sales_summary, retrieved_context):
    context_text = "\n\n".join([r["content"] for r in retrieved_context]) if retrieved_context else "No additional context available."

    prompt = f"""You are an inventory management expert. Based on the sales data and business context below, provide a restocking recommendation.

Product: {product_name}
Current Stock: {current_stock} units
Average Daily Demand: {avg_daily_demand:.1f} units
Predicted Weekly Demand: {predicted_weekly_demand} units
Days of Stock Remaining: {days_of_stock} days

Sales History:
{sales_summary}

Business Context (from uploaded documents):
{context_text}

Provide a concise restocking recommendation in this format:
Urgency: <Low / Medium / High / Critical>
Recommended Restock Quantity: <number> units
Reasoning: <2-3 sentences combining sales trend and business context>
Action: <specific action to take>"""

    headers = {
        "Authorization": f"Bearer {os.environ.get('OPENROUTER_API_KEY')}",
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:5000",
        "X-Title": "InventoryForecast"
    }
    payload = {
        "model": "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
        "messages": [{"role": "user", "content": prompt}]
    }
    res = requests.post("https://openrouter.ai/api/v1/chat/completions",
                        headers=headers, json=payload)
    result = res.json()

    if "choices" not in result:
        return None, result
    return result["choices"][0]["message"]["content"], None