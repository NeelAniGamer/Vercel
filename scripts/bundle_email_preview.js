const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '..', 'supabase', 'email-templates');

const templateKeys = [
  { key: 'confirm-signup', title: 'Confirm sign up', desc: 'Ask users to confirm their email address after signing up', subject: 'Confirm your email address — Class Of Learners', file: 'confirm-signup.html' },
  { key: 'invite-user', title: 'Invite user', desc: 'Invite someone to create an account', subject: "You've been invited to join Class Of Learners", file: 'invite-user.html' },
  { key: 'magic-link', title: 'Magic link or OTP', desc: 'Send a one-time sign-in link or one-time password', subject: 'Your sign-in link and verification code', file: 'magic-link.html' },
  { key: 'change-email', title: 'Change email address', desc: 'Ask users to verify their new email address after changing it', subject: 'Confirm your new email address', file: 'change-email.html' },
  { key: 'reset-password', title: 'Reset password', desc: 'Send a password reset link or code', subject: 'Reset your password — Class Of Learners', file: 'reset-password.html' },
  { key: 'reauthentication', title: 'Reauthentication', desc: 'Ask users to verify their identity before a sensitive operation', subject: 'Confirm your identity — Verification Code', file: 'reauthentication.html' }
];

const templates = {};
for (const item of templateKeys) {
  const filePath = path.join(dir, item.file);
  const content = fs.readFileSync(filePath, 'utf8');
  templates[item.key] = {
    title: item.title,
    desc: item.desc,
    subject: item.subject,
    file: item.file,
    html: content
  };
}

let previewHtml = fs.readFileSync(path.join(dir, 'preview.html'), 'utf8');

// Replace the TEMPLATES declaration
const scriptMarker = 'const TEMPLATES = {';
const scriptEndMarker = 'let currentKey = \'confirm-signup\';';

const startIndex = previewHtml.indexOf(scriptMarker);
const endIndex = previewHtml.indexOf(scriptEndMarker);

if (startIndex !== -1 && endIndex !== -1) {
  const newSnippet = 'const TEMPLATES = ' + JSON.stringify(templates, null, 2) + ';\n\n    ';
  previewHtml = previewHtml.substring(0, startIndex) + newSnippet + previewHtml.substring(endIndex);

  // Update openTemplate to set srcdoc and immediate code
  previewHtml = previewHtml.replace(
    "document.getElementById('previewFrame').src = data.file;",
    "document.getElementById('previewFrame').srcdoc = data.html;"
  );

  previewHtml = previewHtml.replace(
    /\/\/ Fetch code for copy & view[\s\S]*?document\.getElementById\('codeView'\)\.textContent = 'Unable to load file: ' \+ err\.message;\s*\}/,
    "currentRawHtml = data.html;\n      document.getElementById('codeView').textContent = currentRawHtml;"
  );

  fs.writeFileSync(path.join(dir, 'preview.html'), previewHtml, 'utf8');
  console.log('Successfully bundled templates into preview.html!');
} else {
  console.error('Markers not found:', { startIndex, endIndex });
}
