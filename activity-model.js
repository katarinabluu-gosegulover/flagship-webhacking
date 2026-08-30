(function registerActivityModel(root) {
  function localDateKey(value) {
    const target = value instanceof Date ? new Date(value) : new Date(value);
    if (Number.isNaN(target.getTime())) return '';
    return `${target.getFullYear()}-${String(target.getMonth() + 1).padStart(2, '0')}-${String(target.getDate()).padStart(2, '0')}`;
  }

  function buildActivityModel(submissions, options = {}) {
    const weeks = Math.max(1, Number(options.weeks) || 16);
    const studentId = options.studentId || 'all';
    const today = options.today ? new Date(options.today) : new Date();
    today.setHours(0, 0, 0, 0);

    const start = new Date(today);
    start.setDate(start.getDate() - start.getDay() - ((weeks - 1) * 7));
    const end = new Date(today);
    end.setHours(23, 59, 59, 999);

    const filtered = (submissions || []).filter((item) => {
      const submittedAt = new Date(item.submitted_at);
      return !Number.isNaN(submittedAt.getTime())
        && submittedAt >= start
        && submittedAt <= end
        && (studentId === 'all' || item.student_id === studentId);
    });

    const counts = new Map();
    const byDate = new Map();
    filtered.forEach((item) => {
      const key = localDateKey(item.submitted_at);
      counts.set(key, (counts.get(key) || 0) + 1);
      byDate.set(key, [...(byDate.get(key) || []), item]);
    });

    const columns = [];
    for (let week = 0; week < weeks; week += 1) {
      const weekStart = new Date(start);
      weekStart.setDate(start.getDate() + (week * 7));
      const days = [];
      for (let day = 0; day < 7; day += 1) {
        const current = new Date(weekStart);
        current.setDate(weekStart.getDate() + day);
        const key = localDateKey(current);
        const count = counts.get(key) || 0;
        days.push({
          date: current,
          key,
          count,
          future: current > today,
          level: count === 0 ? 0 : count === 1 ? 1 : count <= 3 ? 2 : count <= 6 ? 3 : 4,
        });
      }
      columns.push({ weekStart, days });
    }

    return {
      weeks,
      start,
      end,
      columns,
      days: columns.flatMap((column) => column.days),
      filtered,
      counts,
      byDate,
      activeDays: counts.size,
      activeStudents: new Set(filtered.map((item) => item.student_id)).size,
    };
  }

  root.flagshipActivity = { localDateKey, buildActivityModel };
})(typeof window === 'undefined' ? globalThis : window);
