// """"""""""""""""""""""""""""""
const searchInput = document.querySelector('#game-search');
const filterButtons = document.querySelectorAll('.filter-btn[data-filter]');
const favoritesFilter = document.querySelector('#favorites-filter');
const cards = [...document.querySelectorAll('.game-card')];
const resultCount = document.querySelector('#result-count');
const favoriteCount = document.querySelector('#favorite-count');
let activeFilter = 'all';
let favorites = JSON.parse(localStorage.getItem('infinity-favorites') || '[]');

function updateFavorites() {
	cards.forEach((card) => {
		const key = card.dataset.title;
		const button = card.querySelector('.save-btn');
		const saved = favorites.includes(key);
		button.textContent = saved ? '★' : '☆';
		button.classList.toggle('saved', saved);
		button.setAttribute('aria-pressed', saved);
	});
	favoriteCount.textContent = favorites.length;
}

function renderCards() {
	const query = searchInput.value.trim().toLowerCase();
	let visible = 0;
	cards.forEach((card) => {
		const matchesSearch = `${card.dataset.title} ${card.dataset.tags}`.includes(query);
		const matchesFilter = activeFilter === 'all' || card.dataset.modes.includes(activeFilter) || (activeFilter === 'favorites' && favorites.includes(card.dataset.title));
		const show = matchesSearch && matchesFilter;
		card.hidden = !show;
		if (show) visible += 1;
	});
	resultCount.textContent = `${visible} game${visible === 1 ? '' : 's'} available`;
}

filterButtons.forEach((button) => button.addEventListener('click', () => {
	filterButtons.forEach((item) => item.classList.remove('active'));
	favoritesFilter.classList.remove('active');
	button.classList.add('active');
	activeFilter = button.dataset.filter;
	renderCards();
}));

favoritesFilter.addEventListener('click', () => {
	const isActive = favoritesFilter.classList.contains('active');
	filterButtons.forEach((item) => item.classList.remove('active'));
	favoritesFilter.classList.toggle('active', !isActive);
	activeFilter = isActive ? 'all' : 'favorites';
	renderCards();
});

cards.forEach((card) => card.querySelector('.save-btn').addEventListener('click', () => {
	const key = card.dataset.title;
	favorites = favorites.includes(key) ? favorites.filter((item) => item !== key) : [...favorites, key];
	localStorage.setItem('infinity-favorites', JSON.stringify(favorites));
	updateFavorites();
	renderCards();
}));

searchInput.addEventListener('input', renderCards);
document.addEventListener('keydown', (event) => {
	if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
		event.preventDefault();
		searchInput.focus();
	}
});

updateFavorites();
renderCards();
