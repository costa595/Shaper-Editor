/********************************ИНИЦИАЛИЗАЦИЯ ОБЪЕКТА ПЕРЗЕНТАЦИИ/ТЕМЫ**************************/
/********************************Инициализация темы**************************/
fontsPatternStyles = {
	sizeForWidth: 1920,
	first: {
		header: {
			'font-size': '0.98em',
		},

		innerHeader: {
			'font-size': '0.68em',
		},

		title: {
			'font-size': '0.62em',
		},

		usual: {
			'font-size': '0.60em',
		}
	},

	middle: {
		header: {
			'font-size': '0.97em',
		},

		innerHeader: {
			'font-size': '0.68em',
		},

		title: {
			'font-size': '0.62em',
		},

		usual: {
			'font-size': '0.60em',
		}
	},

	last: {
		header: {
			'font-size': '0.97em',
		},

		innerHeader: {
			'font-size': '0.68em',
		},

		title: {
			'font-size': '0.62em',
		},

		usual: {
			'font-size': '0.60em',
		}
	}
};


newThemeWizardServer = "";
presentationObject = presentationObject = "";

//*******************************************

/**********************BEST AREAS****************************
На данный момент заглушка, позже это будет инициализироваться в зависимости от паттера
Кроме того области будут появляться в процессе работы автоматической верстки*/
bestAreasTemplate = {
	//По слайдам, внутри по типам контента. Для текста внутри по типам текста
	first: {
		text: {
			header: [{
				width: 63.29 + '%',
				height: 9.9 + '%',
				top: 40 + '%',
				left: 2.54 + '%'
			}],

			innerHeader: [{
				top: 51.75 + '%',
				left: 2.55 + '%',
				width: 63.28 + '%',
				height: 12.2 + '%',
			}],

			usual: [{
				width: 63.33 + '%',
				height: 6.85 + '%',
				top: 72.77 + '%',
				left: 2.55 + '%'
			}, {
				width: 63.33 + '%',
				height: 6.85 + '%',
				top: 85.37 + '%',
				left: 2.55 + '%'
			}]
		}
	},

	middle: {
		text: {
			header: [{
				top: 5.33 + '%',
				left: 5.18 + '%',
				width: 89.58 + '%',
				height: 9.9 + '%',
			}],

			innerHeader: [{
				top: 16.11 + '%',
				left: 5.18 + '%',
				width: 89.58 + '%',
				height: 12.22 + '%',
			}],

			usual: [{
				top: 34.90 + '%',
				left: 5.18 + '%',
				width: 89.58 + '%',
				height: 44.15 + '%',
			}]
		}
	},

	last: {
		text: {
			header: [{
				top: 34.62 + '%',
				left: 5.2 + '%',
				width: 89.58 + '%',
				height: 12.2 + '%',
			}],

			innerHeader: [{
				top: 45.46 + '%',
				left: 5.2 + '%',
				width: 89.58 + '%',
				height: 9.9 + '%',
			}],

			usual: [{
				top: 64.25 + '%',
				left: 5.2 + '%',
				width: 89.58 + '%',
				height: 14.81 + '%',
			}]
		}
	}
};