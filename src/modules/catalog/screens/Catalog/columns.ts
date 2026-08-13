// The table's column widths. A <colgroup> with `table-fixed` is what makes the
// header and the body agree — the browser's own column algorithm, rather than a
// grid template repeated in two places and drifting apart.
// The artwork has no column of its own: it is part of how a release is named, not
// a fact about it, so it sits in the Release cell — and the header has no empty
// first cell to explain.
export const CATALOG_COLUMNS = [
  'w-auto', // release · artwork, title, catalogue number
  'w-42', // artist
  'w-23', // type
  'w-29', // status
  'w-29', // release date
  'w-22', // trend
  'w-25', // streams
];
