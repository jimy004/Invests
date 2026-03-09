import { fetchYahooFinanceNewsByQuery } from "../services/yahoo.service.js";

function byDateDesc(a, b) {
  return String(b?.publicado_en || "").localeCompare(String(a?.publicado_en || ""));
}

function dedupeNews(items) {
  const seen = new Set();
  const output = [];
  for (const item of items) {
    const key = String(item?.id || item?.enlace || "").trim();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    output.push(item);
  }
  return output;
}

function isWithinDays(dateIso, days) {
  const publishedMs = Date.parse(String(dateIso || ""));
  if (!Number.isFinite(publishedMs)) return false;
  const ageMs = Date.now() - publishedMs;
  return ageMs >= 0 && ageMs <= days * 24 * 60 * 60 * 1000;
}

function getProviderWeight(providerRaw) {
  const provider = String(providerRaw || "").trim().toLowerCase();
  if (!provider) return 0.2;
  if (provider.includes("yahoo")) return 1.1;
  if (provider.includes("reuters")) return 1.5;
  if (provider.includes("bloomberg")) return 1.4;
  if (provider.includes("wall street journal")) return 1.3;
  if (provider.includes("financial times")) return 1.3;
  return 0.8;
}

function scoreWeeklyRelevance(article) {
  const publishedMs = Date.parse(String(article?.publicado_en || ""));
  const ageHours = Number.isFinite(publishedMs)
    ? Math.max(0, (Date.now() - publishedMs) / (1000 * 60 * 60))
    : 24 * 7;
  const recencyScore = Math.max(0, 1 - ageHours / (24 * 7)) * 5;
  const tickerScore = Math.min(4, Number(article?.tickers_relacionados?.length || 0)) * 0.8;
  const mediaScore = article?.imagen ? 0.6 : 0;
  const providerScore = getProviderWeight(article?.proveedor);
  return recencyScore + tickerScore + mediaScore + providerScore;
}

export async function getYahooDigest(req, res) {
  try {
    const [marketNews, financeNews, stocksNews] = await Promise.all([
      fetchYahooFinanceNewsByQuery("market", 25),
      fetchYahooFinanceNewsByQuery("finance", 25),
      fetchYahooFinanceNewsByQuery("stocks", 25)
    ]);

    const merged = dedupeNews([...marketNews, ...financeNews, ...stocksNews]).sort(byDateDesc);
    const recientes = merged.slice(0, 20);
    const relevantes_semana = merged
      .filter((item) => isWithinDays(item?.publicado_en, 7))
      .map((item) => ({
        ...item,
        _score: scoreWeeklyRelevance(item)
      }))
      .sort((a, b) => {
        const byScore = Number(b?._score || 0) - Number(a?._score || 0);
        if (byScore !== 0) return byScore;
        return byDateDesc(a, b);
      })
      .slice(0, 12)
      .map(({ _score, ...item }) => item);

    res.json({
      recientes,
      relevantes_semana,
      fetched_at: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
