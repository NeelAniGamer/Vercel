// scripts/verify_careers.js
const data = require('../careers-data.js');
const careers = data.CAREERS_ALL || global.CAREERS_ALL;
console.log('Total pathways in CAREERS_ALL:', careers.length);

let totalAliases = 0;
const uniqueTitles = new Set();
careers.forEach(c => {
  uniqueTitles.add(c.title.toLowerCase());
  (c.aka || []).forEach(a => {
    uniqueTitles.add(a.toLowerCase());
    totalAliases++;
  });
});

console.log('Total unique searchable titles:', uniqueTitles.size.toLocaleString());

// Check integrity of every single career across all fields
let invalidCount = 0;
careers.forEach((c, idx) => {
  if (!c.id || !c.title || !c.cat || !c.catName || !c.stream || !c.salary || !c.growth || !c.desc || !c.overview) {
    console.error('Missing core field in career index ' + idx, c.title);
    invalidCount++;
  }
  if (!c.education || !c.education.highSchoolPrereqs || !c.education.entranceExams || !c.education.undergradDegrees || !c.education.postgradDegrees || !c.education.certifications || !c.education.topInstitutes) {
    console.error('Missing education in career index ' + idx, c.title);
    invalidCount++;
  }
  if (!c.roadmap || !c.roadmap.phase1 || !c.roadmap.phase2 || !c.roadmap.phase3) {
    console.error('Missing roadmap in career index ' + idx, c.title);
    invalidCount++;
  }
  if (!c.skills || !c.skills.hardSkills || !c.skills.softSkills || c.skills.hardSkills.length === 0) {
    console.error('Missing skills in career index ' + idx, c.title);
    invalidCount++;
  }
  if (!c.decisionFit || !c.decisionFit.traits || !c.decisionFit.workStyle || !c.decisionFit.pros || !c.decisionFit.cons) {
    console.error('Missing decisionFit in career index ' + idx, c.title);
    invalidCount++;
  }
  if (!c.reflectionQuestions || c.reflectionQuestions.length === 0) {
    console.error('Missing reflectionQuestions in career index ' + idx, c.title);
    invalidCount++;
  }
  if (!c.resources || c.resources.length === 0) {
    console.error('Missing resources in career index ' + idx, c.title);
    invalidCount++;
  }
});

console.log('Total invalid or incomplete careers:', invalidCount);

// Test diverse search queries
const testQueries = ['pilot', 'ecmo', 'actuary', 'welder', 'software', 'nurse', 'dermatology', 'astronomy', 'firefighter', 'forensic', 'surgeon', 'quantum', 'chef', 'lawyer', 'chiropractor'];
testQueries.forEach(q => {
  const matches = careers.filter(c => c.title.toLowerCase().includes(q) || (c.aka && c.aka.some(a => a.toLowerCase().includes(q))));
  console.log(`Query: "${q}" -> ${matches.length} matches (Top: ${matches[0] ? matches[0].title : 'none'})`);
});
