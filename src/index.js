import Notiflix from 'notiflix';
import NewsApiService from './js/news-service';
import SimpleLightbox from 'simplelightbox';
import 'simplelightbox/dist/simple-lightbox.min.css';

const refs = {
  form: document.querySelector('.search-form'),
  gallery: document.querySelector('.gallery'),
  loadMoreBtn: document.querySelector('.load-more'),
};

refs.form.addEventListener('submit', onFormSubmitSearchQuery);
refs.loadMoreBtn.addEventListener('click', onLoadMoreBtnClick);

const options = {
  root: null,
  rootMargin: '200px',
  threshold: 0,
};

const simpleLightboxOptions = {
  captionsData: 'alt',
  captionDelay: 250,
};

let observer = new IntersectionObserver(onLoad, options);

const gallerySet = new SimpleLightbox('.gallery a', simpleLightboxOptions);

const newsApiService = new NewsApiService();

function scroll() {
  const { height: cardHeight } = document
    .querySelector('.gallery')
    .firstElementChild.getBoundingClientRect();

  window.scrollBy({
    top: cardHeight * 2,
    behavior: 'smooth',
  });
}

function onLoad(entries, observer) {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      getFotoForUser()
        .then(data => {
          appendGalleryMurkup(data);
          if (
            data.totalHits === refs.gallery.children.length ||
            data.totalHits < refs.gallery.children.length
          ) {
            Notiflix.Notify.failure(`We're sorry, but you've reached the end of search results.`);
            refs.loadMoreBtn.classList.add('is-hidden');
            observer.unobserve(refs.loadMoreBtn);
          }
        })
        .catch(error => console.log('error'));
    }
  });
}


function onFormSubmitSearchQuery(e) {
  e.preventDefault();

  if (!e.currentTarget.elements.searchQuery.value) {
    return Notiflix.Notify.failure(
      `❌ "Sorry, there are no images matching your search query. Please try again."`
    );
  }

  clearGalleryContainer();

  refs.loadMoreBtn.classList.add('is-hidden');

  newsApiService.resetPage();
  
  newsApiService.request = e.currentTarget.elements.searchQuery.value;

  getFotoForUser()
    .then(createPageForUser)
    .catch(error => console.log('error'));
}

async function getFotoForUser() {
  return await newsApiService.getFoto();
}

function createPageForUser(data) {
  if (data.hits.length !== 0) {
    Notiflix.Notify.success(`Hooray! We found ${data.totalHits} images.`);
    appendGalleryMurkup(data);
    refs.loadMoreBtn.classList.remove('is-hidden');
    observer.observe(refs.loadMoreBtn);
  } else {
    Notiflix.Notify.failure(
      `❌ "Sorry, there are no images matching your search query. Please try again."`
    );
  }
  
}

async function onLoadMoreBtnClick() {
  getFotoForUser()
    .then(data => {
      appendGalleryMurkup(data);
      if (
        data.totalHits === refs.gallery.children.length ||
        data.totalHits < refs.gallery.children.length
      ) {
        Notiflix.Notify.failure(`We're sorry, but you've reached the end of search results.`);
        refs.loadMoreBtn.classList.add('is-hidden');
      }
    })
    .catch(error => console.log('error'));
  scroll();
}

function appendGalleryMurkup(data) {
  refs.gallery.insertAdjacentHTML('beforeend', createMurkup(data));
  gallerySet.refresh();
}

function clearGalleryContainer() {
  refs.gallery.innerHTML = '';
}

function createMurkup(data) {
  const dataForMurcup = data.hits;
  return dataForMurcup
    .map(({ webformatURL, largeImageURL, tags, likes, views, comments, downloads }) => {
      return `
<div class="photo-card">
<a href="${largeImageURL}"><img src="${webformatURL}" alt="${tags}" loading="lazy" title="" width="290px" height="190px"/></a>
  <div class="info">
    <p class="info-item">
      <b>Likes</b><span>${likes}</span>
    </p>
    <p class="info-item">
      <b>Views</b><span>${views}</span>
    </p>
    <p class="info-item">
      <b>Comments</b><span>${comments}</span>
    </p>
    <p class="info-item">
      <b>Downloads</b><span>${downloads}</span>
    </p>
  </div>
</div>
`;
      
    })
    .join('');
  
}

