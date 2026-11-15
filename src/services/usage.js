export function consumeUsage(storage, identity, page, limit) {
  const key = `omni_usage_v1:${encodeURIComponent(identity)}:${page}`
  try {
    const saved = Number(storage.getItem(key) || 0)
    const used = Number.isSafeInteger(saved) && saved >= 0 ? saved : limit
    if (used >= limit) return { allowed: false }
    storage.setItem(key, String(used + 1))
    return { allowed: true }
  } catch {
    return { allowed: false, storageError: true }
  }
}
