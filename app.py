from flask import Flask, request, jsonify
from dotenv import load_dotenv
from db import get_db_connection
from rag import store_document, store_file, retrieve_context, generate_recommendation
from forecast import calculate_forecast
import os
from flask_cors import CORS

load_dotenv()
app = Flask(__name__)
CORS(app)
# ─── Products ────────────────────────────────────────────────────────────────

@app.route("/products", methods=["POST"])
def add_product():
    data = request.json
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO products (name, category, current_stock, price) VALUES (%s, %s, %s, %s) RETURNING id;",
        (data.get("name"), data.get("category"), data.get("current_stock", 0), data.get("price"))
    )
    new_id = cur.fetchone()[0]
    conn.commit()
    cur.close()
    conn.close()
    return jsonify({"status": "created", "product_id": new_id})

@app.route("/products", methods=["GET"])
def get_products():
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT id, name, category, current_stock, price FROM products;")
    rows = cur.fetchall()
    cur.close()
    conn.close()
    products = [{"id": r[0], "name": r[1], "category": r[2],
                 "current_stock": r[3], "price": float(r[4]) if r[4] else 0} for r in rows]
    return jsonify(products)

@app.route("/products/<int:product_id>", methods=["PUT"])
def update_product(product_id):
    data = request.json
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute(
        "UPDATE products SET name=%s, category=%s, current_stock=%s, price=%s WHERE id=%s;",
        (data.get("name"), data.get("category"), data.get("current_stock"), data.get("price"), product_id)
    )
    conn.commit()
    rows_affected = cur.rowcount
    cur.close()
    conn.close()
    if rows_affected == 0:
        return jsonify({"status": "error", "message": "Product not found"}), 404
    return jsonify({"status": "updated", "product_id": product_id})

@app.route("/products/<int:product_id>", methods=["DELETE"])
def delete_product(product_id):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("DELETE FROM products WHERE id=%s;", (product_id,))
    conn.commit()
    rows_affected = cur.rowcount
    cur.close()
    conn.close()
    if rows_affected == 0:
        return jsonify({"status": "error", "message": "Product not found"}), 404
    return jsonify({"status": "deleted", "product_id": product_id})

# ─── Sales ───────────────────────────────────────────────────────────────────

@app.route("/sales", methods=["POST"])
def add_sale():
    data = request.json
    product_id = data.get("product_id")
    quantity_sold = data.get("quantity_sold")
    sale_date = data.get("sale_date")
    conn = get_db_connection()
    cur = conn.cursor()
    if sale_date:
        cur.execute(
            "INSERT INTO sales (product_id, quantity_sold, sale_date) VALUES (%s, %s, %s) RETURNING id;",
            (product_id, quantity_sold, sale_date)
        )
    else:
        cur.execute(
            "INSERT INTO sales (product_id, quantity_sold) VALUES (%s, %s) RETURNING id;",
            (product_id, quantity_sold)
        )
    new_id = cur.fetchone()[0]
    cur.execute(
        "UPDATE products SET current_stock = current_stock - %s WHERE id = %s;",
        (quantity_sold, product_id)
    )
    conn.commit()
    cur.close()
    conn.close()
    return jsonify({"status": "created", "sale_id": new_id})

@app.route("/sales/<int:product_id>", methods=["GET"])
def get_sales_for_product(product_id):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute(
        "SELECT id, quantity_sold, sale_date FROM sales WHERE product_id=%s ORDER BY sale_date;",
        (product_id,)
    )
    rows = cur.fetchall()
    cur.close()
    conn.close()
    return jsonify([{"id": r[0], "quantity_sold": r[1], "sale_date": str(r[2])} for r in rows])

# ─── Documents ───────────────────────────────────────────────────────────────

@app.route("/documents/upload", methods=["POST"])
def upload_document():
    # Handle file upload
    if 'file' in request.files:
        file = request.files['file']
        product_id = request.form.get('product_id')
        if not product_id:
            return jsonify({"status": "error", "message": "product_id required"}), 400
        file_bytes = file.read()
        chunks_stored = store_file(int(product_id), file_bytes, file.filename)
        return jsonify({"status": "uploaded", "chunks_stored": chunks_stored, "filename": file.filename})

    # Handle raw text upload
    data = request.json
    product_id = data.get("product_id")
    content = data.get("content")
    if not content or not product_id:
        return jsonify({"status": "error", "message": "product_id and content required"}), 400
    chunks_stored = store_document(int(product_id), content)
    return jsonify({"status": "uploaded", "chunks_stored": chunks_stored})

@app.route("/documents/search", methods=["POST"])
def search_documents():
    data = request.json
    results = retrieve_context(data.get("product_id"), data.get("query"), data.get("top_k", 3))
    return jsonify(results)

@app.route("/documents/<int:product_id>", methods=["GET"])
def get_documents(product_id):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute(
        "SELECT id, content, created_at FROM documents WHERE product_id=%s ORDER BY created_at DESC;",
        (product_id,)
    )
    rows = cur.fetchall()
    cur.close()
    conn.close()
    return jsonify([{"id": r[0], "content": r[1][:200] + "...", "created_at": str(r[2])} for r in rows])

@app.route("/documents/<int:doc_id>", methods=["DELETE"])
def delete_document(doc_id):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("DELETE FROM documents WHERE id=%s;", (doc_id,))
    conn.commit()
    rows_affected = cur.rowcount
    cur.close()
    conn.close()
    if rows_affected == 0:
        return jsonify({"status": "error", "message": "Document not found"}), 404
    return jsonify({"status": "deleted"})

# ─── Forecast ────────────────────────────────────────────────────────────────

@app.route("/forecast/<int:product_id>", methods=["GET"])
def forecast(product_id):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT name, current_stock FROM products WHERE id=%s;", (product_id,))
    product = cur.fetchone()
    if not product:
        return jsonify({"status": "error", "message": "Product not found"}), 404
    product_name, current_stock = product

    cur.execute(
        "SELECT quantity_sold, sale_date FROM sales WHERE product_id=%s ORDER BY sale_date;",
        (product_id,)
    )
    sales_rows = cur.fetchall()
    cur.close()
    conn.close()

    if not sales_rows:
        return jsonify({"status": "error", "message": "No sales data found"}), 400

    avg_daily_demand, predicted_weekly_demand, days_of_stock, sales_summary = calculate_forecast(
        sales_rows, current_stock)

    query = f"restocking and demand forecast for {product_name}"
    retrieved = retrieve_context(product_id, query, top_k=3)

    recommendation, error = generate_recommendation(
        product_name, current_stock, avg_daily_demand,
        predicted_weekly_demand, days_of_stock,
        sales_summary, retrieved
    )

    if error:
        return jsonify({"status": "error", "message": "AI unavailable", "raw": error}), 500

    return jsonify({
        "product": product_name,
        "current_stock": current_stock,
        "avg_daily_demand": avg_daily_demand,
        "predicted_weekly_demand": predicted_weekly_demand,
        "days_of_stock_remaining": days_of_stock,
        "retrieved_context_count": len(retrieved),
        "recommendation": recommendation
    })

# ─── Health ──────────────────────────────────────────────────────────────────

@app.route("/")
def home():
    return jsonify({"status": "Inventory Forecast API running"})

if __name__ == "__main__":
    app.run(debug=True)