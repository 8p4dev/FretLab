// 자가 검사 — 훅 밖 순수 리듀서. 실행: npx tsx src/features/study/logic.check.ts (package.json 은 건드리지 않음 — agent_D_study.md)
import { posKey } from '../../core/types'
import type { Mark } from '../../core/types'
import { fillStates, followOrder, followStates, followTap, fretWindows, gradeFill } from './logic'
import { recordResult, statsFor, statsKey, statsLine } from './stats'

// tsconfig 에 node 타입이 없어(vite/client 만) 작은 assert 를 둔다
const assert = {
  ok: (c: unknown, m = 'assert.ok') => { if (!c) throw new Error(m) },
  equal: (a: unknown, b: unknown, m = '') => { if (a !== b) throw new Error(`${m} expected ${JSON.stringify(b)} got ${JSON.stringify(a)}`) },
  deepEqual: (a: unknown, b: unknown, m = '') => { const x = JSON.stringify(a), y = JSON.stringify(b); if (x !== y) throw new Error(`${m} expected ${y} got ${x}`) },
}

const mk = (string: number, fret: number, root = false): Mark => ({ string, fret, pc: 0, midi: 40 + string * 5 + fret, degree: 1, semitone: 0, root })
// 섞어 넣어 정렬을 검사한다
const marks = [mk(1, 7), mk(0, 5, true), mk(0, 8), mk(1, 5), mk(2, 7)]

// ── 채우기 ──
{
  const picked = new Set(['0:5', '0:8', '1:5', '3:9']) // 정답 3 + 오답 1, 놓침 2
  const { result, states } = gradeFill(marks, picked)
  assert.deepEqual(result, { hit: 3, miss: 1, missing: 2 })
  assert.equal(states['0:5'], 'hit'); assert.equal(states['3:9'], 'miss'); assert.equal(states['1:7'], 'dim'); assert.equal(states['2:7'], 'dim')
  assert.equal(Object.keys(states).length, 6)
  assert.deepEqual(gradeFill(marks, new Set(marks.map(posKey))).result, { hit: 5, miss: 0, missing: 0 })
  assert.deepEqual(gradeFill(marks, new Set()).result, { hit: 0, miss: 0, missing: 5 })
  assert.deepEqual(gradeFill([], new Set(['0:0'])).result, { hit: 0, miss: 1, missing: 0 })
  assert.deepEqual(fillStates(new Set(['1:1'])), { '1:1': 'picked' })
}

// ── 따라치기 ──
{
  const order = followOrder(marks)
  assert.deepEqual(order.map(posKey), ['0:5', '0:8', '1:5', '1:7', '2:7'])
  assert.equal(marks.map(posKey)[0], '1:7', 'followOrder 는 원본을 바꾸지 않는다')
  // 전이: miss 는 idx 유지, hit 는 전진, 마지막은 done, 끝난 뒤는 done
  assert.equal(followTap(order, 0, { string: 0, fret: 8 }), 'miss')
  assert.equal(followTap(order, 0, { string: 0, fret: 5 }), 'hit')
  for (let i = 1; i < order.length - 1; i++) assert.equal(followTap(order, i, order[i]), 'hit')
  assert.equal(followTap(order, order.length - 1, order[order.length - 1]), 'done')
  assert.equal(followTap(order, order.length, { string: 0, fret: 0 }), 'done')
  assert.equal(followTap([], 0, { string: 0, fret: 0 }), 'done', '빈 marks 는 바로 done')
  // 표시
  const st = followStates(order, 2, '5:5')
  assert.equal(st['0:5'], 'hit'); assert.equal(st['0:8'], 'hit'); assert.equal(st['1:5'], 'target'); assert.equal(st['1:7'], undefined); assert.equal(st['5:5'], 'miss')
  assert.deepEqual(followStates(order, order.length), { '0:5': 'hit', '0:8': 'hit', '1:5': 'hit', '1:7': 'hit', '2:7': 'hit' })
}

// ── 프렛 창(모바일): 9칸 이하 1개, 넘으면 고르게 나누고 이어 붙이면 원래 범위 ──
{
  assert.deepEqual(fretWindows([5, 9]), [[5, 9]])
  assert.deepEqual(fretWindows([0, 8]), [[0, 8]])
  assert.deepEqual(fretWindows([0, 15]), [[0, 7], [8, 15]])
  assert.deepEqual(fretWindows([0, 12]), [[0, 6], [7, 12]])
  assert.deepEqual(fretWindows([0, 24]), [[0, 8], [9, 17], [18, 24]])
  for (const w of fretWindows([0, 22])) assert.ok(w[1] - w[0] + 1 <= 9, '창은 9칸 이하')
}

// ── 기록(localStorage 없음 → 메모리) ──
{
  const key = statsKey({ root: 9, scaleId: 'minor-pentatonic', tuningId: 'standard', system: 'caged', position: 2 }, 'fill')
  assert.equal(key, '9:minor-pentatonic:standard:caged:2:fill')
  assert.deepEqual(statsFor(key), { attempts: 0, correct: 0, total: 0, last: 0 })
  assert.equal(statsLine(statsFor(key)), '')
  recordResult(key, { correct: 3, total: 5 })
  const s = recordResult(key, { correct: 5, total: 5 })
  assert.equal(s.attempts, 2); assert.equal(s.correct, 8); assert.equal(s.total, 10); assert.ok(s.last > 0)
  assert.equal(statsLine(s), '정답률 80%(2회)')
  assert.equal(statsFor('없는 키').attempts, 0)
}

console.log('logic.check ok')
