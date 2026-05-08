import { formatNewsDateTime } from "../utils/format.js";

export default function NoticiasPage({ loading, noticias, fetchedAt, error, onRefresh }) {
  return (
    <>
      <div className="listHeader">
        <h1>Noticias</h1>
        <button type="button" className="buttonSecondary" onClick={onRefresh} disabled={loading}>
          {loading ? "Actualizando..." : "Actualizar"}
        </button>
      </div>
      {fetchedAt ? (
        <p className="newsMeta">Ultima actualizacion: {formatNewsDateTime(fetchedAt)}</p>
      ) : null}
      <section>
        <h2>Mas recientes de Yahoo Finance</h2>
        {loading && noticias.length === 0 ? <p>Cargando noticias...</p> : null}
        <div className="newsGrid">
          {noticias.length === 0 ? (
            <p className="chartNoData">No hay noticias recientes disponibles.</p>
          ) : (
            noticias.map((news) => (
              <article key={`recent-${news.id}`} className="newsCard">
                <h3>
                  <a href={news.enlace} target="_blank" rel="noreferrer">{news.titulo}</a>
                </h3>
                <p className="newsMeta">
                  {news.proveedor || "Yahoo Finance"} - {formatNewsDateTime(news.publicado_en)}
                </p>
              </article>
            ))
          )}
        </div>
      </section>
      {error ? <pre className="error">{error}</pre> : null}
    </>
  );
}
