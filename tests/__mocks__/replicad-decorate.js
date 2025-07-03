// Minimal mock for replicad-decorate for Jest integration tests
export function drawSVG() {
  throw new Error('drawSVG is mocked and not implemented.');
}
export default { drawSVG };
