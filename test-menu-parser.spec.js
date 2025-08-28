import { describe, it, expect } from 'vitest';
import { parseMenu } from './src/lib/menuParser.js';

describe('menuParser.parseMenu', () => {
	it('detecte les titres en CAPS et fusionne les descriptions', () => {
		const ocr = `
TIGERMILK CEVICHE 14.50
Leche de tigre au lait de coco, mangue, grenade,
corandre fraîche, pickles d’oignons rouges, patates douces rôties

AMARILLO 15,00
Lieu noir cru mariné dans leche de tigre,
crème d’avocat, grenades, patates douces rôties, coriandre fraîche

Y MÁS
SEPARATEUR .....
13.00
`;
		const dishes = parseMenu(ocr);
		expect(dishes.length).toBe(3);
		expect(dishes[0]).toEqual({
			title: 'TIGERMILK CEVICHE',
			price: '14.50',
			description: 'leche de tigre au lait de coco, mangue, grenade, corandre fraîche, pickles d’oignons rouges, patates douces rôties'
		});
		expect(dishes[1]).toEqual({
			title: 'Amarillo',
			price: '15.00',
			description: 'lieu noir cru mariné dans leche de tigre, crème d’avocat, grenades, patates douces rôties, coriandre fraîche'
		});
		expect(dishes[2]).toEqual({
			title: 'Y MÁS',
			price: '13.00',
			description: ''
		});
	});

	it('ignore les faux positifs et prix seuls', () => {
		const ocr = `
----
14.50
/ / / / 
GREEN BUT NOT BORING
Une quinoa bien balancée, fruits rouges, feta
`;
		const dishes = parseMenu(ocr);
		expect(dishes.length).toBe(1);
		expect(dishes[0].title).toBe('Green But Not Boring');
		expect(dishes[0].price).toBe(null);
		expect(dishes[0].description).toContain('une quinoa');
	});

	it('détecte titre court en début de ligne (≤5 mots)', () => {
		const ocr = `
El Coliflor
Un beau steak de chou fleur mariné et rôti, houmous verde.
15.50€
`;
		const dishes = parseMenu(ocr);
		expect(dishes.length).toBe(1);
		expect(dishes[0].title).toBe('El Coliflor');
		expect(dishes[0].price).toBe('15.50€');
	});
});
