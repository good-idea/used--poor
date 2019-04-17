const results = require('./results.json')

const unique = (val, index, arr) => arr.indexOf(val) === index

const conditionCount = results.reduce((acc, current) => {
	const { condition } = current
	const key = condition.toLowerCase()
	if (acc[key]) {
		return {
			...acc,
			[key]: acc[key] + 1,
		}
	} else {
		return {
			...acc,
			[key]: 1,
		}
	}
}, {})

console.log(conditionCount)
