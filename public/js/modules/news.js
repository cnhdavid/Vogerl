import { checkToken } from "./auth.js"; // Import the checkToken function from the auth module
import { populateNavbar } from "../app.js"; // Import the populateNavbar function from the app module

// Add an event listener for the DOMContentLoaded event to ensure the DOM is fully loaded
document.addEventListener("DOMContentLoaded", () => {
  const apiKey = "1b0e9154b79b457f948d28fe91bf0c1e"; // Define the API key for the news API
  const newsContainer = document.getElementById("newsContainer"); // Get the container element for the news articles
  const token = localStorage.getItem("token"); // Retrieve the token from localStorage

  /**
   * Fetches the latest news articles from the news API.
   */
  async function fetchNews() {
    try {
      // Make a GET request to the news API for the top headlines
      const response = await fetch(
        `https://newsapi.org/v2/top-headlines?language=en&pageSize=10&apiKey=${apiKey}`
      );
      const data = await response.json(); // Parse the response as JSON

      if (data.status === "ok") {
        displayNews(data.articles); // Call displayNews to show the articles if the response is successful
      } else {
        newsContainer.innerHTML = "<p>Failed to load news.</p>"; // Display an error message if the API response is not 'ok'
      }
    } catch (error) {
      newsContainer.innerHTML = "<p>Failed to load news.</p>"; // Display an error message if the fetch request fails
    }
  }

  /**
   * Displays the news articles in the news container.
   * @param {Array} articles - The list of news articles to display.
   */
  function displayNews(articles) {
    articles.forEach((article) => {
      const articleElement = document.createElement("div"); // Create a new div element for each article
      articleElement.className = "column is-one-third"; // Set the class for styling
      articleElement.innerHTML = `
                <div class="card">
                    <div class="card-image">
                        <figure class="image is-4by3">
                            <img src="${
                              article.urlToImage ||
                              "https://via.placeholder.com/300"
                            }" alt="News image">
                        </figure>
                    </div>
                    <div class="card-content">
                        <div class="media">
                            <div class="media-content">
                                <p class="title is-4">${article.title}</p>
                                <p class="subtitle is-6">${
                                  article.source.name
                                }</p>
                            </div>
                        </div>
                        <div class="content">
                            ${article.description || ""}
                            <br>
                            <a href="${
                              article.url
                            }" target="_blank">Read more</a>
                            <br>
                            <time datetime="${article.publishedAt}">${new Date(
        article.publishedAt
      ).toLocaleDateString()}</time>
                        </div>
                    </div>
                </div>
            `; // Set the inner HTML of the article element with the article's data
      newsContainer.appendChild(articleElement); // Append the article element to the news container
    });
  }

  fetchNews(); // Call fetchNews to load the news articles when the page is loaded

  populateNavbar(checkToken()); // Populate the navbar based on the user's authentication status
});
