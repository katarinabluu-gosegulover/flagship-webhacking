(function exposeReviewModel(root) {
  function first(reviews) {
    if (Array.isArray(reviews)) return reviews[0] || null;
    return reviews || null;
  }

  root.flagshipReviews = { first };
})(globalThis);
