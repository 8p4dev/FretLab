// E2E — orchestration_fretlab.md §5 3. 흐름 (a) 연습 보기 (b) 채우기 (c) 그립 + 2차 (d) 채우기 쓸어 찍기(U4+U8) + 6차 (e) 언어 전환. 빌드 결과를 vite preview 로 띄운다(playwright.config.ts).
// 기본 언어는 영어 — 접근 이름은 각 strings.ts 의 en 값(리터럴로 고정: 앱이 이름을 바꾸면 여기서 걸린다).
// 정답 자리는 앱 DOM 이 아니라 src/core/music 의 positions() 로 직접 계산한다(앱이 틀리면 테스트도 틀리는 순환을 피한다).
import { expect, test, type Locator, type Page } from '@playwright/test'
import { marksFor, positions, scaleById, tuningById } from '../src/core/music'
import { posKey } from '../src/core/types'

const A = 9
const PENTA = scaleById('minor-pentatonic')
const STD = tuningById('standard')
const FRETS = 22 // DEFAULTS.fretCount

// 매 테스트 기본 설정(fretlab:settings 없음 — 같은 탭의 새로고침 때는 지우지 않는다: (e) 유지 검사) + 소리 호출 수 스파이: playNote 1회 = AudioBufferSourceNode.start 1회
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (!sessionStorage.getItem('e2e')) { localStorage.clear(); sessionStorage.setItem('e2e', '1') }
    const w = window as unknown as { __starts: number }
    w.__starts = 0
    const orig = AudioBufferSourceNode.prototype.start
    AudioBufferSourceNode.prototype.start = function (...a: Parameters<typeof orig>) { w.__starts++; return orig.apply(this, a) }
  })
})

const errorsOf = (page: Page): string[] => {
  const errs: string[] = []
  page.on('pageerror', (e) => errs.push(String(e)))
  page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()) })
  return errs
}
const cell = (page: Page, key: string) => page.locator(`[data-pos="${key}"]`)
const center = async (page: Page, key: string) => {
  const b = await cell(page, key).boundingBox()
  if (!b) throw new Error(`cell ${key} not visible`)
  return { x: b.x + b.width / 2, y: b.y + b.height / 2 }
}

// 1440 은 3열(루트 | 스케일 | 포지션)이라 탭 전환 없이 한 화면에서 고른다
async function pickScale(page: Page, root: string, scale: string) {
  await page.getByRole('button', { name: 'Scale', exact: true }).click()
  const sheet = page.getByRole('dialog', { name: 'Scale' })
  await expect(sheet.getByRole('tab')).toHaveCount(0) // 모바일 탭(Root/Scale/Position)은 PC 에서 숨김
  await sheet.getByRole('group', { name: 'Root' }).getByRole('button', { name: root, exact: true }).click()
  await sheet.getByRole('button', { name: scale, exact: true }).click()
  return sheet
}
async function pickCaged1(sheet: Locator) {
  await sheet.getByRole('group', { name: 'Position system' }).getByRole('button', { name: 'CAGED' }).click()
  await sheet.getByRole('group', { name: 'Position', exact: true }).getByRole('button', { name: '1', exact: true }).click()
  await sheet.getByRole('button', { name: 'Done' }).click()
  await expect(sheet).toBeHidden()
}

test('(a) 연습 보기: A 마이너 펜타토닉 선택 → 루트 마크 수 → 표기 전환', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  const errs = errorsOf(page)
  await page.goto('/#/')
  const sheet = await pickScale(page, 'A', 'Minor Pentatonic')
  await sheet.getByRole('button', { name: 'Close' }).click()
  await expect(sheet).toBeHidden()

  const all = marksFor(A, PENTA, STD, FRETS)
  await expect(page.locator('[data-pos]')).toHaveCount(STD.strings.length * (FRETS + 1))
  await expect(page.locator('.fb-mark')).toHaveCount(all.length)
  await expect(page.locator('.fb-mark.root')).toHaveCount(all.filter((m) => m.root).length)
  await expect(page.locator('.fb-label.root').first()).toHaveText('A')

  // 표기 도수 → 라벨이 순번(1..5)으로, 인터벌 → b3 류로
  await page.getByRole('button', { name: 'Options' }).click()
  const opts = page.getByRole('dialog', { name: 'Options' })
  await opts.getByRole('group', { name: 'Labels' }).getByRole('button', { name: 'Degree' }).click()
  await expect(page.locator('.fb-label.root').first()).toHaveText('1')
  const degs = await page.locator('.fb-label').allTextContents()
  expect(new Set(degs)).toEqual(new Set(['1', '2', '3', '4', '5']))
  await opts.getByRole('group', { name: 'Labels' }).getByRole('button', { name: 'Interval' }).click()
  const ivs = await page.locator('.fb-label').allTextContents()
  expect(new Set(ivs)).toEqual(new Set(['1', 'b3', '4', '5', 'b7']))
  await opts.getByRole('button', { name: 'Close' }).click()
  expect(errs).toEqual([])
})

test('(b) 채우기: CAGED 1 포지션 정답 자리 전부 탭 → 채점 → 틀림 0·놓침 0 → 다음 포지션', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  const errs = errorsOf(page)
  await page.goto('/#/')
  await pickCaged1(await pickScale(page, 'A', 'Minor Pentatonic'))

  const pos = positions(A, PENTA, STD, 'caged', FRETS)
  expect(pos).toHaveLength(5)
  const answer = pos[0].marks
  await page.goto('/#/study/fill')
  await expect(page.getByText(/Position 1 \/ 5/)).toBeVisible()
  await expect(page.locator('.fb-mark')).toHaveCount(0) // 마크 숨김
  for (const m of answer) await cell(page, posKey(m)).click()
  await expect(page.locator('.fb-mark.st-picked')).toHaveCount(answer.length)
  await page.getByRole('button', { name: 'Grade' }).click()

  const sum = page.getByRole('region', { name: 'Results' })
  await expect(sum).toBeVisible()
  await expect(sum).toContainText(`${answer.length}Correct`)
  await expect(sum).toContainText('0Wrong')
  await expect(sum).toContainText('0Missed')
  await expect(page.locator('.fb-mark.st-hit')).toHaveCount(answer.length)
  await expect(page.locator('.fb-mark.st-miss')).toHaveCount(0)

  // 완료 상태에서는 'Next position' 버튼이 둘(포지션 줄 화살표 · 하단 바) — 하단 바 것으로 다음 포지션
  await page.locator('.study-bar').getByRole('button', { name: 'Next position' }).click()
  await expect(page.getByText(/Position 2 \/ 5/)).toBeVisible()
  await expect(sum).toBeHidden()
  expect(errs).toEqual([])
})

test('(d) 채우기 쓸어 찍기: 같은 줄 연속 셀을 드래그 → 지나간 셀 전부 picked · 되돌아와도 재토글 없음', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  const errs = errorsOf(page)
  await page.goto('/#/')
  await pickCaged1(await pickScale(page, 'A', 'Minor Pentatonic'))

  // 정답 중 같은 줄에서 프렛 간격이 가장 좁은 두 자리 → 그 사이 셀까지 연속 2~3칸(정답·비정답 섞임)을 쓴다
  const answer = positions(A, PENTA, STD, 'caged', FRETS)[0].marks
  const byString = new Map<number, number[]>()
  for (const m of answer) byString.set(m.string, [...(byString.get(m.string) ?? []), m.fret])
  let best: { s: number; f1: number; f2: number } | undefined
  for (const [s, frets] of byString) {
    const f = [...frets].sort((a, b) => a - b)
    for (let i = 1; i < f.length; i++) if (!best || f[i] - f[i - 1] < best.f2 - best.f1) best = { s, f1: f[i - 1], f2: f[i] }
  }
  if (!best) throw new Error('같은 줄에 정답이 둘 이상인 줄이 없다')
  const path: string[] = []
  for (let f = best.f1; f <= best.f2; f++) path.push(`${best.s}:${f}`)
  expect(path.length).toBeGreaterThanOrEqual(2)
  expect(path.length).toBeLessThanOrEqual(4)

  await page.goto('/#/study/fill')
  await expect(page.getByText(/Position 1 \/ 5/)).toBeVisible()
  await expect(page.getByText(`Picked 0 of ${answer.length}`)).toBeVisible()

  const c0 = await center(page, path[0])
  await page.mouse.move(c0.x, c0.y)
  await page.mouse.down()
  for (const key of path.slice(1)) { const c = await center(page, key); await page.mouse.move(c.x, c.y, { steps: 6 }) }
  // 되돌아옴: 같은 포인터가 이미 들어갔던 셀은 다시 토글되지 않아야 한다
  for (const key of [...path].reverse().slice(1)) { const c = await center(page, key); await page.mouse.move(c.x, c.y, { steps: 6 }) }
  await page.mouse.up()

  await expect(page.locator('.fb-mark.st-picked')).toHaveCount(path.length)
  // 마크 rect 에는 data-pos 가 없으므로 지나간 셀마다 그 셀 사각 안에 picked 마크가 있는지 좌표로 확인
  for (const key of path) {
    const hit = await cell(page, key).evaluate((c) => {
      const r = c.getBoundingClientRect()
      return [...document.querySelectorAll('.fb-mark.st-picked')].some((m) => {
        const mb = m.getBoundingClientRect()
        return mb.left >= r.left - 1 && mb.right <= r.right + 1 && mb.top >= r.top - 1 && mb.bottom <= r.bottom + 1
      })
    })
    expect(hit, `cell ${key} picked`).toBe(true)
  }
  await expect(page.getByText(`Picked ${path.length} of ${answer.length}`)).toBeVisible()
  expect(errs).toEqual([])
})

test('(e) 언어 전환: 日本語 → 상단 바·스케일 바·html lang → 새로고침 뒤 유지 → 한국어', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  const errs = errorsOf(page)
  await page.goto('/#/')
  const nav = page.locator('.topnav')
  const html = page.locator('html')
  const bar = page.locator('.scale-bar')
  await expect(nav.getByRole('link', { name: 'Practice' })).toBeVisible()
  await expect(bar).toContainText('Minor Pentatonic')
  await expect(html).toHaveAttribute('lang', 'en')

  await page.getByRole('button', { name: 'Options' }).click()
  await page.getByRole('dialog', { name: 'Options' }).getByLabel('Language').selectOption({ label: '日本語' })
  // 즉시 반영: 열려 있는 시트 제목 · 상단 바 · 스케일 바 · <html lang>
  await expect(page.getByRole('dialog', { name: 'オプション' })).toBeVisible()
  await expect(nav.getByRole('link', { name: '練習' })).toBeVisible()
  await expect(bar).toContainText('マイナーペンタトニック')
  await expect(html).toHaveAttribute('lang', 'ja')

  await page.reload()
  await expect(nav.getByRole('link', { name: '練習' })).toBeVisible()
  await expect(bar).toContainText('マイナーペンタトニック')
  await expect(html).toHaveAttribute('lang', 'ja')

  await page.getByRole('button', { name: 'オプション' }).click()
  await page.getByRole('dialog', { name: 'オプション' }).getByLabel('言語').selectOption({ label: '한국어' })
  await expect(nav.getByRole('link', { name: '연습' })).toBeVisible()
  await expect(bar).toContainText('마이너 펜타토닉')
  await expect(html).toHaveAttribute('lang', 'ko')
  await page.getByRole('dialog', { name: '옵션' }).getByRole('button', { name: '닫기' }).click()
  expect(errs).toEqual([])
})

test.describe('(c) 그립', () => {
  test.use({ viewport: { width: 844, height: 390 }, isMobile: true, hasTouch: true })

  test('시작 → 셸 없음 → 두 셀 탭 2음·오류 0 → 따라치기 target 이동', async ({ page }) => {
    const errs = errorsOf(page)
    await page.goto('/#/grip')
    await page.getByRole('button', { name: /^Start/ }).click()
    await expect(page.locator('.topnav')).toHaveCount(0)
    await expect(page.locator('[data-pos]').first()).toBeVisible()

    // 창은 포지션 첫 프렛(full = 0)부터 5칸(844/150 → 5). 창 안 마크 두 개를 연달아 탭 → 소리 2회
    const pos = positions(A, PENTA, STD, 'full', FRETS)[0]
    const visible = pos.marks.filter((m) => m.fret <= 4)
    const [m1, m2] = visible
    const starts = () => page.evaluate(() => (window as unknown as { __starts: number }).__starts)
    const before = await starts()
    const c1 = await center(page, posKey(m1)), c2 = await center(page, posKey(m2))
    await page.touchscreen.tap(c1.x, c1.y)
    await page.touchscreen.tap(c2.x, c2.y)
    await expect.poll(starts).toBe(before + 2)

    // 따라치기: 첫 target(string ↑, fret ↑) 탭 → 다음 target 으로
    await page.getByRole('group', { name: 'Mode' }).getByRole('button', { name: 'Follow' }).click()
    const order = [...visible].sort((a, b) => a.string - b.string || a.fret - b.fret)
    const target = page.locator('.fb-mark.st-target')
    await expect(target).toHaveCount(1)
    const t0 = await center(page, posKey(order[0]))
    await page.touchscreen.tap(t0.x, t0.y)
    await expect(page.locator('.fb-mark.st-hit')).toHaveCount(1)
    const t1 = await center(page, posKey(order[1]))
    const tb = await target.boundingBox()
    expect(Math.abs(tb!.x + tb!.width / 2 - t1.x)).toBeLessThan(2)
    expect(Math.abs(tb!.y + tb!.height / 2 - t1.y)).toBeLessThan(2)
    await expect.poll(starts).toBe(before + 3)
    expect(errs).toEqual([])
  })
})
