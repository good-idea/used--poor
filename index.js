const puppeteer = require('puppeteer')
const fs = require('fs')

const results = []

const searchPage = async (page, num = 1, prevUrl = '') => {
	if (page.url() === prevUrl) return
	const currentUrl = page.url()
	console.log(`Searching page ${num}..`)
	const poorResults = await page.evaluate(() => {
		const goodConditions = [
			'new',
			'good',
			'bon',
			'gut',
			'vg',
			'fine',
			'new',
			'neuf',
			'nrvg',
			'excellent',
			'nf',
		]

		const isNotGood = condition => {
			for (const goodCondition of goodConditions) {
				if (condition.toLowerCase().includes(goodCondition)) return false
			}
			return true
		}

		const results = Array.from(document.getElementsByClassName('result'))

		return results
			.map(result => {
				const ptags = Array.from(result.getElementsByTagName('p'))
				const listingAnchor = result.querySelector('h2[itemProp="offers"] a')

				const description = ptags
					.map(p => {
						const match = p.textContent.match(/Condition: (\w+)\./)
						if (match && isNotGood(match[1])) {
							const result = {
								condition: match[1],
								description: match.input,
								url: listingAnchor.href,
							}
							return result
						}
						return false
					})
					.filter(Boolean)

				if (description && description.length) return description[0]
			})
			.filter(Boolean)
	})
	if (poorResults.length) {
		console.log(`  Found ${poorResults.length} results`)
		poorResults.forEach(r => results.push(r))
	}

	const nextPage = await page.$x("//a[@id='topbar-page-next']")
	if (nextPage) {
		await nextPage[0].click()
		await page.waitForNavigation()
		return searchPage(page, num + 1, currentUrl)
	} else {
		console.log('**** Done! ****')
		return
	}
}

const init = async () => {
	try {
		// Go to the main page and make a search
		// const browser = await puppeteer.launch({ headless: false, slowMo: 50 })
		const browser = await puppeteer.launch()
		const page = await browser.newPage()
		page.setViewport({
			width: 1250,
			height: 1100,
		})
		await page.goto('https://www.abebooks.com')
		await page.type('#hp-search-author', 'Jean Genet')
		page.click('#hp-search-find-book')
		await page.waitForNavigation()
		await searchPage(page)
		console.log('**** Done ****')
		console.log(`Found ${results.length} results`)
		fs.writeFileSync('./results.json', JSON.stringify(results, null, 2))
		await browser.close()
	} catch (error) {
		console.log(error)
	}
}

init()
