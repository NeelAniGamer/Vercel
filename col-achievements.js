// Achievement Engine Global Helpers
;(async function () {
  if (window._colAchievementsRunning) return
  window._colAchievementsRunning = true

  /**
   * Verifies a public achievement certificate using its slug and verification token.
   * @param {string} slug - The unique identifier of the achievement definition.
   * @param {string} token - The UUID verification token.
   * @returns {Promise<{data: any, error: any}>}
   */
  async function verifyCertificate(slug, token) {
    if (!window.supabaseClient) {
      return { data: null, error: { message: 'Supabase client not initialized' } };
    }

    const { data, error } = await window.supabaseClient
      .rpc('verify_certificate_token', {
        token: token,
        slug: slug
      });

    return { data: data?.[0], error: error || (!data ? { message: 'Certificate not found' } : null) };
  }

  /**
   * Fetches the current user's achievement progress and definitions.
   * @returns {Promise<{data: any, error: any}>}
   */
  async function getUserProgress() {
    if (!window.supabaseClient) {
      return { data: null, error: { message: 'Supabase client not initialized' } };
    }

    const { data, error } = await window.supabaseClient
      .from('user_achievements')
      .select('*, achievement_definitions(*)');

    return { data, error };
  }

  /**
   * Fetches the top 10 users globally.
   * @returns {Promise<{data: any, error: any}>}
   */
  async function getGlobalLeaderboard() {
    if (!window.supabaseClient) {
      return { data: null, error: { message: 'Supabase client not initialized' } };
    }

    const { data, error } = await window.supabaseClient
      .from('global_leaderboard')
      .select('*')
      .limit(10);

    return { data, error };
  }

  /**
   * Fetches the top users for a specific achievement category.
   * @param {string} category - The category to filter by.
   * @returns {Promise<{data: any, error: any}>}
   */
  async function getCategoryLeaderboard(category) {
    if (!window.supabaseClient) {
      return { data: null, error: { message: 'Supabase client not initialized' } };
    }

    const { data, error } = await window.supabaseClient
      .rpc('get_category_leaderboard', {
        category_name: category
      });

    return { data, error };
  }

  // Expose globally
  window.verifyCertificate = verifyCertificate;
  window.getUserProgress = getUserProgress;
  window.getGlobalLeaderboard = getGlobalLeaderboard;
  window.getCategoryLeaderboard = getCategoryLeaderboard;

})();
