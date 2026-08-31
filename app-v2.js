(async function initStudentApp() {
  const backend = window.flagshipBackend;
  const notificationState = window.flagshipNotifications;
  const reviewFor = window.flagshipReviews.first;
  const canCancelSubmission = window.flagshipSubmissions.canCancel;
  const app = document.querySelector('#app');
  const sidebar = document.querySelector('#sidebar');
  const modal = document.querySelector('#modalBackdrop');
  const modalContent = document.querySelector('#modalContent');
  const notificationButton = document.querySelector('#notificationButton');
  const notificationCount = document.querySelector('#notificationCount');
  let auth = null;
  let curriculum = [];
  let assignments = [];
  let resources = [];
  let submissions = [];

  const esc = (value = '') => String(value).replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char]);
  const date = (value) => value ? new Intl.DateTimeFormat('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(value)) : '-';
  const pageNames = { dashboard: 'DASHBOARD', curriculum: 'CURRICULUM', assignments: 'ASSIGNMENTS', resources: 'RESOURCES' };

  function toast(message, error = false) { const el = document.querySelector('#toast'); el.textContent = message; if (error) el.style.background = 'var(--red)'; el.classList.add('show'); setTimeout(() => { el.classList.remove('show'); el.style.background = ''; }, 2800); }
  function openModal(html) { modalContent.innerHTML = html; modal.hidden = false; document.body.style.overflow = 'hidden'; }
  function closeModal() { modal.hidden = true; document.body.style.overflow = ''; }
  function head(kicker, title, desc, actions = '') { return `<div class="page-head"><div><span class="eyebrow">${kicker}</span><h1>${title}</h1><p>${desc}</p></div>${actions ? `<div class="head-actions">${actions}</div>` : ''}</div>`; }
  function submissionFor(id) { return submissions.find((item) => item.assignment_id === id); }
  function pendingAssignments() { return assignments.filter((item) => !submissionFor(item.id)); }
  function unreadAssignments() { return notificationState.unread(pendingAssignments(), localStorage, auth?.user?.id); }
  function updateNotificationCount() { const count = unreadAssignments().length; notificationCount.textContent = String(count); notificationCount.hidden = count === 0; notificationButton.setAttribute('aria-label', count ? `알림 보기, 읽지 않은 알림 ${count}개` : '알림 보기, 새 알림 없음'); }

  function dashboard() {
    const completed = submissions.length;
    const graded = submissions.filter((item) => item.status === 'graded');
    const average = graded.length ? Math.round(graded.reduce((sum, item) => sum + Number(reviewFor(item.reviews)?.score ?? 0), 0) / graded.length) : '-';
    const progress = curriculum.length ? Math.round((curriculum.filter((week) => week.status === 'done').length / curriculum.length) * 100) : 0;
    return `${head('MISSION CONTROL', `${esc(auth.profile.display_name)}님, 오늘도 한 단계 더 깊이.`, '웹의 동작을 이해하고, 취약점을 발견하고, 안전하게 고치는 훈련을 시작하세요.', '<button class="secondary-btn" data-go="resources">자료 보기</button><button class="primary-btn" data-go="assignments">과제 확인 →</button>')}
      <div class="stats-grid">
        ${stat('현재 진도', `${curriculum.filter((week) => week.status !== 'locked').length} / ${curriculum.length}`, '전체 커리큘럼', 'LIVE DATA')}
        ${stat('제출 완료', `${completed} / ${assignments.length}`, '나의 과제', 'DATABASE')}
        ${stat('평균 점수', average, '채점 완료 과제', graded.length ? 'REVIEWED' : 'NO SCORE')}
        ${stat('학습 달성률', `${progress}%`, '완료 주차 기준', 'ON TRACK')}
      </div>
      <div class="dashboard-grid">
        <section class="panel"><div class="panel-head"><div><span class="panel-kicker">CURRENT TRACK</span><h2>커리큘럼 진행 상황</h2><p>${curriculum.length}주 과정 · Dreamhack Web Hacking Advanced</p></div><button class="small-btn" data-go="curriculum">전체 보기</button></div><div class="week-list">${curriculum.map(weekRow).join('') || '<div class="empty">등록된 커리큘럼이 없습니다.</div>'}</div></section>
        <section class="panel"><div class="panel-head"><div><span class="panel-kicker">YOUR PROGRESS</span><h2>나의 학습 리포트</h2></div><span class="status now">LIVE</span></div><div class="progress-ring" style="--p:${progress}"><span>${progress}%<small>COMPLETION</small></span></div><div class="metric-lines">${metric('커리큘럼', progress)}${metric('과제 제출률', assignments.length ? Math.round(completed / assignments.length * 100) : 0)}${metric('피드백 확인', completed ? Math.round(graded.length / completed * 100) : 0)}</div></section>
        <section class="panel"><div class="panel-head"><div><span class="panel-kicker">UP NEXT</span><h2>다가오는 과제</h2></div></div><div class="notice-list">${assignments.filter((item) => !submissionFor(item.id)).slice(0, 2).map((item) => `<div class="notice-item hot"><strong>${esc(item.code)} ${esc(item.title)}</strong><p>${esc(item.description)}</p><small>DEADLINE · ${date(item.due_at)}</small></div>`).join('') || '<div class="empty">미제출 과제가 없습니다.</div>'}</div></section>
        <section class="panel"><div class="panel-head"><div><span class="panel-kicker">SECURITY NOTICE</span><h2>실습 안전 원칙</h2></div></div><div class="notice-item hot"><strong>허가된 환경에서만 실습하세요.</strong><p>모든 공격 실습은 동아리가 제공한 격리 랩 또는 명시적으로 허가받은 환경에서만 진행합니다.</p><small>POLICY · ALWAYS ACTIVE</small></div></section>
      </div>`;
  }

  function stat(label, value, sub, badge) { return `<article class="stat-card"><div class="stat-top"><span>${label}</span><b>${badge}</b></div><strong>${value}</strong><small>${sub}</small></article>`; }
  function metric(label, value) { return `<div class="metric-line"><div><span>${label}</span><b>${value}%</b></div><div class="track"><i style="width:${value}%"></i></div></div>`; }
  function weekRow(item) { const label = item.status === 'done' ? 'COMPLETE' : item.status === 'active' ? 'IN PROGRESS' : 'LOCKED'; const cls = item.status === 'active' ? 'active' : item.status === 'done' ? 'done' : ''; const status = item.status === 'active' ? 'now' : item.status === 'done' ? 'done' : 'lock'; return `<div class="week-row ${cls}"><span class="week-num">${String(item.week_number).padStart(2,'0')}</span><div><strong>${esc(item.title)}</strong><small>${(item.tags || []).map(esc).join(' · ')}</small></div><span class="status ${status}">${label}</span></div>`; }

  function curriculumView() {
    return `${head('TRAINING PATH', 'Web Hacking Advanced', 'CSTI부터 XS-Search, DOM, RPO, Web Cache까지 Dreamhack 심화 Path를 8주 동안 학습합니다.', '<a class="secondary-btn" href="https://dreamhack.io/lecture/paths/web-hacking-advanced" target="_blank" rel="noopener noreferrer">Dreamhack Path ↗</a>')}
      <div class="toolbar"><div class="search"><input id="curriculumSearch" placeholder="주제 또는 키워드 검색" /></div><select id="levelFilter"><option value="all">전체 난이도</option><option>BASIC</option><option>CORE</option><option>ADVANCED</option></select></div>
      <div class="curriculum-grid" id="curriculumGrid">${curriculum.map((item) => `<article class="curriculum-card" data-week="${String(item.week_number).padStart(2,'0')}" data-level="${item.level}" data-search="${esc(`${item.title} ${item.description} ${(item.tags || []).join(' ')}`.toLowerCase())}"><div class="card-meta"><span class="week-badge">WEEK ${String(item.week_number).padStart(2,'0')}</span><span class="difficulty">${item.level}</span></div><h3>${esc(item.title)}</h3><p>${esc(item.description)}</p><div class="tags">${(item.tags || []).map((tag) => `<span class="tag">${esc(tag)}</span>`).join('')}</div><div class="card-foot"><span>예상 학습 ${item.duration_minutes}분</span><button data-week-id="${item.id}" ${item.status === 'locked' ? 'disabled' : ''}>${item.status === 'done' ? '학습 완료 ✓' : item.status === 'active' ? '수업 열기 →' : '선행 학습 필요'}</button></div></article>`).join('')}</div>`;
  }

  function assignmentsView() {
    return `${head('MISSION QUEUE', '과제 및 제출', '마감 일정과 피드백을 확인하고 결과물을 private 저장소에 제출하세요.')}
      <div class="toolbar"><div class="search"><input id="assignmentSearch" placeholder="과제명 검색" /></div><select id="assignmentFilter"><option value="all">전체 상태</option><option value="open">제출 가능</option><option value="submitted">검사 중</option><option value="graded">채점 완료</option></select></div>
      <div class="assignment-list" id="assignmentList">${assignments.map(assignmentRow).join('') || '<div class="empty">공개된 과제가 없습니다.</div>'}</div>`;
  }
  function assignmentRow(item) { const submission = submissionFor(item.id); const status = submission?.status || 'open'; const review = reviewFor(submission?.reviews); const action = status === 'open' ? `<button class="small-btn" data-submit-id="${item.id}">제출하기</button>` : canCancelSubmission(status) ? `<button class="secondary-btn" data-cancel-submission-id="${submission.id}">제출 취소</button>` : status === 'graded' ? `<button class="small-btn" data-feedback-id="${submission.id}">피드백</button>` : '<button class="small-btn" disabled>피드백 대기</button>'; return `<article class="assignment-row" data-status="${status}" data-search="${esc(`${item.code} ${item.title}`.toLowerCase())}"><span class="assignment-id">${esc(item.code)}</span><div class="assignment-info"><strong>${esc(item.title)}</strong><small>${esc(item.description)}</small></div><div class="assignment-cell"><span>DEADLINE</span><strong>${date(item.due_at)}</strong></div><div class="assignment-cell"><span>FILE</span><strong>${esc(submission?.original_file_name || '-')}</strong></div><div class="assignment-cell"><span>STATUS</span>${status === 'graded' ? `<strong class="score">${review?.score ?? '-'}점</strong>` : `<em class="status ${status === 'submitted' ? 'wait' : 'now'}">${status === 'submitted' ? '검사 중' : '제출 가능'}</em>`}</div><div class="assignment-actions">${action}</div></article>`; }

  function resourcesView() {
    return `${head('KNOWLEDGE BASE', '자료실', '관리자가 공유한 강의 자료와 실습 파일을 안전하게 내려받으세요.')}
      <div class="toolbar"><div class="search"><input id="resourceSearch" placeholder="자료명 또는 설명 검색" /></div><select id="resourceFilter"><option value="all">전체 자료</option><option>강의자료</option><option>실습파일</option><option>가이드</option></select></div>
      <div class="resource-grid" id="resourceGrid">${resources.map((item) => `<article class="resource-card" data-category="${esc(item.category)}" data-search="${esc(`${item.title} ${item.description}`.toLowerCase())}"><div class="resource-icon">${esc((item.original_file_name?.split('.').pop() || 'LINK').toUpperCase())}</div><h3>${esc(item.title)}</h3><p>${esc(item.description)}</p><div class="resource-foot"><span>${esc(item.category)} · ${item.size_bytes ? Math.ceil(item.size_bytes/1024) + ' KB' : '외부 링크'} · ${date(item.created_at)}</span><button data-resource-id="${item.id}" aria-label="자료 열기">↓</button></div></article>`).join('') || '<div class="empty">등록된 자료가 없습니다.</div>'}</div>`;
  }

  const views = { dashboard, curriculum: curriculumView, assignments: assignmentsView, resources: resourcesView };
  function render() { const requested = location.hash.slice(1) || 'dashboard'; const route = views[requested] ? requested : 'dashboard'; app.innerHTML = views[route](); document.querySelector('#pageCrumb').textContent = pageNames[route]; document.querySelectorAll('[data-route]').forEach((item) => item.classList.toggle('active', item.dataset.route === route)); sidebar.classList.remove('open'); bind(route); updateNotificationCount(); }
  function bind(route) {
    app.querySelectorAll('[data-go]').forEach((el) => el.addEventListener('click', () => location.hash = el.dataset.go));
    app.querySelectorAll('[data-week-id]').forEach((el) => el.addEventListener('click', () => showWeek(el.dataset.weekId)));
    app.querySelectorAll('[data-submit-id]').forEach((el) => el.addEventListener('click', () => submissionModal(el.dataset.submitId)));
    app.querySelectorAll('[data-cancel-submission-id]').forEach((el) => el.addEventListener('click', () => cancelSubmission(el.dataset.cancelSubmissionId)));
    app.querySelectorAll('[data-feedback-id]').forEach((el) => el.addEventListener('click', () => feedbackModal(el.dataset.feedbackId)));
    app.querySelectorAll('[data-resource-id]').forEach((el) => el.addEventListener('click', () => openResource(el.dataset.resourceId)));
    if (route === 'curriculum') filter('curriculumSearch', 'levelFilter', '#curriculumGrid article', 'level');
    if (route === 'assignments') filter('assignmentSearch', 'assignmentFilter', '#assignmentList article', 'status');
    if (route === 'resources') filter('resourceSearch', 'resourceFilter', '#resourceGrid article', 'category');
  }
  function filter(searchId, selectId, selector, key) { const search = document.querySelector(`#${searchId}`), select = document.querySelector(`#${selectId}`); const run = () => document.querySelectorAll(selector).forEach((item) => { item.style.display = item.dataset.search.includes(search.value.toLowerCase()) && (select.value === 'all' || item.dataset[key] === select.value) ? '' : 'none'; }); search.addEventListener('input', run); select.addEventListener('change', run); }

  function showWeek(id) { const item = curriculum.find((entry) => entry.id === id); openModal(`<span class="eyebrow">WEEK ${String(item.week_number).padStart(2,'0')} / ${item.level}</span><h2 id="modalTitle">${esc(item.title)}</h2><p class="modal-desc">${esc(item.description)}</p><div class="notice-item hot"><strong>이번 주 학습 목표</strong><p>${(item.tags || []).map(esc).join(', ')}의 원리를 이해하고 허가된 실습 환경에서 재현합니다.</p><small>ESTIMATED · ${item.duration_minutes}분</small></div><div class="modal-actions"><button class="primary-btn" data-close>확인</button></div>`); document.querySelector('[data-close]').addEventListener('click', closeModal); }
  function submissionModal(id) { const item = assignments.find((entry) => entry.id === id); openModal(`<span class="eyebrow">SECURE SUBMISSION</span><h2 id="modalTitle">${esc(item.title)}</h2><p class="modal-desc">${esc(item.description)}<br>마감 ${date(item.due_at)}</p><form id="submissionForm"><div class="field"><label>제출 파일</label><div class="file-drop"><input name="file" type="file" required accept=".pdf,.md,.txt,.zip" /><p class="modal-desc">PDF, MD, TXT, ZIP · 최대 20MB</p></div></div><div class="field"><label>메모</label><textarea name="memo" placeholder="검사할 때 참고할 내용을 적어주세요."></textarea></div><div class="modal-actions"><button type="button" class="secondary-btn" data-close>취소</button><button class="primary-btn">제출 완료</button></div></form>`); document.querySelector('[data-close]').addEventListener('click', closeModal); document.querySelector('#submissionForm').addEventListener('submit', async (event) => { event.preventDefault(); const fd = new FormData(event.target); const button = event.target.querySelector('.primary-btn'); button.disabled = true; button.textContent = '업로드 중...'; try { await backend.submitAssignment({ assignmentId: id, userId: auth.user.id, file: fd.get('file'), memo: fd.get('memo').trim() }); submissions = await backend.listMySubmissions(auth.user.id); closeModal(); render(); toast('과제가 안전하게 제출되었습니다.'); } catch (error) { toast(error.message, true); button.disabled = false; button.textContent = '제출 완료'; } }); }
  async function cancelSubmission(id) { const submission = submissions.find((item) => item.id === id); if (!submission || !canCancelSubmission(submission.status)) return; if (!confirm('관리자가 피드백을 저장하기 전까지 제출을 취소할 수 있습니다. 제출 파일과 기록을 취소할까요?')) return; try { const result = await backend.cancelSubmission({ submissionId: submission.id, userId: auth.user.id, filePath: submission.file_path }); submissions = await backend.listMySubmissions(auth.user.id); render(); toast(result.fileRemoved ? '제출을 취소했습니다.' : '제출은 취소됐습니다. 파일 정리는 관리자에게 알려주세요.'); } catch (error) { toast(error.message, true); } }
  function feedbackModal(id) { const submission = submissions.find((item) => item.id === id); const review = reviewFor(submission.reviews); openModal(`<span class="eyebrow">INSTRUCTOR FEEDBACK</span><h2 id="modalTitle">${review?.score ?? '-'}점</h2><p class="modal-desc">${esc(review?.feedback || '등록된 피드백이 없습니다.')}</p><div class="modal-actions"><button class="primary-btn" data-close>확인</button></div>`); document.querySelector('[data-close]').addEventListener('click', closeModal); }
  function notificationMarkup() {
    const pending = pendingAssignments();
    const unreadIds = new Set(unreadAssignments().map((item) => String(item.id)));
    const items = pending.map((item) => {
      const isUnread = unreadIds.has(String(item.id));
      return `<div class="notice-item ${isUnread ? 'hot' : ''}"><strong>${esc(item.code)} ${esc(item.title)}</strong><p>아직 제출하지 않은 과제입니다.</p><div class="notification-item-foot"><small>DEADLINE · ${date(item.due_at)}</small>${isUnread ? `<button class="small-btn" type="button" data-read-notification="${esc(item.id)}">읽음</button>` : '<span class="notification-read">읽음 완료</span>'}</div></div>`;
    }).join('') || '<div class="notice-item"><strong>과제 알림이 없습니다.</strong><p>현재 공개된 미제출 과제가 없습니다.</p><small>STATUS · ALL CLEAR</small></div>';
    return `<span class="eyebrow">NOTIFICATION CENTER</span><div class="notification-toolbar"><h2 id="modalTitle">알림</h2><button class="small-btn" type="button" data-read-all ${unreadIds.size ? '' : 'disabled'}>모두 읽음</button></div><p class="modal-desc">공개된 과제와 중요한 운영 안내를 확인하세요.</p><div class="notice-list">${items}<div class="notice-item"><strong>허가된 환경에서만 실습하세요.</strong><p>Dreamhack Lab 또는 동아리가 명시적으로 허가한 격리 환경만 사용합니다.</p><small>SECURITY POLICY · ALWAYS ACTIVE</small></div></div><div class="modal-actions"><button class="primary-btn" data-close>확인</button></div>`;
  }
  function bindNotificationActions() {
    modalContent.querySelectorAll('[data-read-notification]').forEach((button) => button.addEventListener('click', () => {
      const item = pendingAssignments().find((entry) => String(entry.id) === button.dataset.readNotification);
      if (item) notificationState.markRead([item], localStorage, auth?.user?.id);
      updateNotificationCount();
      modalContent.innerHTML = notificationMarkup();
      bindNotificationActions();
    }));
    modalContent.querySelector('[data-read-all]')?.addEventListener('click', () => {
      notificationState.markRead(pendingAssignments(), localStorage, auth?.user?.id);
      updateNotificationCount();
      modalContent.innerHTML = notificationMarkup();
      bindNotificationActions();
    });
    modalContent.querySelector('[data-close]').addEventListener('click', closeModal);
  }
  function notificationModal() { openModal(notificationMarkup()); bindNotificationActions(); }
  async function openResource(id) { const item = resources.find((entry) => entry.id === id); try { if (item.external_url) return window.open(item.external_url, '_blank', 'noopener'); const url = await backend.createSignedUrl('resources', item.file_path); window.open(url, '_blank', 'noopener'); } catch (error) { toast(error.message, true); } }

  window.addEventListener('hashchange', render);
  document.querySelector('#menuButton').addEventListener('click', () => sidebar.classList.toggle('open'));
  document.querySelector('#signOutButton').addEventListener('click', () => backend.signOut());
  notificationButton.addEventListener('click', notificationModal);
  document.querySelector('#modalClose').addEventListener('click', closeModal);
  modal.addEventListener('click', (event) => event.target === modal && closeModal());
  document.addEventListener('keydown', (event) => event.key === 'Escape' && closeModal());

  try {
    if (!backend.configured) { location.replace('login.html'); return; }
    auth = await backend.requireAuth();
    if (!auth) return;
    document.querySelector('#profileName').textContent = auth.profile.display_name;
    document.querySelector('#profileAvatar').textContent = auth.profile.display_name[0];
    document.querySelector('#profileRole').textContent = auth.profile.role === 'admin' ? 'CURRICULUM LEAD' : 'CLUB MEMBER';
    document.querySelector('#connectionState').textContent = 'DB · Auth · Storage 연결됨';
    if (auth.profile.role === 'admin') { document.querySelector('#adminNavigation').hidden = false; document.querySelector('#adminShortcut').hidden = false; }
    [curriculum, assignments, resources, submissions] = await Promise.all([backend.listCurriculum(), backend.listAssignments(), backend.listResources(), backend.listMySubmissions(auth.user.id)]);
    render();
  } catch (error) {
    app.innerHTML = `<div class="empty"><strong>학습 공간을 불러오지 못했습니다.</strong><p>${esc(error.message)}</p><button class="small-btn" onclick="location.reload()">다시 시도</button></div>`;
  }
})();
