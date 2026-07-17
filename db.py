import os
from psycopg2 import pool
from dotenv import load_dotenv

load_dotenv()

# Create a connection pool when the app starts
# min 2 connections always open, max 10 under load
connection_pool = pool.SimpleConnectionPool(
    2, 10,
    os.environ.get("DATABASE_URL")
)

def get_db_connection():
    return connection_pool.getconn()

def release_db_connection(conn):
    connection_pool.putconn(conn)