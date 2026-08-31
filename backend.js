(function createFlagshipBackend() {
  const config = window.FLAGSHIP_CONFIG || {};
  const configured =
    /^https:\/\/.+\.supabase\.co$/.test(config.supabaseUrl || '') &&
    config.supabaseAnonKey &&
    !config.supabaseAnonKey.startsWith('YOUR_');

  const client = configured && window.supabase
    ? window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
      })
    : null;

  function requireClient() {
    if (!client) throw new Error('Supabase 연결 정보가 설정되지 않았습니다. config.js를 확인하세요.');
    return client;
  }

  async function getSession() {
    if (!client) return null;
    const { data, error } = await client.auth.getSession();
    if (error) throw error;
    return data.session;
  }

  async function getProfile(userId) {
    if (!client || !userId) return null;
    const { data, error } = await client
      .from('profiles')
      .select('id, display_name, role, created_at')
      .eq('id', userId)
      .single();
    if (error) throw error;
    return data;
  }

  async function requireAuth(options = {}) {
    const session = await getSession();
    if (!session) {
      const next = encodeURIComponent(location.pathname.split('/').pop() || 'index.html');
      location.replace(`login.html?next=${next}`);
      return null;
    }
    const profile = await getProfile(session.user.id);
    if (options.admin && profile?.role !== 'admin') {
      location.replace('index.html');
      return null;
    }
    return { session, user: session.user, profile };
  }

  async function signIn(email, password) {
    const { data, error } = await requireClient().auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  }

  async function signUp(email, password, displayName) {
    const emailRedirectTo = location.origin.startsWith('http')
      ? new URL('login.html', location.href).href
      : undefined;
    const { data, error } = await requireClient().auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName },
        ...(emailRedirectTo ? { emailRedirectTo } : {}),
      },
    });
    if (error) throw error;
    return data;
  }

  async function signOut() {
    if (!client) return;
    const { error } = await client.auth.signOut();
    if (error) throw error;
    location.replace('login.html');
  }

  async function listCurriculum() {
    const { data, error } = await requireClient()
      .from('curriculum_weeks')
      .select('*')
      .order('week_number');
    if (error) throw error;
    return data || [];
  }

  async function listAssignments() {
    const { data, error } = await requireClient()
      .from('assignments')
      .select('*')
      .order('due_at');
    if (error) throw error;
    return data || [];
  }

  async function listResources() {
    const { data, error } = await requireClient()
      .from('resources')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  async function listMySubmissions(userId) {
    const { data, error } = await requireClient()
      .from('submissions')
      .select('*, reviews(score, feedback, reviewed_at)')
      .eq('student_id', userId)
      .order('submitted_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  function safeFileName(name) {
    const dot = name.lastIndexOf('.');
    const ext = dot >= 0 ? name.slice(dot).toLowerCase() : '';
    const stem = (dot >= 0 ? name.slice(0, dot) : name)
      .normalize('NFKD')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 70) || 'file';
    return `${stem}${ext}`;
  }

  async function submitAssignment({ assignmentId, userId, file, memo }) {
    if (!file || file.size > 20 * 1024 * 1024) throw new Error('파일은 20MB 이하여야 합니다.');
    const path = `${userId}/${assignmentId}/${Date.now()}_${safeFileName(file.name)}`;
    const { error: uploadError } = await requireClient().storage
      .from('submissions')
      .upload(path, file, { upsert: false, contentType: file.type || 'application/octet-stream' });
    if (uploadError) throw uploadError;

    const { data, error } = await client
      .from('submissions')
      .insert({
        assignment_id: assignmentId,
        student_id: userId,
        file_path: path,
        original_file_name: file.name,
        memo: memo || null,
        status: 'submitted',
      })
      .select()
      .single();

    if (error) {
      await client.storage.from('submissions').remove([path]);
      throw error;
    }
    return data;
  }

  async function cancelSubmission({ submissionId, userId, filePath }) {
    const { data, error } = await requireClient()
      .from('submissions')
      .delete()
      .eq('id', submissionId)
      .eq('student_id', userId)
      .eq('status', 'submitted')
      .select('id')
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new Error('이미 채점이 시작되었거나 취소할 수 없는 제출물입니다.');

    const { error: storageError } = filePath
      ? await requireClient().storage.from('submissions').remove([filePath])
      : { error: null };
    return { canceled: true, fileRemoved: !storageError };
  }

  async function deleteSubmission(submission) {
    if (!submission?.id) throw new Error('삭제할 제출물을 찾을 수 없습니다.');

    const { data, error } = await requireClient()
      .from('submissions')
      .delete()
      .eq('id', submission.id)
      .select('id')
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new Error('제출물이 이미 삭제되었거나 삭제 권한이 없습니다.');

    const { error: storageError } = submission.file_path
      ? await requireClient().storage.from('submissions').remove([submission.file_path])
      : { error: null };
    return { deleted: true, fileRemoved: !storageError };
  }

  async function createSignedUrl(bucket, path, expiresIn = 300) {
    const { data, error } = await requireClient().storage.from(bucket).createSignedUrl(path, expiresIn);
    if (error) throw error;
    return data.signedUrl;
  }

  async function adminDashboardData() {
    const [profiles, curriculum, assignments, submissions, resources] = await Promise.all([
      client.from('profiles').select('id, display_name, role, created_at').order('created_at'),
      client.from('curriculum_weeks').select('*').order('week_number'),
      client.from('assignments').select('*').order('due_at'),
      client.from('submissions').select('*, profiles!submissions_student_id_fkey(display_name), assignments(title), reviews(*)').order('submitted_at', { ascending: false }),
      client.from('resources').select('*').order('created_at', { ascending: false }),
    ]);
    const failed = [profiles, curriculum, assignments, submissions, resources].find((result) => result.error);
    if (failed) throw failed.error;
    return {
      profiles: profiles.data || [],
      curriculum: curriculum.data || [],
      assignments: assignments.data || [],
      submissions: submissions.data || [],
      resources: resources.data || [],
    };
  }

  async function saveCurriculum(values, id) {
    const query = id
      ? requireClient().from('curriculum_weeks').update(values).eq('id', id)
      : requireClient().from('curriculum_weeks').insert(values);
    const { data, error } = await query.select().single();
    if (error) throw error;
    return data;
  }

  async function deleteCurriculum(id) {
    const { error } = await requireClient().from('curriculum_weeks').delete().eq('id', id);
    if (error) throw error;
  }

  async function saveReview({ submissionId, reviewerId, score, feedback }) {
    const { data, error } = await requireClient()
      .from('reviews')
      .upsert(
        { submission_id: submissionId, reviewer_id: reviewerId, score, feedback },
        { onConflict: 'submission_id' },
      )
      .select()
      .single();
    if (error) throw error;
    const { error: statusError } = await client
      .from('submissions')
      .update({ status: 'graded' })
      .eq('id', submissionId);
    if (statusError) throw statusError;
    return data;
  }

  async function saveAssignment(values, id) {
    const query = id
      ? requireClient().from('assignments').update(values).eq('id', id)
      : requireClient().from('assignments').insert(values);
    const { data, error } = await query.select().single();
    if (error) throw error;
    return data;
  }

  async function deleteAssignment(id) {
    const { error } = await requireClient().from('assignments').delete().eq('id', id);
    if (error) throw error;
  }

  async function uploadResource({ title, description, category, file, adminId }) {
    if (!file || file.size > 50 * 1024 * 1024) throw new Error('자료 파일은 50MB 이하여야 합니다.');
    const path = `${adminId}/${Date.now()}_${safeFileName(file.name)}`;
    const { error: uploadError } = await requireClient().storage
      .from('resources')
      .upload(path, file, { upsert: false, contentType: file.type || 'application/octet-stream' });
    if (uploadError) throw uploadError;
    const { data, error } = await client
      .from('resources')
      .insert({ title, description, category, file_path: path, original_file_name: file.name, size_bytes: file.size, uploaded_by: adminId })
      .select()
      .single();
    if (error) {
      await client.storage.from('resources').remove([path]);
      throw error;
    }
    return data;
  }

  async function deleteResource(resource) {
    if (resource.file_path) {
      const { error: storageError } = await requireClient().storage.from('resources').remove([resource.file_path]);
      if (storageError) throw storageError;
    }
    const { error } = await client.from('resources').delete().eq('id', resource.id);
    if (error) throw error;
  }

  async function updateUserRole(userId, role) {
    const { error } = await requireClient().from('profiles').update({ role }).eq('id', userId);
    if (error) throw error;
  }

  window.flagshipBackend = {
    configured,
    client,
    getSession,
    getProfile,
    requireAuth,
    signIn,
    signUp,
    signOut,
    listCurriculum,
    listAssignments,
    listResources,
    listMySubmissions,
    submitAssignment,
    cancelSubmission,
    deleteSubmission,
    createSignedUrl,
    adminDashboardData,
    saveCurriculum,
    deleteCurriculum,
    saveReview,
    saveAssignment,
    deleteAssignment,
    uploadResource,
    deleteResource,
    updateUserRole,
  };
})();
