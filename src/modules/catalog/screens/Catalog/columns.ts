// The table's column widths. A <colgroup> with `table-fixed` is what makes the
// header and the body agree — the browser's own column algorithm, rather than a
// grid template repeated in two places and drifting apart.
export const CATALOG_COLUMNS = [
  'w-11', // artwork
  'w-auto', // release · takes what is left
  'w-42', // artist
  'w-23', // type
  'w-29', // status
  'w-29', // release date
  'w-42', // streams
];
