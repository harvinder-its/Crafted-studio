/**
 * The template's blog pagination. It is a design placeholder there — every link
 * is `href="#"` and there is only one page of posts — so it is rendered here as
 * inert controls rather than as links that go nowhere.
 *
 * When the post list outgrows one page, swap these for <Link> elements pointing
 * at `/blog?page=n` and drive `active` from the search param.
 */
export default function Pagination({ page = 2, pages = 3 }: { page?: number; pages?: number }) {
  return (
    <nav aria-label="Blog pages">
      <ul className="pagination">
        <li className="page-item">
          <span className="page-link" aria-hidden="true">
            <i className="fa fa-chevron-left" />
          </span>
        </li>

        {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
          <li className={`page-item${n === page ? " active" : ""}`} key={n}>
            <span className="page-link" aria-current={n === page ? "page" : undefined}>
              {n}
            </span>
          </li>
        ))}

        <li className="page-item">
          <span className="page-link" aria-hidden="true">
            <i className="fa fa-chevron-right" />
          </span>
        </li>
      </ul>
    </nav>
  );
}
