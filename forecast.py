def calculate_forecast(sales_rows, current_stock):
    quantities = [r[0] for r in sales_rows]
    avg_daily_demand = sum(quantities) / len(quantities)
    predicted_weekly_demand = round(avg_daily_demand * 7, 1)
    days_of_stock = round(current_stock / avg_daily_demand, 1) if avg_daily_demand > 0 else 999
    sales_summary = "\n".join([f"  {str(r[1])}: {r[0]} units sold" for r in sales_rows])
    return avg_daily_demand, predicted_weekly_demand, days_of_stock, sales_summary