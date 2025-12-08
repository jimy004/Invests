#!/usr/bin/env python3
import sys
import json
import yfinance as yf

# Recibir tickers desde la línea de comandos
tickers = sys.argv[1].split(",") if len(sys.argv) > 1 else []

def obtener_precios_acciones(tickers):
    precios = {}
    for ticker in tickers:
        try:
            data = yf.Ticker(ticker)
            hist = data.history(period="1mo")
            if not hist.empty:
                precios[ticker] = hist["Close"].iloc[-1]
            else:
                precios[ticker] = None
        except Exception:
            precios[ticker] = None
    return precios

# Ejecutar y devolver JSON
result = obtener_precios_acciones(tickers)
print(json.dumps(result))
