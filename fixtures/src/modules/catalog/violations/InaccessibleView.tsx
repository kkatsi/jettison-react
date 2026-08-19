// VIOLATION — section 6: a view nobody can use without a mouse and eyes.
// Expected: jsx-a11y/alt-text, jsx-a11y/click-events-have-key-events,
// jsx-a11y/no-static-element-interactions, jsx-a11y/anchor-is-valid.
export function InaccessibleView({ onOpen }: { onOpen: () => void }) {
  return (
    <section>
      <img src="/artwork.png" />

      <div onClick={onOpen}>Open release</div>

      <a href="#">Distribution</a>
    </section>
  );
}
