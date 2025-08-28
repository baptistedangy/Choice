// Lightweight menu parser for OCR text → structured dishes
// Rules implemented per request.

const PRICE_REGEX = /(?:€|\$)\s*\d{1,3}(?:[\.,]\d{2})?|\d{1,3}(?:[\.,]\d{2})\s*(?:€|\$)?/;
const ONLY_PRICE_REGEX = new RegExp(`^\s*(?:${PRICE_REGEX.source})\s*$`);

function isAllCapsWithLetters(line) {
	const letters = line.replace(/[^A-Za-zÀ-ÖØ-öø-ÿ]/g, '');
	if (!letters) return false;
	return line === line.toUpperCase();
}

function hasPrice(line) {
	return PRICE_REGEX.test(line);
}

function isLikelyTitleByLength(line) {
	// Start of new line is implicit; consider word count ≤ 5
	const words = line.trim().split(/\s+/).filter(Boolean);
	return words.length > 0 && words.length <= 5;
}

function isRealDishTitle(line) {
	// Must be ALL CAPS with meaningful content
	if (!isAllCapsWithLetters(line)) return false;
	
	// Filter out common menu headers and noise
	const noisePatterns = [
		/^DRINKS$/i,
		/^MENU$/i,
		/^DESSERTS$/i,
		/^KIDS$/i,
		/^ASADOS$/i,
		/^Y MÁS$/i,
		/^guacamole$/i,
		/^\+.*\+.*$/i, // + guacamole (+2.50)
		/^[^A-Za-z]*$/, // Only symbols/numbers
		/^[A-Z\s]{1,3}$/, // Very short all caps
		/^\+.*$/i, // Lines starting with + (add-ons)
		/^.*\(.*\).*$/i, // Lines with parentheses (often add-ons)
		/^[a-z].*$/i, // Lines starting with lowercase (not titles)
		/^[^A-Z].*$/i // Lines not starting with uppercase
	];
	
	return !noisePatterns.some(pattern => pattern.test(line.trim()));
}

function isNoise(line) {
	// Only numbers, currency, dots, dashes, slashes, or empty
	if (!line || !line.trim()) return true;
	const t = line.trim();
	if (/^[\d\s\.,:;_\-–—/]+$/.test(t)) return true;
	return false;
}

function normalizeTitle(raw) {
	let title = raw
		.replace(PRICE_REGEX, '')
		.replace(/[\s\.-/]+$/g, '')
		.trim();
	if (!title) return '';
	// Capitalize first letter of each word, keep acronyms (ALL CAPS) as-is
	title = title
		.split(/\s+/)
		.map(w => {
			// keep acronyms
			const letters = w.replace(/[^A-Za-zÀ-ÖØ-öø-ÿ]/g, '');
			if (letters && w === w.toUpperCase()) return w; // acronym stays
			return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
		})
		.join(' ');
	return title;
}

function normalizePriceFrom(line) {
	const m = line.match(PRICE_REGEX);
	if (!m) return null;
	let p = m[0].trim();
	// Normalize decimal separator to dot; keep currency if present at start or end
	const hasEuro = /€/.test(p);
	const hasDollar = /\$/.test(p);
	p = p.replace(/[€\$]/g, '').trim().replace(',', '.');
	// Ensure two decimals if decimal present; keep raw if integer-like
	if (/^\d+(?:\.\d{1,2})?$/.test(p)) {
		if (!p.includes('.')) p = p + '.00';
		if (p.split('.')[1].length === 1) p = p + '0';
	}
	if (hasEuro) return p + '€';
	if (hasDollar) return '$' + p;
	return p; // bare number
}

function normalizeDescription(text) {
	const cleaned = text
		.replace(/[\s\.-/]+$/g, '')
		.trim();
	return cleaned.toLowerCase();
}

export function parseMenu(text) {
	if (!text || typeof text !== 'string') return [];
	const lines = text
		.split(/\r?\n/)
		.map(l => l.replace(/\s+/g, ' ').trim())
		.filter(l => l.length > 0);

	const dishes = [];
	let current = null;

	const commit = () => {
		if (!current) return;
		const title = normalizeTitle(current.title || '');
		const description = normalizeDescription(current.description || '').trim();
		const price = current.price ?? null;
		if (title) {
			dishes.push({ title, price, description });
		}
		current = null;
	};

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		if (isNoise(line)) continue;

		const titleCandidate = isRealDishTitle(line);

		if (titleCandidate && !ONLY_PRICE_REGEX.test(line)) {
			// New title detected → commit previous
			commit();
			current = {
				title: line,
				price: normalizePriceFrom(line),
				description: ''
			};
			continue;
		}

		// Description or standalone price
		if (ONLY_PRICE_REGEX.test(line)) {
			// Attach price to current if title exists and no price yet
			if (current && !current.price) current.price = normalizePriceFrom(line);
			continue;
		}
		if (current) {
			current.description = (current.description ? current.description + ' ' : '') + line;
		}
	}
	// commit last
	commit();

	// Deduplicate by title+price
	const seen = new Set();
	const result = [];
	for (const d of dishes) {
		const key = `${d.title}|${d.price || ''}`;
		if (d.title && !seen.has(key)) {
			seen.add(key);
			result.push({ title: d.title, price: d.price || null, description: d.description || '' });
		}
	}
	return result;
}

export default { parseMenu };
