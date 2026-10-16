import '@testing-library/jest-dom';

// Saved demo data must not leak from one test into the next
afterEach(() => {
  window.localStorage.clear();
});

// jsdom (the browser stand-in Jest uses) has <dialog> but not showModal() or
// close(). Real browsers have both; these stand-ins just toggle `open`.
if (!HTMLDialogElement.prototype.showModal) {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.open = true;
  };
  HTMLDialogElement.prototype.close = function close() {
    this.open = false;
  };
}
