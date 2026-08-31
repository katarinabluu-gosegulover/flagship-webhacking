(function exposeSubmissionModel(root) {
  function canCancel(status) {
    return status === 'submitted';
  }

  root.flagshipSubmissions = { canCancel };
})(globalThis);
