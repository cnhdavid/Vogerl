document.addEventListener("DOMContentLoaded", () => {
    const apiKey = '1b0e9154b79b457f948d28fe91bf0c1e';
    const newsContainer = document.getElementById('newsContainer');

    async function fetchNews() {
        try {
            const response = await fetch(`https://newsapi.org/v2/top-headlines?language=en&pageSize=10&apiKey=${apiKey}`);
            const data = await response.json();

            if (data.status === 'ok') {
                displayNews(data.articles);
            } else {
                newsContainer.innerHTML = '<p>Failed to load news.</p>';
            }
        } catch (error) {
            newsContainer.innerHTML = '<p>Failed to load news.</p>';
        }
    }

    function displayNews(articles) {
        articles.forEach(article => {
            const articleElement = document.createElement('div');
            articleElement.className = 'column is-one-third';
            articleElement.innerHTML = `
                <div class="card">
                    <div class="card-image">
                        <figure class="image is-4by3">
                            <img src="${article.urlToImage || 'https://via.placeholder.com/300'}" alt="News image">
                        </figure>
                    </div>
                    <div class="card-content">
                        <div class="media">
                            <div class="media-content">
                                <p class="title is-4">${article.title}</p>
                                <p class="subtitle is-6">${article.source.name}</p>
                            </div>
                        </div>
                        <div class="content">
                            ${article.description || ''}
                            <br>
                            <a href="${article.url}" target="_blank">Read more</a>
                            <br>
                            <time datetime="${article.publishedAt}">${new Date(article.publishedAt).toLocaleDateString()}</time>
                        </div>
                    </div>
                </div>
            `;
            newsContainer.appendChild(articleElement);
        });
    }

    fetchNews();
});
