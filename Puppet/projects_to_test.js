const projects_to_test = [
  "Anna-s-cafe-chair-rope",
  "Laundry-Shelf",
  "Wall-Anchor",
];

if (typeof module !== "undefined" && module.exports) {
  module.exports = projects_to_test;
} else {
  window.projects_to_test = projects_to_test;
}
