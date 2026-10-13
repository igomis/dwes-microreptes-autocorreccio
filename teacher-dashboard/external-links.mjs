const groupGradeLinkVariables = {
  '2DAW-A': 'DASHBOARD_GRADES_2DAW_A_URL',
  '2DAW-B': 'DASHBOARD_GRADES_2DAW_B_URL',
  '2DAW-C': 'DASHBOARD_GRADES_2DAW_C_URL',
  '2DAW-D': 'DASHBOARD_GRADES_2DAW_D_URL'
};

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

export function dashboardGroupGradeLinks(env = process.env) {
  return Object.fromEntries(
    Object.entries(groupGradeLinkVariables)
      .map(([group, variable]) => [group, httpUrl(env[variable])])
      .filter(([, url]) => Boolean(url))
  );
}
