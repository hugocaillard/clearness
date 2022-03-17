import { test, expect } from '@playwright/test'

const base = 'https://www.clearness.dev'

const sel = {
  title: 'head>title',
  canonical: 'head>link[rel="canonical"]',
  ogUrl: 'head>meta[property="og:url"]',
}

test.use({ baseURL: 'http://localhost:3011' })

test.describe('home page', async () => {
  test('has the right head data', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator(sel.title)).toHaveText('Clearness')
    await expect(page.locator(sel.canonical)).toHaveAttribute('href', base)
    await expect(page.locator(sel.ogUrl)).toHaveAttribute('content', base)
  })

  test('has the right H1', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('h1>a')).toHaveText('Ӿ Clearness')
  })
})

test.describe('category page', () => {
  const path = '/00-annexes'
  const url = `${base}${path}`
  test('has the right head data', async ({ page }) => {
    await page.goto(path)

    await expect(page.locator(sel.title)).toHaveText(
      'Clearness - Clarity Annexes',
    )
    await expect(page.locator(sel.canonical)).toHaveAttribute('href', url)
    await expect(page.locator(sel.ogUrl)).toHaveAttribute('content', url)

    // make sure canonical links are resilient
    await page.goto('/00-AnNExeS/#anch?foo=bar/')

    await expect(page.locator(sel.canonical)).toHaveAttribute('href', url)
    await expect(page.locator(sel.ogUrl)).toHaveAttribute('content', url)
  })

  test('has the right h2 title', async ({ page }) => {
    await page.goto(path)

    await expect(page.locator('h2')).toHaveText('Clarity Annexes')
  })
})

test.describe('article page', () => {
  const path = '/00-annexes/03-coding-style'
  const url = `${base}${path}`

  test('has the right head data', async ({ page }) => {
    await page.goto(path)

    await expect(page.locator(sel.title)).toHaveText(
      'Clearness - Clarity Annexes - Coding Style',
    )
    await expect(page.locator(sel.canonical)).toHaveAttribute('href', url)
    await expect(page.locator(sel.ogUrl)).toHaveAttribute('content', url)

    // make sure canonical links are resilient
    await page.goto('/00-AnNExeS/03-COdING-Style#anch?foo=bar/')

    await expect(page.locator(sel.canonical)).toHaveAttribute('href', url)
    await expect(page.locator(sel.ogUrl)).toHaveAttribute('content', url)
  })

  test('has the right h2 titles', async ({ page }) => {
    await page.goto(path)

    await expect(page.locator('h2').first()).toHaveText('Clarity Annexes')
    await expect(page.locator('h2').nth(1)).toHaveText('Coding style')
  })
})
