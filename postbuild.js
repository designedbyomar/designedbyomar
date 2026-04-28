const fs = require('fs');

const CASE_STUDIES = [
  { id: 'mgmt-portal', title: 'Management Portal', subtitle: 'Ops command center replacing 200+ spreadsheets with real-time intelligence.', client: 'Wisdom' },
  { id: 'posting-asst', title: 'Posting Assistant', subtitle: 'AI-assisted insurance payment posting workflow that kept specialists in control.', client: 'Wisdom' },
  { id: 'page-builder', title: 'Page Builder 2.0', subtitle: 'CRM page builder rebuilt from scratch in 2 months to stop churn from competitors.', client: 'Simplero' },
  { id: 'connect-api', title: 'Connect API Payments', subtitle: 'PCI Level 1 embedded payments widget shipped with $20M+ monthly volume in month one.', client: 'Plastiq' },
  { id: 'athena-ds', title: 'Athena Design System 2.0', subtitle: "Enterprise design system that became the foundation for Plastiq's IPO-era brand.", client: 'Plastiq' },
  { id: 'plastiq-mktg', title: 'Plastiq Marketing Site', subtitle: 'Pre-IPO brand relaunch delivered WCAG-compliant in 3–4 weeks.', client: 'Plastiq' },
  { id: 'disney-cct', title: 'Critical Communication Tool', subtitle: 'Enterprise subscription manager used to coordinate 250 critical incidents.', client: 'The Walt Disney Company' },
  { id: 'disney-uap', title: 'Unified Ad Platform', subtitle: 'Four brand ad-sales platforms consolidated into one cross-brand system.', client: 'Disney (DTC&I)' }
];

function generateRoutes() {
  const distDir = './dist';
  if (!fs.existsSync(distDir)) return;
  
  const indexHtml = fs.readFileSync(`${distDir}/index.html`, 'utf8');
  
  CASE_STUDIES.forEach(c => {
    const dir = `${distDir}/work/${c.id}`;
    fs.mkdirSync(dir, { recursive: true });
    
    let html = indexHtml;
    const newTitle = `${c.title} — Omar Tavarez`;
    const newDesc = c.subtitle;
    
    // Replace meta tags
    html = html.replace(/<title>.*?<\/title>/, `<title>${newTitle}</title>`);
    html = html.replace(/<meta name="description" content=".*?">/, `<meta name="description" content="${newDesc}">`);
    html = html.replace(/<meta property="og:title" content=".*?">/, `<meta property="og:title" content="${newTitle}">`);
    html = html.replace(/<meta property="og:description" content=".*?">/, `<meta property="og:description" content="${newDesc}">`);
    html = html.replace(/<meta property="og:url" content=".*?"/, `<meta property="og:url" content="https://designedbyomar.com/work/${c.id}/"`);
    html = html.replace(/<meta name="twitter:title" content=".*?">/, `<meta name="twitter:title" content="${newTitle}">`);
    html = html.replace(/<meta name="twitter:description" content=".*?">/, `<meta name="twitter:description" content="${newDesc}">`);
    html = html.replace(/<link rel="canonical" href=".*?"/, `<link rel="canonical" href="https://designedbyomar.com/work/${c.id}/"`);

    // Basic ld+json update
    html = html.replace(/"name": "designedbyomar",\s*"url": "https:\/\/designedbyomar\.com\/"/, `"name": "${newTitle}",\n      "url": "https://designedbyomar.com/work/${c.id}/"`);
    html = html.replace(/"description": "Portfolio site for Omar Tavarez.*?\"/, `"description": "${newDesc}"`);
    
    fs.writeFileSync(`${dir}/index.html`, html);
  });
  
  // Privacy Policy Static Route
  const privacyDir = `${distDir}/privacy`;
  fs.mkdirSync(privacyDir, { recursive: true });
  let privacyHtml = indexHtml;
  const privTitle = 'Privacy Policy — Omar Tavarez';
  const privDesc = 'Privacy policy and data collection details for designedbyomar.com';
  privacyHtml = privacyHtml.replace(/<title>.*?<\/title>/, `<title>${privTitle}</title>`);
  privacyHtml = privacyHtml.replace(/<meta name="description" content=".*?">/, `<meta name="description" content="${privDesc}">`);
  privacyHtml = privacyHtml.replace(/<link rel="canonical" href=".*?"/, `<link rel="canonical" href="https://designedbyomar.com/privacy"`);
  fs.writeFileSync(`${privacyDir}/index.html`, privacyHtml);

  console.log('✅ Generated static routes with unique SEO metadata.');
}

generateRoutes();
