export function createInterop(obj) {
  if (obj && obj.__esModule) {
    return obj.default;
  }
  return obj;
}
