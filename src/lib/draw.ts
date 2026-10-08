// The sheet draws itself once per visit; later views of the page are still.
if (document.body.dataset.draw) {
  try {
    sessionStorage.setItem('sheet-drawn', '1');
  } catch {
    /* storage unavailable: the sheet simply draws again next time */
  }
}
