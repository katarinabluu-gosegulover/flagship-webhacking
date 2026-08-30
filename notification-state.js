(function exposeNotificationState(root) {
  const storagePrefix = 'flagship.notifications.read.v1';

  function storageKey(userId) {
    return `${storagePrefix}:${userId}`;
  }

  function readIds(storage, userId) {
    if (!storage || !userId) return new Set();
    try {
      const value = JSON.parse(storage.getItem(storageKey(userId)) || '[]');
      return new Set(Array.isArray(value) ? value.map(String) : []);
    } catch (_) {
      return new Set();
    }
  }

  function unread(items, storage, userId) {
    const seen = readIds(storage, userId);
    return items.filter((item) => !seen.has(String(item.id)));
  }

  function markRead(items, storage, userId) {
    if (!storage || !userId) return;
    const seen = readIds(storage, userId);
    items.forEach((item) => seen.add(String(item.id)));
    try {
      storage.setItem(storageKey(userId), JSON.stringify([...seen]));
    } catch (_) {
      // 읽음 상태 저장이 차단된 브라우저에서는 다음 접속 때 알림이 다시 표시될 수 있습니다.
    }
  }

  root.flagshipNotifications = { unread, markRead, storageKey };
})(globalThis);
