export default function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;
  return (
    <div className="paginationRow">
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
        <button
          key={`page-${page}`}
          type="button"
          className={`buttonSecondary paginationButton${page === currentPage ? " paginationButtonActive" : ""}`}
          onClick={() => onPageChange(page)}
        >
          {page}
        </button>
      ))}
    </div>
  );
}
