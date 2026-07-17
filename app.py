from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from db import get_db_connection, release_db_connection
from rag import store_document, store_file, retrieve_context, generate_recommendation
from forecast import calculate_forecast
import os

load_dotenv()
app = Flask(__name__)
CORS(app)

def success(data=None, message=None):
    response = {"success": True}
    if data is not None:
        response["data"] = data
    if message:
        response["message"] = message
    return jsonify(response)

def error(message, status_code=400):
    return jsonify({"success": False, "error": message}), status_code

# ─── Products ────────────────────────────────────────────────────────────────

@app.route("/api/v1/products", methods=["POST"])
def add_product():
    data = request.json
    if not data or not data.get("name"):
        return error("Product name is required")
    conn = get_db_connection()
    try:
        cur = conn.cursor()
        cur.execute(
            "INSERT INTO products (name, category, current_stock, price) VALUES (%s, %s, %s, %s) RETURNING id;",
            (data.get("name"), data.get("category"), data.get("current_stock", 0), data.get("price", 0))
        )
        new_id = cur.fetchone()[0]
        conn.commit()
        cur.close()
        return success({"product_id": new_id}, "Product created")
    except Exception as e:
        return error(str(e), 500)
    finally:
        release_db_connection(conn)

@app.route("/api/v1/products", methods=["GET"])
def get_products():
    conn = get_db_connection()
    try:
        cur = conn.cursor()
        cur.execute("SELECT id, name, category, current_stock, price FROM products WHERE id != 0 ORDER BY name;")
        rows = cur.fetchall()
        cur.close()
        products = [{"id": r[0], "name": r[1], "category": r[2],
                     "current_stock": r[3], "price": float(r[4]) if r[4] else 0} for r in rows]
        return success(products)
    except Exception as e:
        return error(str(e), 500)
    finally:
        release_db_connection(conn)

@app.route("/api/v1/products/<int:product_id>", methods=["PUT"])
def update_product(product_id):
    data = request.json
    if not data:
        return error("No data provided")
    conn = get_db_connection()
    try:
        cur = conn.cursor()
        cur.execute(
            "UPDATE products SET name=%s, category=%s, current_stock=%s, price=%s WHERE id=%s;",
            (data.get("name"), data.get("category"), data.get("current_stock"), data.get("price"), product_id)
        )
        conn.commit()
        if cur.rowcount == 0:
            return error("Product not found", 404)
        cur.close()
        return success({"product_id": product_id}, "Product updated")
    except Exception as e:
        return error(str(e), 500)
    finally:
        release_db_connection(conn)

@app.route("/api/v1/products/<int:product_id>", methods=["DELETE"])
def delete_product(product_id):
    conn = get_db_connection()
    try:
        cur = conn.cursor()
        cur.execute("DELETE FROM products WHERE id=%s;", (product_id,))
        conn.commit()
        if cur.rowcount == 0:
            return error("Product not found", 404)
        cur.close()
        return success(message="Product deleted")
    except Exception as e:
        return error(str(e), 500)
    finally:
        release_db_connection(conn)

# ─── Sales ───────────────────────────────────────────────────────────────────

@app.route("/api/v1/sales", methods=["POST"])
def add_sale():
    data = request.json
    if not data or not data.get("product_id") or not data.get("quantity_sold"):
        return error("product_id and quantity_sold are required")
    product_id = data.get("product_id")
    quantity_sold = data.get("quantity_sold")
    sale_date = data.get("sale_date")
    conn = get_db_connection()
    try:
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
        return success({"sale_id": new_id}, "Sale logged")
    except Exception as e:
        return error(str(e), 500)
    finally:
        release_db_connection(conn)

@app.route("/api/v1/sales/<int:product_id>", methods=["GET"])
def get_sales_for_product(product_id):
    conn = get_db_connection()
    try:
        cur = conn.cursor()
        cur.execute(
            "SELECT id, quantity_sold, sale_date FROM sales WHERE product_id=%s ORDER BY sale_date;",
            (product_id,)
        )
        rows = cur.fetchall()
        cur.close()
        return success([{"id": r[0], "quantity_sold": r[1], "sale_date": str(r[2])} for r in rows])
    except Exception as e:
        return error(str(e), 500)
    finally:
        release_db_connection(conn)

# ─── Documents ───────────────────────────────────────────────────────────────

@app.route("/api/v1/documents/upload", methods=["POST"])
def upload_document():
    try:
        if 'file' in request.files:
            file = request.files['file']
            product_id = request.form.get('product_id')
            if not product_id:
                return error("product_id is required")
            file_bytes = file.read()
            chunks_stored = store_file(int(product_id), file_bytes, file.filename)
            return success({"chunks_stored": chunks_stored, "filename": file.filename}, "File uploaded")
        data = request.json
        if not data or not data.get("product_id") or not data.get("content"):
            return error("product_id and content are required")
        chunks_stored = store_document(int(data["product_id"]), data["content"])
        return success({"chunks_stored": chunks_stored}, "Document uploaded")
    except Exception as e:
        return error(str(e), 500)

@app.route("/api/v1/documents/<int:product_id>", methods=["GET"])
def get_documents(product_id):
    conn = get_db_connection()
    try:
        cur = conn.cursor()
        cur.execute(
            "SELECT id, content, created_at FROM documents WHERE product_id=%s ORDER BY created_at DESC;",
            (product_id,)
        )
        rows = cur.fetchall()
        cur.close()
        return success([{"id": r[0], "content": r[1][:200] + "...", "created_at": str(r[2])} for r in rows])
    except Exception as e:
        return error(str(e), 500)
    finally:
        release_db_connection(conn)

@app.route("/api/v1/documents/<int:doc_id>", methods=["DELETE"])
def delete_document(doc_id):
    conn = get_db_connection()
    try:
        cur = conn.cursor()
        cur.execute("DELETE FROM documents WHERE id=%s;", (doc_id,))
        conn.commit()
        if cur.rowcount == 0:
            return error("Document not found", 404)
        cur.close()
        return success(message="Document deleted")
    except Exception as e:
        return error(str(e), 500)
    finally:
        release_db_connection(conn)

@app.route("/api/v1/documents/search", methods=["POST"])
def search_documents():
    data = request.json
    if not data or not data.get("query") or not data.get("product_id"):
        return error("query and product_id are required")
    try:
        results = retrieve_context(data["product_id"], data["query"], data.get("top_k", 3))
        return success(results)
    except Exception as e:
        return error(str(e), 500)

# ─── Forecast ────────────────────────────────────────────────────────────────

@app.route("/api/v1/forecast/<int:product_id>", methods=["GET"])
def forecast(product_id):
    conn = get_db_connection()
    try:
        cur = conn.cursor()
        cur.execute("SELECT name, current_stock FROM products WHERE id=%s;", (product_id,))
        product = cur.fetchone()
        if not product:
            return error("Product not found", 404)
        product_name, current_stock = product

        cur.execute(
            "SELECT quantity_sold, sale_date FROM sales WHERE product_id=%s ORDER BY sale_date;",
            (product_id,)
        )
        sales_rows = cur.fetchall()
        cur.close()

        if not sales_rows:
            return error("No sales data found for this product", 400)

        avg_daily_demand, predicted_weekly_demand, days_of_stock, sales_summary = calculate_forecast(
            sales_rows, current_stock)

        query = f"restocking and demand forecast for {product_name}"
        retrieved = retrieve_context(product_id, query, top_k=3)

        # Confidence score based on data quality
        data_points = len(sales_rows)
        avg_similarity = sum(r["similarity"] for r in retrieved) / len(retrieved) if retrieved else 0
        confidence = min(100, round(
            (min(data_points, 30) / 30 * 50) +  # 50% weight on data quantity
            (avg_similarity * 50)                 # 50% weight on retrieval quality
        ))

        recommendation, err = generate_recommendation(
            product_name, current_stock, avg_daily_demand,
            predicted_weekly_demand, days_of_stock,
            sales_summary, retrieved
        )

        if err:
            return error("AI service unavailable", 500)

        return success({
            "product": product_name,
            "current_stock": current_stock,
            "avg_daily_demand": round(avg_daily_demand, 2),
            "predicted_weekly_demand": predicted_weekly_demand,
            "days_of_stock_remaining": days_of_stock,
            "retrieved_context_count": len(retrieved),
            "confidence_score": confidence,
            "recommendation": recommendation
        })
    except Exception as e:
        return error(str(e), 500)
    finally:
        release_db_connection(conn)

# ─── Health ──────────────────────────────────────────────────────────────────

@app.route("/api/v1/health", methods=["GET"])
def health():
    return success({"status": "ok", "version": "1.0.0"})

@app.route("/")
def home():
    return success({"status": "Inventory IQ API", "version": "1.0.0"})

if __name__ == "__main__":
    app.run(debug=True)