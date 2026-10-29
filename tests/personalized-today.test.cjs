const fs = require('node:fs');
const ts = require('typescript');
const { test } = require('node:test');
const assert = require('node:assert/strict');
require.extensions['.ts'] = (m, p) => m._compile(ts.transpileModule(fs.readFileSync(p, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, p);
const { personalizedToday } = require('../apps/web/app/personalized-today.ts');
const { placementKnowledge, recommendedLessons } = require('../apps/web/app/learning-profile.ts');
const { isLessonUnlocked } = require('../apps/web/app/learning-pathways.ts');
const { lessons } = require('../apps/web/app/curriculum.ts');

test('all five levels and eight interests get eligible, unexplored recommendations', () => {
  for (const level of ['new', 'hangul', 'basic', 'intermediate', 'advanced']) {
    for (const reason of ['family', 'travel', 'culture', 'work-study', 'friends', 'food', 'living', 'exams']) {
      const profile = { level, reasons: [reason], dailyMinutes: 5 };
      const result = personalizedToday(profile, []);
      assert.equal(result.next.id, recommendedLessons([], profile)[0].id);
      assert.ok(result.alternatives.length <= 2);
      for (const lesson of [result.next, ...result.alternatives]) {
        assert.ok(isLessonUnlocked(lesson, [], placementKnowledge(profile)));
        assert.ok(!placementKnowledge(profile).includes(lesson.id));
      }
      assert.ok(result.levelLabel && result.guidance && result.interests.includes(reason === 'work-study' ? 'work & study' : reason));
    }
  }
});

test('completing a recommendation advances it without modifying profile or progress', () => {
  for (const level of ['new', 'hangul', 'basic', 'intermediate', 'advanced']) {
    const profile = { level, reasons: ['family'], dailyMinutes: 10 };
    const completed = [];
    for (let i = 0; i < 8; i++) {
      const before = JSON.stringify({ profile, completed });
      const result = personalizedToday(profile, completed);
      assert.equal(JSON.stringify({ profile, completed }), before);
      assert.ok(!completed.includes(result.next.id));
      assert.ok(result.alternatives.every(l => l.id !== result.next.id && !completed.includes(l.id)));
      completed.push(result.next.id);
    }
  }
});

test('route completion has a genuine empty state instead of restarting the first lesson', () => {
  const result = personalizedToday({ level: 'advanced', reasons: ['family'] }, lessons.map(l => l.id));
  assert.equal(result.next, null);
  assert.deepEqual(result.alternatives, []);
});

test('focused controls open the selected lesson, settings, review and full dashboard without changing progress', () => {
  const vm = require('node:vm');
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync('apps/web/app/ui/personalized-today.tsx', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText, { exports, require(id) {
    if (id === '../personalized-today') return { personalizedToday };
    if (id.endsWith('.css')) return { default: {} };
    return require(id);
  }});
  function nodes(node) {
    if (!node || typeof node !== 'object') return [];
    return [node, ...[node.props?.children].flat(Infinity).flatMap(nodes)];
  }
  const calls = [];
  const props = { profile: { level: 'basic', reasons: ['food'] }, completed: [], dailyMinutes: 5, dueCount: 2,
    onLesson: lesson => calls.push(lesson.id), onReview: () => calls.push('review'),
    onSettings: () => calls.push('settings'), onShowDashboard: () => calls.push('dashboard') };
  const before = JSON.stringify({ profile: props.profile, completed: props.completed });
  const buttons = nodes(exports.PersonalizedToday(props)).filter(n => n.type === 'button');
  buttons.forEach(button => button.props.onClick());
  const plan = personalizedToday(props.profile, []);
  assert.deepEqual(calls, ['settings', plan.next.id, 'review', ...plan.alternatives.map(l => l.id), 'dashboard']);
  assert.equal(JSON.stringify({ profile: props.profile, completed: props.completed }), before);
  const noDue = nodes(exports.PersonalizedToday({ ...props, dueCount: 0 }));
  assert.ok(!noDue.some(n => n.type === 'button' && n.props.children === 'Review instead'));
  const finished = nodes(exports.PersonalizedToday({ ...props, completed: lessons.map(l => l.id) }));
  assert.ok(!finished.some(n => n.type === 'button' && Array.isArray(n.props.children) && n.props.children[0] === 'Start '));
});
