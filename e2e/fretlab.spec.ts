// E2E — orchestration_fretlab.md §5 3. 흐름 3개만: (a) 연습 보기 (b) 채우기 (c) 그립. 빌드 결과를 vite preview 로 띄운다(playwright.config.ts).
// 정답 자리는 앱 DOM 이 아니라 src/core/music 의 positions() 로 직접 계산한다(앱이 틀리면 테스트도 틀리는 순환을 피한다).
import { expect, test, type Page } from '@playwright/test'
import { marksFor, positions, scaleById, tuningById } from '../src/core/music'
import { posKey } from '../src/core/types'

const A = 9
const PENTA = scaleById('minor-pentatonic')
const STD = tuningById('standard')
const FRETS = 15 // DEFAULTS.fretCount

// 매 테스트 기본 설정(fretlab:settings 없음) + 소리 호출 수 스파이: playNote 1회 = AudioBufferSourceNode.start 1회
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.clear()
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

async function pickScale(page: Page, root: string, scaleKo: RegExp) {
  await page.getByRole('button', { name: '스케일 선택' }).click()
  const sheet = page.getByRole('dialog', { name: '스케일 선택' })
  await sheet.getByRole('group', { name: '루트' }).getByRole('button', { name: root, exact: true }).click()
  await sheet.getByRole('button', { name: scaleKo }).click()
  return sheet
}

test('(a) 연습 보기: A 마이너 펜타토닉 선택 → 루트 마크 수 → 표기 전환', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  const errs = errorsOf(page)
  await page.goto('/#/')
  const sheet = await pickScale(page, 'A', /^마이너 펜타토닉/)
  await sheet.getByRole('button', { name: '닫기' }).click()
  await expect(sheet).toBeHidden()

  const all = marksFor(A, PENTA, STD, FRETS)
  await expect(page.locator('[data-pos]')).toHaveCount(STD.strings.length * (FRETS + 1))
  await expect(page.locator('.fb-mark')).toHaveCount(all.length)
  await expect(page.locator('.fb-mark.root')).toHaveCount(all.filter((m) => m.root).length)
  await expect(page.locator('.fb-label.root').first()).toHaveText('A')

  // 표기 도수 → 라벨이 순번(1..5)으로, 인터벌 → b3 류로
  await page.getByRole('button', { name: '옵션' }).click()
  const opts = page.getByRole('dialog', { name: '옵션' })
  await opts.getByRole('group', { name: '표기' }).getByRole('button', { name: '도수' }).click()
  await expect(page.locator('.fb-label.root').first()).toHaveText('1')
  const degs = await page.locator('.fb-label').allTextContents()
  expect(new Set(degs)).toEqual(new Set(['1', '2', '3', '4', '5']))
  await opts.getByRole('group', { name: '표기' }).getByRole('button', { name: '인터벌' }).click()
  const ivs = await page.locator('.fb-label').allTextContents()
  expect(new Set(ivs)).toEqual(new Set(['1', 'b3', '4', '5', 'b7']))
  await opts.getByRole('button', { name: '닫기' }).click()
  expect(errs).toEqual([])
})

test('(b) 채우기: CAGED 1 포지션 정답 자리 전부 탭 → 채점 → 틀림 0·놓침 0', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  const errs = errorsOf(page)
  await page.goto('/#/')
  const sheet = await pickScale(page, 'A', /^마이너 펜타토닉/)
  await sheet.getByRole('group', { name: '포지션 시스템' }).getByRole('button', { name: 'CAGED' }).click()
  await sheet.getByRole('group', { name: '포지션 순번' }).getByRole('button', { name: '1', exact: true }).click()
  await sheet.getByRole('button', { name: '닫기' }).click()

  const pos = positions(A, PENTA, STD, 'caged', FRETS)
  expect(pos).toHaveLength(5)
  const answer = pos[0].marks
  await page.goto('/#/study/fill')
  await expect(page.getByText(/포지션 1 \/ 5/)).toBeVisible()
  await expect(page.locator('.fb-mark')).toHaveCount(0) // 마크 숨김
  for (const m of answer) await cell(page, posKey(m)).click()
  await expect(page.locator('.fb-mark.st-picked')).toHaveCount(answer.length)
  await page.getByRole('button', { name: '채점' }).click()

  const sum = page.getByRole('region', { name: '채점 결과' })
  await expect(sum).toBeVisible()
  await expect(sum).toContainText(`${answer.length}맞음`)
  await expect(sum).toContainText('0틀림')
  await expect(sum).toContainText('0놓침')
  await expect(page.locator('.fb-mark.st-hit')).toHaveCount(answer.length)
  await expect(page.locator('.fb-mark.st-miss')).toHaveCount(0)
  expect(errs).toEqual([])
})

test.describe('(c) 그립', () => {
  test.use({ viewport: { width: 844, height: 390 }, isMobile: true, hasTouch: true })

  test('시작 → 셸 없음 → 두 셀 탭 2음·오류 0 → 따라치기 target 이동', async ({ page }) => {
    const errs = errorsOf(page)
    await page.goto('/#/grip')
    await page.getByRole('button', { name: /^시작/ }).click()
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
    await page.getByRole('group', { name: '모드' }).getByRole('button', { name: '따라치기' }).click()
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
