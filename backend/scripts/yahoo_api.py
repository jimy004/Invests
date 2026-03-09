import argparse
import json
import sys

import yfinance as yf


def obtener_nombre(ticker_obj, symbol):
    try:
        info = ticker_obj.info or {}
        raw_nombre = info.get("longName") or info.get("shortName") or info.get("displayName")
        if raw_nombre:
            return str(raw_nombre), True
        return symbol, False
    except Exception:
        return symbol, False


def obtener_precio_cierre(ticker_obj):
    try:
        history = ticker_obj.history(period="5d")
        if history is None or "Close" not in history:
            return None
        close = history["Close"].dropna()
        if close.empty:
            return None
        return float(close.iloc[-1])
    except Exception:
        return None


def extraer_numero(value):
    try:
        number = float(value)
        if number > 0:
            return number
        return None
    except Exception:
        return None


def extraer_texto(value):
    if value is None:
        return None
    text = str(value).strip()
    return text if text else None


def obtener_precio_fallback(ticker_obj):
    try:
        fast_info = ticker_obj.fast_info
    except Exception:
        fast_info = None

    if fast_info is not None:
        if isinstance(fast_info, dict):
            keys = ["lastPrice", "regularMarketPrice", "last_price", "regular_market_price"]
            for key in keys:
                price = extraer_numero(fast_info.get(key))
                if price is not None:
                    return price
        else:
            attrs = ["lastPrice", "regularMarketPrice", "last_price", "regular_market_price"]
            for attr in attrs:
                price = extraer_numero(getattr(fast_info, attr, None))
                if price is not None:
                    return price

    try:
        info = ticker_obj.info or {}
    except Exception:
        info = {}

    info_keys = ["regularMarketPrice", "currentPrice", "previousClose", "navPrice"]
    for key in info_keys:
        price = extraer_numero(info.get(key))
        if price is not None:
            return price

    return None


def obtener_metricas_mercado(ticker_obj):
    market_cap = None
    volume = None
    change_percent = None
    currency = None
    exchange = None

    try:
        fast_info = ticker_obj.fast_info
    except Exception:
        fast_info = None

    if fast_info is not None:
        if isinstance(fast_info, dict):
            market_cap = extraer_numero(
                fast_info.get("marketCap")
                or fast_info.get("market_cap")
            )
            volume = extraer_numero(
                fast_info.get("regularMarketVolume")
                or fast_info.get("regular_market_volume")
                or fast_info.get("lastVolume")
                or fast_info.get("last_volume")
            )
            currency = extraer_texto(fast_info.get("currency"))
            exchange = extraer_texto(
                fast_info.get("fullExchangeName")
                or fast_info.get("exchange")
            )
        else:
            market_cap = extraer_numero(
                getattr(fast_info, "marketCap", None)
                or getattr(fast_info, "market_cap", None)
            )
            volume = extraer_numero(
                getattr(fast_info, "regularMarketVolume", None)
                or getattr(fast_info, "regular_market_volume", None)
                or getattr(fast_info, "lastVolume", None)
                or getattr(fast_info, "last_volume", None)
            )
            currency = extraer_texto(getattr(fast_info, "currency", None))
            exchange = extraer_texto(
                getattr(fast_info, "fullExchangeName", None)
                or getattr(fast_info, "exchange", None)
            )

    try:
        info = ticker_obj.info or {}
    except Exception:
        info = {}

    if market_cap is None:
        market_cap = extraer_numero(info.get("marketCap"))
    if volume is None:
        volume = extraer_numero(info.get("regularMarketVolume") or info.get("volume"))

    change_percent = extraer_numero(info.get("regularMarketChangePercent"))
    currency = currency or extraer_texto(info.get("currency"))
    exchange = exchange or extraer_texto(info.get("fullExchangeName") or info.get("exchange"))

    # Si no viene el % de variacion, lo calculamos con precio actual vs cierre previo.
    if change_percent is None:
        current_price = obtener_precio_fallback(ticker_obj)
        prev_close = extraer_numero(info.get("regularMarketPreviousClose") or info.get("previousClose"))
        if current_price is not None and prev_close is not None and prev_close > 0:
            change_percent = ((current_price - prev_close) / prev_close) * 100.0

    return {
        "capitalizacion": market_cap,
        "volumen": volume,
        "variacion_porcentual": change_percent,
        "moneda": currency,
        "mercado": exchange,
    }


def obtener_quote_type(ticker_obj):
    try:
        info = ticker_obj.info or {}
    except Exception:
        info = {}
    quote_type = info.get("quoteType") or info.get("quote_type")
    if quote_type is None:
        return None
    text = str(quote_type).strip()
    return text.upper() if text else None


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--symbol", required=True)
    args = parser.parse_args()

    symbol = str(args.symbol or "").strip().upper()
    if not symbol:
        print(json.dumps({"error": "symbol requerido"}))
        return 1

    try:
        ticker_obj = yf.Ticker(symbol)
        nombre, nombre_confirmado = obtener_nombre(ticker_obj, symbol)
        precio = obtener_precio_cierre(ticker_obj)
        if precio is None:
            precio = obtener_precio_fallback(ticker_obj)
        metricas = obtener_metricas_mercado(ticker_obj)
        quote_type = obtener_quote_type(ticker_obj)

        if not nombre_confirmado and precio is None:
            raise ValueError(f"Yahoo no devolvio datos validos para {symbol}")

        print(
            json.dumps(
                {
                    "ticker": symbol,
                    "nombre": nombre,
                    "precio": precio,
                    "quote_type": quote_type,
                    **metricas,
                },
                ensure_ascii=True,
            )
        )
        return 0
    except Exception as exc:
        print(json.dumps({"error": str(exc)}), file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
