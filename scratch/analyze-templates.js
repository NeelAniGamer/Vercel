// How much of the OOH-derived copy is a repeated template?
global.window = {};
require('../careers-data.js');
const w = global.window;
const ooh = w.CAREERS_ALL.filter(c => c.id.startsWith('ooh-'));

function stat(label, values) {
  const uniq = new Set(values);
  console.log(label.padEnd(28), 'uniq=' + String(uniq.size).padStart(4) + '/' + values.length);
  if (uniq.size <= 20) {
    [...uniq].slice(0, 6).forEach(v => console.log('    ·', String(v).slice(0, 150).replace(/\n/g, ' ')));
  }
}

stat('tagline', ooh.map(c => c.tagline));
stat('desc', ooh.map(c => c.desc));
stat('overview', ooh.map(c => c.overview));
stat('aiImpact', ooh.map(c => c.aiImpact));
stat('growth', ooh.map(c => c.growth));
stat('salary', ooh.map(c => c.salary));
stat('demand', ooh.map(c => c.demand));
stat('hs prereqs', ooh.map(c => c.education.highSchoolPrereqs));
stat('entrance exams', ooh.map(c => c.education.entranceExams));
stat('roadmap p1', ooh.map(c => c.roadmap.phase1));
stat('roadmap p2', ooh.map(c => c.roadmap.phase2));
stat('roadmap p3', ooh.map(c => c.roadmap.phase3));
stat('reflection q1', ooh.map(c => c.reflectionQuestions[0]));
stat('resources[0]', ooh.map(c => c.resources[0]));
stat('decisionFit.workStyle', ooh.map(c => c.decisionFit.workStyle));
stat('pros[0]', ooh.map(c => c.decisionFit.pros[0]));
stat('cons[0]', ooh.map(c => c.decisionFit.cons[0]));
stat('traits', ooh.map(c => c.decisionFit.traits.join('|')));
stat('hardSkills', ooh.map(c => c.skills.hardSkills.join('|')));
stat('roles', ooh.map(c => c.roles.join('|')));
stat('undergrad', ooh.map(c => c.education.undergradDegrees.join('|')));
