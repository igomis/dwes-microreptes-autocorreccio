function httpUrl(value) {
  const candidate = String(value || '').trim();
  if (!candidate) {
    return '';
  }

  try {
    const url = new URL(candidate);
    return ['http:', 'https:'].includes(url.protocol) ? url.toString() : '';
  } catch {
    return '';
  }
}

export function dashboardGroupGradeLinks(groups, env = process.env) {
  return Object.fromEntries(
    Object.entries(groups || {})
      .map(([group, settings]) => [group, httpUrl(env[settings.grades_url_env])])
      .filter(([, url]) => Boolean(url))
  );
}
