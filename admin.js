(async function initAdmin() {
  const backend = window.flagshipBackend;
  const reviewFor = window.flagshipReviews.first;
  const app = document.querySelector('#adminApp');
  const modal = document.querySelector('#modalBackdrop');
  const modalContent = document.querySelector('#modalContent');
  const sidebar = document.querySelector('#adminSidebar');
  let auth;
  let data = { profiles: [], curriculum: [], assignments: [], submissions: [], resources: [] };
  let route = location.hash.slice(1) || 'overview';
  let activityStudent = 'all';

  const esc = (value = '') => String(value).replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char]);
  const date = (value) => value ? new Intl.DateTimeFormat('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(value)) : '-';
  const size = (bytes) => !bytes ? '-' : bytes > 1048576 ? `${(bytes / 1048576).toFixed(1)} MB` : `${Math.ceil(bytes / 1024)} KB`;

  function toast(message, error = false) {
    const el = document.querySelector('#toast');
    el.textContent = message;
    if (error) el.style.background = 'var(--red)';
    el.classList.add('show');
    setTimeout(() => { el.classList.remove('show'); el.style.background = ''; }, 2800);
  }
  function openModal(html) { modalContent.innerHTML = html; modal.hidden = false; document.body.style.overflow = 'hidden'; }
  function closeModal() { modal.hidden = true; document.body.style.overflow = ''; }
  async function refresh() { data = await backend.adminDashboardData(); render(); }

  function head(kicker, title, desc, action = '') {
    return `<div class="page-head"><div><span class="eyebrow">${kicker}</span><h1>${title}</h1><p>${desc}</p></div>${action ? `<div class="head-actions">${action}</div>` : ''}</div>`;
  }

  function localDateKey(value) {
    return window.flagshipActivity.localDateKey(value);
  }

  function submissionActivity(studentId = 'all') {
    const filtered = studentId === 'all'
      ? data.submissions
      : data.submissions.filter((item) => item.student_id === studentId);
    const counts = new Map();
    filtered.forEach((item) => {
      const key = localDateKey(item.submitted_at);
      if (key) counts.set(key, (counts.get(key) || 0) + 1);
    });
    return { filtered, counts };
  }

  function activityGrass() {
    const weeks = 16;
    const activity = window.flagshipActivity.buildActivityModel(data.submissions, { studentId: activityStudent, weeks });
    const cells = [];
    const monthLabels = [];
    let previousMonth = -1;

    activity.columns.forEach((column, week) => {
      const { weekStart } = column;
      if (weekStart.getMonth() !== previousMonth) {
        monthLabels.push(`<span style="grid-column:${week + 1}">${new Intl.DateTimeFormat('ko-KR', { month: 'short' }).format(weekStart)}</span>`);
        previousMonth = weekStart.getMonth();
      }
      column.days.forEach((day) => {
        const label = `${new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' }).format(day.date)} · 제출 ${day.count}건`;
        cells.push(`<button type="button" class="grass-cell level-${day.level}${day.future ? ' future' : ''}" data-grass-date="${day.key}" aria-label="${label}" title="${label}" ${day.count === 0 || day.future ? 'disabled' : ''}></button>`);
      });
    });

    const studentOptions = data.profiles
      .filter((profile) => profile.role === 'student')
      .map((profile) => `<option value="${profile.id}" ${activityStudent === profile.id ? 'selected' : ''}>${esc(profile.display_name)}</option>`)
      .join('');

    return `<section class="panel activity-panel">
      <div class="activity-head">
        <div><span class="panel-kicker">SUBMISSION ACTIVITY / 16 WEEKS</span><h2>과제 제출 잔디</h2><p>날짜별 제출량을 확인하고 블록을 눌러 상세 내역을 볼 수 있습니다.</p></div>
        <select class="activity-filter" id="activityStudentFilter" aria-label="학생별 제출 활동 필터"><option value="all">전체 학생</option>${studentOptions}</select>
      </div>
      <div class="grass-summary">
        <div><strong>${activity.filtered.length}</strong><span>기간 내 제출</span></div>
        <div><strong>${activity.activeDays}</strong><span>활동한 날짜</span></div>
        <div><strong>${activity.activeStudents}</strong><span>참여 학생</span></div>
      </div>
      <div class="grass-scroll">
        <div class="grass-calendar">
          <div class="grass-months">${monthLabels.join('')}</div>
          <div class="grass-body">
            <div class="grass-days" aria-hidden="true"><span></span><span>월</span><span></span><span>수</span><span></span><span>금</span><span></span></div>
            <div class="grass-grid">${cells.join('')}</div>
          </div>
        </div>
      </div>
      <div class="grass-footer"><span>최근 16주 · 일요일 시작</span><div class="grass-legend"><span>적음</span><i class="level-0"></i><i class="level-1"></i><i class="level-2"></i><i class="level-3"></i><i class="level-4"></i><span>많음</span></div></div>
    </section>`;
  }

  function overview() {
    const pending = data.submissions.filter((item) => item.status === 'submitted').length;
    const graded = data.submissions.filter((item) => item.status === 'graded').length;
    const recent = data.submissions.slice(0, 5);
    return `${head('ADMIN MISSION CONTROL', '운영 현황', '동아리 교육 진행 상태와 처리할 작업을 한눈에 확인하세요.')}
      <div class="admin-stats">
        <article class="admin-stat"><span>전체 멤버</span><strong>${data.profiles.length}</strong><small>관리자 포함 등록 계정</small></article>
        <article class="admin-stat alert"><span>검사 대기</span><strong>${pending}</strong><small>피드백이 필요한 제출물</small></article>
        <article class="admin-stat"><span>채점 완료</span><strong>${graded}</strong><small>전체 제출물 기준</small></article>
        <article class="admin-stat"><span>공개 과제</span><strong>${data.assignments.filter((item) => item.is_published).length}</strong><small>현재 교육생에게 공개됨</small></article>
      </div>
      ${activityGrass()}
      <div class="admin-grid">
        <section class="panel"><div class="panel-head"><div><span class="panel-kicker">RECENT ACTIVITY</span><h2>최근 제출</h2></div><button class="small-btn" data-jump="submissions">전체 보기</button></div><div class="admin-list">${recent.length ? recent.map((item) => `<div class="activity-row"><span class="activity-icon">${esc(item.profiles?.display_name?.[0] || '?')}</span><div><strong>${esc(item.profiles?.display_name || '알 수 없음')} · ${esc(item.assignments?.title || '삭제된 과제')}</strong><small>${esc(item.original_file_name)}</small></div><time>${date(item.submitted_at)}</time></div>`).join('') : '<div class="empty">아직 제출물이 없습니다.</div>'}</div></section>
        <section class="panel"><div class="panel-head"><div><span class="panel-kicker">QUICK COMMAND</span><h2>빠른 작업</h2></div></div><div class="quick-actions"><button class="quick-action" data-action="new-assignment"><b>+</b><span>새 과제 만들기</span></button><button class="quick-action" data-action="new-resource"><b>↑</b><span>수업 자료 올리기</span></button><button class="quick-action" data-jump="submissions"><b>✓</b><span>제출물 검사하기</span></button><button class="quick-action" data-jump="members"><b>◎</b><span>멤버 권한 관리</span></button></div></section>
      </div>`;
  }

  function submissions() {
    return `${head('REVIEW QUEUE', '제출 검사', 'private 저장소의 제출 파일을 확인하고 점수와 피드백을 기록하세요.')}
      <div class="toolbar"><div class="search"><input id="adminSearch" placeholder="학생, 과제 또는 파일명 검색" /></div><select id="statusFilter"><option value="all">전체 상태</option><option value="submitted">검사 대기</option><option value="graded">채점 완료</option></select></div>
      <div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>STUDENT</th><th>ASSIGNMENT</th><th>FILE</th><th>SUBMITTED</th><th>STATUS</th><th>ACTION</th></tr></thead><tbody>${data.submissions.map((item) => { const review = reviewFor(item.reviews); return `<tr data-search="${esc(`${item.profiles?.display_name} ${item.assignments?.title} ${item.original_file_name}`.toLowerCase())}" data-status="${item.status}"><td><div class="student"><span class="avatar">${esc(item.profiles?.display_name?.[0] || '?')}</span><strong>${esc(item.profiles?.display_name || '알 수 없음')}</strong></div></td><td>${esc(item.assignments?.title || '-')}</td><td>${esc(item.original_file_name)}</td><td>${date(item.submitted_at)}</td><td><span class="status ${item.status === 'graded' ? 'done' : 'wait'}">${item.status === 'graded' ? `${review?.score ?? '-'}점` : '검사 대기'}</span></td><td class="actions"><button class="small-btn" data-view-file="${item.id}">파일</button><button class="small-btn" data-review-id="${item.id}">${item.status === 'graded' ? '수정' : '채점'}</button><button class="danger-btn" data-delete-submission="${item.id}">삭제</button></td></tr>`; }).join('')}</tbody></table></div>`;
  }

  function assignments() {
    return `${head('CONTENT MANAGEMENT', '과제 관리', '과제 공개 상태와 마감일을 관리합니다.', '<button class="primary-btn" data-action="new-assignment">새 과제 +</button>')}
      <div class="admin-card-grid">${data.assignments.map((item) => `<article class="manage-card"><div class="card-meta"><span class="week-badge">${esc(item.code)}</span><span class="status ${item.is_published ? 'done' : 'lock'}">${item.is_published ? '공개' : '비공개'}</span></div><h3>${esc(item.title)}</h3><p>${esc(item.description)}</p><div class="card-foot"><span>마감 · ${date(item.due_at)}</span><div><button class="small-btn" data-edit-assignment="${item.id}">수정</button><button class="danger-btn" data-delete-assignment="${item.id}">삭제</button></div></div></article>`).join('')}</div>`;
  }

  function curriculumView() {
    return `${head('TRAINING PATH MANAGEMENT', '커리큘럼 관리', '주차별 학습 내용과 공개 진행 상태를 관리합니다.', '<button class="primary-btn" data-action="new-week">새 주차 +</button>')}
      <div class="admin-card-grid">${data.curriculum.map((item) => `<article class="manage-card"><div class="card-meta"><span class="week-badge">WEEK ${String(item.week_number).padStart(2,'0')}</span><span class="status ${item.status === 'done' ? 'done' : item.status === 'active' ? 'now' : 'lock'}">${item.status.toUpperCase()}</span></div><h3>${esc(item.title)}</h3><p>${esc(item.description)}</p><div class="tags">${(item.tags || []).map((tag) => `<span class="tag">${esc(tag)}</span>`).join('')}</div><div class="card-foot"><span>${item.level} · ${item.duration_minutes}분</span><div><button class="small-btn" data-edit-week="${item.id}">수정</button><button class="danger-btn" data-delete-week="${item.id}">삭제</button></div></div></article>`).join('')}</div>`;
  }

  function resources() {
    return `${head('STORAGE MANAGEMENT', '자료 관리', '수업 자료를 private 저장소에 올리고 공개 범위를 관리합니다.', '<button class="primary-btn" data-action="new-resource">자료 업로드 +</button>')}
      <div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>TITLE</th><th>CATEGORY</th><th>FILE</th><th>SIZE</th><th>CREATED</th><th>ACTION</th></tr></thead><tbody>${data.resources.map((item) => `<tr><td><strong>${esc(item.title)}</strong></td><td><span class="tag">${esc(item.category)}</span></td><td>${esc(item.original_file_name || '외부 링크')}</td><td>${size(item.size_bytes)}</td><td>${date(item.created_at)}</td><td class="actions"><button class="small-btn" data-resource-open="${item.id}">열기</button><button class="danger-btn" data-resource-delete="${item.id}">삭제</button></td></tr>`).join('')}</tbody></table></div>`;
  }

  function members() {
    return `${head('ACCESS CONTROL', '멤버 관리', '가입한 멤버의 역할을 관리합니다. 관리자 권한은 신뢰할 수 있는 운영자에게만 부여하세요.')}
      <div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>MEMBER</th><th>USER ID</th><th>JOINED</th><th>ROLE</th></tr></thead><tbody>${data.profiles.map((item) => `<tr><td><div class="student"><span class="avatar">${esc(item.display_name[0])}</span><strong>${esc(item.display_name)}</strong></div></td><td><code>${esc(item.id.slice(0, 8))}…</code></td><td>${date(item.created_at)}</td><td><select class="role-select" data-role-user="${item.id}" ${item.id === auth.user.id ? 'disabled title="자기 자신의 역할은 변경할 수 없습니다"' : ''}><option value="student" ${item.role === 'student' ? 'selected' : ''}>교육생</option><option value="admin" ${item.role === 'admin' ? 'selected' : ''}>관리자</option></select></td></tr>`).join('')}</tbody></table></div>`;
  }

  const views = { overview, submissions, curriculum: curriculumView, assignments, resources, members };

  function render() {
    if (!views[route]) route = 'overview';
    app.innerHTML = views[route]();
    document.querySelector('#adminCrumb').textContent = route.toUpperCase();
    document.querySelectorAll('[data-admin-route]').forEach((button) => button.classList.toggle('active', button.dataset.adminRoute === route));
    sidebar.classList.remove('open');
    bind();
  }

  function bind() {
    app.querySelectorAll('[data-jump]').forEach((el) => el.addEventListener('click', () => { location.hash = el.dataset.jump; }));
    app.querySelectorAll('[data-action="new-assignment"]').forEach((el) => el.addEventListener('click', () => assignmentModal()));
    app.querySelectorAll('[data-action="new-week"]').forEach((el) => el.addEventListener('click', () => curriculumModal()));
    app.querySelectorAll('[data-action="new-resource"]').forEach((el) => el.addEventListener('click', resourceModal));
    app.querySelectorAll('[data-edit-assignment]').forEach((el) => el.addEventListener('click', () => assignmentModal(data.assignments.find((item) => item.id === el.dataset.editAssignment))));
    app.querySelectorAll('[data-edit-week]').forEach((el) => el.addEventListener('click', () => curriculumModal(data.curriculum.find((item) => item.id === el.dataset.editWeek))));
    app.querySelectorAll('[data-delete-week]').forEach((el) => el.addEventListener('click', () => removeWeek(el.dataset.deleteWeek)));
    app.querySelectorAll('[data-delete-assignment]').forEach((el) => el.addEventListener('click', () => removeAssignment(el.dataset.deleteAssignment)));
    app.querySelectorAll('[data-view-file]').forEach((el) => el.addEventListener('click', () => viewSubmission(el.dataset.viewFile)));
    app.querySelectorAll('[data-review-id]').forEach((el) => el.addEventListener('click', () => reviewModal(el.dataset.reviewId)));
    app.querySelectorAll('[data-delete-submission]').forEach((el) => el.addEventListener('click', () => removeSubmission(el.dataset.deleteSubmission)));
    app.querySelectorAll('[data-resource-open]').forEach((el) => el.addEventListener('click', () => viewResource(el.dataset.resourceOpen)));
    app.querySelectorAll('[data-resource-delete]').forEach((el) => el.addEventListener('click', () => removeResource(el.dataset.resourceDelete)));
    app.querySelectorAll('[data-role-user]').forEach((el) => el.addEventListener('change', () => changeRole(el)));
    document.querySelector('#activityStudentFilter')?.addEventListener('change', (event) => {
      activityStudent = event.target.value;
      render();
    });
    app.querySelectorAll('[data-grass-date]').forEach((el) => el.addEventListener('click', () => showDayActivity(el.dataset.grassDate)));
    const search = document.querySelector('#adminSearch'), filter = document.querySelector('#statusFilter');
    if (search && filter) {
      const run = () => document.querySelectorAll('.admin-table tbody tr').forEach((row) => { row.style.display = row.dataset.search.includes(search.value.toLowerCase()) && (filter.value === 'all' || row.dataset.status === filter.value) ? '' : 'none'; });
      search.addEventListener('input', run); filter.addEventListener('change', run);
    }
  }

  function showDayActivity(dateKey) {
    const { filtered } = submissionActivity(activityStudent);
    const matches = filtered
      .filter((item) => localDateKey(item.submitted_at) === dateKey)
      .sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at));
    const selectedName = activityStudent === 'all'
      ? '전체 학생'
      : data.profiles.find((profile) => profile.id === activityStudent)?.display_name || '선택 학생';
    const displayDate = new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' }).format(new Date(`${dateKey}T00:00:00`));
    openModal(`<span class="eyebrow">DAILY SUBMISSIONS / ${esc(selectedName)}</span><h2 id="modalTitle">${displayDate}</h2><p class="modal-desc">이날 제출된 과제 ${matches.length}건입니다.</p><div class="day-activity-list">${matches.map((item) => { const review = reviewFor(item.reviews); return `<div class="day-activity-row"><span class="activity-icon">${esc(item.profiles?.display_name?.[0] || '?')}</span><div><strong>${esc(item.profiles?.display_name || '알 수 없음')} · ${esc(item.assignments?.title || '삭제된 과제')}</strong><small>${esc(item.original_file_name)} · ${date(item.submitted_at)}</small></div><span class="status ${item.status === 'graded' ? 'done' : 'wait'}">${item.status === 'graded' ? `${review?.score ?? '-'}점` : '검사 대기'}</span></div>`; }).join('')}</div><div class="modal-actions"><button class="secondary-btn" data-close-day>닫기</button><button class="primary-btn" data-open-review-queue>제출 검사로 이동 →</button></div>`);
    document.querySelector('[data-close-day]').addEventListener('click', closeModal);
    document.querySelector('[data-open-review-queue]').addEventListener('click', () => { closeModal(); location.hash = 'submissions'; });
  }

  function curriculumModal(item = null) {
    openModal(`<span class="eyebrow">${item ? 'EDIT WEEK' : 'NEW WEEK'}</span><h2 id="modalTitle">${item ? '커리큘럼 수정' : '새 주차 만들기'}</h2><p class="modal-desc">활성 상태의 주차는 교육생 대시보드에 현재 학습으로 표시됩니다.</p><form id="weekForm"><div class="field"><label>주차</label><input name="week_number" type="number" min="1" max="52" required value="${item?.week_number || data.curriculum.length + 1}" /></div><div class="field"><label>제목</label><input name="title" required value="${esc(item?.title || '')}" /></div><div class="field"><label>설명</label><textarea name="description" required>${esc(item?.description || '')}</textarea></div><div class="field"><label>태그 (쉼표로 구분)</label><input name="tags" value="${esc((item?.tags || []).join(', '))}" placeholder="HTTP, Burp Suite" /></div><div class="field"><label>난이도</label><select name="level"><option ${item?.level === 'BASIC' ? 'selected' : ''}>BASIC</option><option ${item?.level === 'CORE' ? 'selected' : ''}>CORE</option><option ${item?.level === 'ADVANCED' ? 'selected' : ''}>ADVANCED</option></select></div><div class="field"><label>상태</label><select name="status"><option value="locked" ${item?.status === 'locked' ? 'selected' : ''}>잠김</option><option value="active" ${item?.status === 'active' ? 'selected' : ''}>현재 학습</option><option value="done" ${item?.status === 'done' ? 'selected' : ''}>완료</option></select></div><div class="field"><label>예상 학습 시간(분)</label><input name="duration_minutes" type="number" min="1" required value="${item?.duration_minutes || 90}" /></div><div class="modal-actions"><button type="button" class="secondary-btn" data-close>취소</button><button class="primary-btn">저장</button></div></form>`);
    document.querySelector('[data-close]').addEventListener('click', closeModal);
    document.querySelector('#weekForm').addEventListener('submit', async (event) => { event.preventDefault(); const fd = new FormData(event.target); const button = event.target.querySelector('.primary-btn'); button.disabled = true; try { await backend.saveCurriculum({ week_number: Number(fd.get('week_number')), title: fd.get('title').trim(), description: fd.get('description').trim(), tags: fd.get('tags').split(',').map((tag) => tag.trim()).filter(Boolean), level: fd.get('level'), status: fd.get('status'), duration_minutes: Number(fd.get('duration_minutes')) }, item?.id); closeModal(); await refresh(); toast('커리큘럼이 저장되었습니다.'); } catch (error) { toast(error.message, true); button.disabled = false; } });
  }

  function assignmentModal(item = null) {
    openModal(`<span class="eyebrow">${item ? 'EDIT ASSIGNMENT' : 'NEW ASSIGNMENT'}</span><h2 id="modalTitle">${item ? '과제 수정' : '새 과제 만들기'}</h2><p class="modal-desc">저장 후 공개된 과제는 모든 교육생 화면에 표시됩니다.</p><form id="assignmentForm"><div class="field"><label>과제 코드</label><input name="code" required value="${esc(item?.code || '')}" placeholder="A-04" /></div><div class="field"><label>과제명</label><input name="title" required value="${esc(item?.title || '')}" /></div><div class="field"><label>설명</label><textarea name="description" required>${esc(item?.description || '')}</textarea></div><div class="field"><label>마감일</label><input name="due_at" type="datetime-local" required value="${item ? new Date(item.due_at).toISOString().slice(0,16) : ''}" /></div><div class="field"><label><input name="is_published" type="checkbox" ${item?.is_published ? 'checked' : ''} style="width:auto" /> 교육생에게 공개</label></div><div class="modal-actions"><button type="button" class="secondary-btn" data-close>취소</button><button class="primary-btn">저장</button></div></form>`);
    document.querySelector('[data-close]').addEventListener('click', closeModal);
    document.querySelector('#assignmentForm').addEventListener('submit', async (event) => {
      event.preventDefault(); const fd = new FormData(event.target); const button = event.target.querySelector('.primary-btn'); button.disabled = true;
      try { await backend.saveAssignment({ code: fd.get('code').trim(), title: fd.get('title').trim(), description: fd.get('description').trim(), due_at: new Date(fd.get('due_at')).toISOString(), is_published: fd.get('is_published') === 'on' }, item?.id); closeModal(); await refresh(); toast('과제가 저장되었습니다.'); } catch (error) { toast(error.message, true); button.disabled = false; }
    });
  }

  function resourceModal() {
    openModal(`<span class="eyebrow">PRIVATE STORAGE</span><h2 id="modalTitle">수업 자료 업로드</h2><p class="modal-desc">자료는 private bucket에 저장되고 로그인한 멤버에게만 제한 시간 URL로 제공됩니다.</p><form id="resourceForm"><div class="field"><label>자료명</label><input name="title" required /></div><div class="field"><label>설명</label><textarea name="description" required></textarea></div><div class="field"><label>분류</label><select name="category"><option>강의자료</option><option>실습파일</option><option>가이드</option></select></div><div class="field"><label>파일</label><div class="file-drop"><input name="file" type="file" required /></div></div><div class="modal-actions"><button type="button" class="secondary-btn" data-close>취소</button><button class="primary-btn">업로드</button></div></form>`);
    document.querySelector('[data-close]').addEventListener('click', closeModal);
    document.querySelector('#resourceForm').addEventListener('submit', async (event) => { event.preventDefault(); const fd = new FormData(event.target); const button = event.target.querySelector('.primary-btn'); button.disabled = true; button.textContent = '업로드 중...'; try { await backend.uploadResource({ title: fd.get('title').trim(), description: fd.get('description').trim(), category: fd.get('category'), file: fd.get('file'), adminId: auth.user.id }); closeModal(); await refresh(); toast('자료가 안전하게 업로드되었습니다.'); } catch (error) { toast(error.message, true); button.disabled = false; button.textContent = '업로드'; } });
  }

  function reviewModal(id) {
    const item = data.submissions.find((entry) => entry.id === id); const review = reviewFor(item.reviews);
    openModal(`<span class="eyebrow">REVIEW / ${esc(item.profiles?.display_name)}</span><h2 id="modalTitle">${esc(item.assignments?.title)}</h2><p class="modal-desc">${esc(item.original_file_name)} · ${date(item.submitted_at)}</p><form id="reviewForm"><div class="field"><label>점수 (0–100)</label><input name="score" type="number" min="0" max="100" required value="${review?.score ?? 90}" /></div><div class="field"><label>피드백</label><textarea name="feedback" required placeholder="잘한 점과 개선할 점을 구체적으로 적어주세요.">${esc(review?.feedback || '')}</textarea></div><div class="modal-actions"><button type="button" class="secondary-btn" data-open-submission>제출 파일 열기</button><button class="primary-btn">채점 저장</button></div></form>`);
    document.querySelector('[data-open-submission]').addEventListener('click', () => viewSubmission(id));
    document.querySelector('#reviewForm').addEventListener('submit', async (event) => { event.preventDefault(); const fd = new FormData(event.target); const button = event.target.querySelector('.primary-btn'); button.disabled = true; try { await backend.saveReview({ submissionId: id, reviewerId: auth.user.id, score: Number(fd.get('score')), feedback: fd.get('feedback').trim() }); closeModal(); await refresh(); toast('점수와 피드백이 저장되었습니다.'); } catch (error) { toast(error.message, true); button.disabled = false; } });
  }

  async function viewSubmission(id) { try { const item = data.submissions.find((entry) => entry.id === id); const url = await backend.createSignedUrl('submissions', item.file_path); window.open(url, '_blank', 'noopener'); } catch (error) { toast(error.message, true); } }
  async function removeSubmission(id) { const item = data.submissions.find((entry) => entry.id === id); if (!item) return; if (!confirm(`${item.profiles?.display_name || '학생'}의 ${item.assignments?.title || '과제'} 제출을 삭제할까요? 피드백과 저장된 파일도 함께 영구 삭제되며, 학생은 다시 제출할 수 있습니다.`)) return; try { const result = await backend.deleteSubmission(item); await refresh(); toast(result.fileRemoved ? '제출, 피드백, 파일을 삭제했습니다.' : '제출과 피드백은 삭제했습니다. 파일 정리는 Storage에서 확인하세요.'); } catch (error) { toast(error.message, true); } }
  async function viewResource(id) { try { const item = data.resources.find((entry) => entry.id === id); if (item.external_url) return window.open(item.external_url, '_blank', 'noopener'); const url = await backend.createSignedUrl('resources', item.file_path); window.open(url, '_blank', 'noopener'); } catch (error) { toast(error.message, true); } }
  async function removeAssignment(id) { if (!confirm('이 과제를 삭제할까요? 연결된 제출물도 함께 삭제됩니다.')) return; try { await backend.deleteAssignment(id); await refresh(); toast('과제가 삭제되었습니다.'); } catch (error) { toast(error.message, true); } }
  async function removeWeek(id) { if (!confirm('이 주차를 삭제할까요? 연결된 과제는 주차 연결만 해제됩니다.')) return; try { await backend.deleteCurriculum(id); await refresh(); toast('커리큘럼 주차가 삭제되었습니다.'); } catch (error) { toast(error.message, true); } }
  async function removeResource(id) { if (!confirm('이 자료와 저장된 파일을 삭제할까요?')) return; try { const item = data.resources.find((entry) => entry.id === id); await backend.deleteResource(item); await refresh(); toast('자료가 삭제되었습니다.'); } catch (error) { toast(error.message, true); } }
  async function changeRole(select) { const previous = select.value === 'admin' ? 'student' : 'admin'; if (!confirm(`이 멤버의 역할을 ${select.value === 'admin' ? '관리자' : '교육생'}로 변경할까요?`)) { select.value = previous; return; } try { await backend.updateUserRole(select.dataset.roleUser, select.value); toast('멤버 권한이 변경되었습니다.'); } catch (error) { select.value = previous; toast(error.message, true); } }

  document.querySelectorAll('[data-admin-route]').forEach((button) => button.addEventListener('click', () => { location.hash = button.dataset.adminRoute; }));
  window.addEventListener('hashchange', () => { route = location.hash.slice(1) || 'overview'; render(); });
  document.querySelector('#adminMenu').addEventListener('click', () => sidebar.classList.toggle('open'));
  document.querySelector('#adminSignOut').addEventListener('click', () => backend.signOut());
  document.querySelector('#modalClose').addEventListener('click', closeModal);
  modal.addEventListener('click', (event) => event.target === modal && closeModal());
  document.addEventListener('keydown', (event) => event.key === 'Escape' && closeModal());

  try {
    if (!backend.configured) { location.replace('login.html'); return; }
    auth = await backend.requireAuth({ admin: true });
    if (!auth) return;
    document.querySelector('#adminName').textContent = auth.profile.display_name;
    document.querySelector('#adminEmail').textContent = auth.user.email;
    data = await backend.adminDashboardData();
    render();
  } catch (error) {
    app.innerHTML = `<div class="empty"><strong>관리자 데이터를 불러오지 못했습니다.</strong><p>${esc(error.message)}</p><button class="small-btn" onclick="location.reload()">다시 시도</button></div>`;
  }
})();
