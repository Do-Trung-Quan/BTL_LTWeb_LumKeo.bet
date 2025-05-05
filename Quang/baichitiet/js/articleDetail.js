document.addEventListener('DOMContentLoaded', async () => {
    // Helper: Get cookie
    function getCookie(name) {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop().split(';').shift();
      return null;
    }
  
    // Helper: Format time ago
    function timeAgo(date) {
      const now = new Date();
      const diff = now - new Date(date);
      const hours = Math.floor(diff / (1000 * 60 * 60));
      if (hours < 1) return 'Vừa xong';
      if (hours < 24) return `${hours} giờ trước`;
      const days = Math.floor(hours / 24);
      return `${days} ngày trước`;
    }
  
    // Mapping of league slugs to actual page filenames
    const leaguePageMap = {
      'v-league': 'giaidau-vleague',
      'ligue-1': 'giaidau-l1',
      'bundesliga': 'giaidau-bundes',
      'serie-a': 'giaidau-seria',
      'la-liga': 'giaidau-LaLiga',
      'premier-league': 'giaidau-EPL'
    };
  
    // Mapping of category slugs to actual page filenames
    const categoryPageMap = {
      'bong-da-viet-nam': 'bongdaVN',
      'bong-da-the-gioi': 'bongdaTG'
    };
  
    // Log the URL for debugging
    console.log('Current URL:', window.location.href);
    console.log('Query Parameters:', window.location.search);
    console.log('Hash:', window.location.hash);
  
    // Get slug or articleId from URL
    let slugOrId;
    const urlParams = new URLSearchParams(window.location.search);
    slugOrId = urlParams.get('slug') || urlParams.get('articleId');
  
    if (!slugOrId) {
      console.warn('No slug or articleId found in URL, using fallback ID for testing.');
      slugOrId = '6811d4b49799e9cb99c64691'; // Fallback ID
      alert('Không tìm thấy slug hoặc ID bài viết trong URL. Sử dụng ID mặc định để thử nghiệm.');
    }
  
    console.log('Initial slugOrId:', slugOrId);
  
    const token = getCookie('token');
    const headers = {
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  
    let articleId, articleSlug; // Will be set after fetching article data
  
    try {
      // 1. Fetch article details
      let articleResponse;
      let article;
  
      if (urlParams.has('slug')) {
        // If URL has slug, fetch by slug (temporary fallback to ID until slug endpoint exists)
        // First, we need to get the article ID from the slug by fetching all articles or via a mapping
        // For now, we'll fetch by ID after mapping slug to ID (requires backend change later)
        // Since slug endpoint doesn't exist, we'll fetch all articles to find the ID
        const allArticlesResponse = await fetch(`http://localhost:3000/api/articles/?limit=1000`, {
          headers,
          credentials: 'include'
        });
        if (!allArticlesResponse.ok) {
          throw new Error('Lỗi khi tải danh sách bài viết: ' + allArticlesResponse.statusText);
        }
        const allArticlesData = await allArticlesResponse.json();
        const allArticles = Array.isArray(allArticlesData) ? allArticlesData : allArticlesData.articles || [];
        article = allArticles.find(a => a.slug === slugOrId);
        if (!article) {
          throw new Error('Không tìm thấy bài viết với slug: ' + slugOrId);
        }
        articleId = article._id;
        articleSlug = article.slug;
      } else {
        // Fetch by ID if articleId is present
        articleResponse = await fetch(`http://localhost:3000/api/articles/${slugOrId}/`, {
          headers,
          credentials: 'include'
        });
        if (!articleResponse.ok) {
          throw new Error('Lỗi khi tải bài viết: ' + articleResponse.statusText);
        }
        const articleData = await articleResponse.json();
        article = articleData.article || articleData;
        articleId = article._id;
        articleSlug = article.slug;
        // Redirect to slug-based URL
        window.location.href = `http://127.0.0.1:5500/Quang/baichitiet/html/baichitiet.html?slug=${articleSlug}`;
        return; // Exit to allow redirect
      }
  
      // Update main article metadata
      const categoryLink = document.getElementById('category-link');
      categoryLink.innerHTML = `${article.CategoryID?.name}<i class="fas fa-chevron-right"></i>`;
  
      const categorySlug = article.CategoryID?.slug;
      let pageFileName;
      if (article.CategoryID?.type === 'League') {
        pageFileName = leaguePageMap[categorySlug] || `giaidau-${categorySlug}`;
        categoryLink.href = `http://127.0.0.1:5500/Quang/giaidau/html/${pageFileName}.html?slug=${categorySlug}`;
      } else if (article.CategoryID?.type === 'Category') {
        pageFileName = categoryPageMap[categorySlug] || `category-${categorySlug}`;
        categoryLink.href = `http://127.0.0.1:5500/Quang/giaidau/html/${pageFileName}.html?slug=${categorySlug}`;
      } else {
        pageFileName = `category-${categorySlug}`;
        categoryLink.href = `http://127.0.0.1:5500/Quang/giaidau/html/${pageFileName}.html?slug=${categorySlug}`;
      }
  
      console.log('Category type:', article.CategoryID?.type);
      console.log('Category slug:', categorySlug);
      console.log('Mapped page filename:', pageFileName);
      console.log('Breadcrumb link:', categoryLink.href);
      console.log('Article ID:', articleId);
      console.log('Article slug:', articleSlug);
  
      // Add bookmark button next to title
      const titleContainer = document.getElementById('article-title');
      const bookmarkButton = document.createElement('button');
      bookmarkButton.innerHTML = '<i class="fas fa-bookmark"></i>';
      bookmarkButton.className = 'bookmark-btn';
      bookmarkButton.style.marginLeft = '10px';
      bookmarkButton.style.border = 'none';
      bookmarkButton.style.background = 'none';
      bookmarkButton.style.cursor = 'pointer';
      bookmarkButton.style.fontSize = '20px';
      bookmarkButton.addEventListener('click', async () => {
        if (!articleId || !token) {
          alert('Vui lòng đăng nhập để thêm bookmark.');
          return;
        }
        try {
          const response = await fetch('http://localhost:3000/api/bookmarks', {
            method: 'POST',
            headers,
            credentials: 'include',
            body: JSON.stringify({ articleId })
          });
          if (response.ok) {
            alert('Đã thêm bookmark thành công!');
          } else {
            const errorData = await response.json();
            alert('Lỗi khi thêm bookmark: ' + (errorData.message || 'Không xác định'));
          }
        } catch (error) {
          console.error('Lỗi khi gọi API bookmark:', error);
          alert('Lỗi khi thêm bookmark. Vui lòng thử lại.');
        }
      });
      titleContainer.parentNode.insertBefore(bookmarkButton, titleContainer.nextSibling);
  
      document.getElementById('article-title').textContent = article.title;
      document.getElementById('article-meta').innerHTML = `<strong>${article.UserID?.username}</strong> - ${timeAgo(article.updated_at)}`;
      document.getElementById('article-highlight').textContent = article.summary;
  
      // Record view history
      if (articleId && token) {
        try {
          await fetch(`http://localhost:3000/api/articles/${articleId}/view/`, {
            method: 'POST',
            headers,
            credentials: 'include'
          });
          console.log('View history recorded successfully.');
        } catch (error) {
          console.error('Lỗi khi ghi lịch sử xem:', error);
        }
      }
  
      // Split content into sections using \n\n
      const sections = article.content?.split('\n\n');
      const contentContainer = document.getElementById('article-content');
      contentContainer.innerHTML = '';
  
      sections.forEach((section, index) => {
        const sectionElement = document.createElement('div');
        sectionElement.className = 'dynamic-section';
  
        const lines = section.split('\n');
        if (lines.length > 1 && lines[0].length < 100) {
          const heading = document.createElement('h3');
          heading.textContent = lines[0];
          sectionElement.appendChild(heading);
  
          lines.slice(1).forEach(line => {
            if (line.trim()) {
              const para = document.createElement('p');
              para.textContent = line;
              sectionElement.appendChild(para);
            }
          });
        } else {
          lines.forEach(line => {
            if (line.trim()) {
              const para = document.createElement('p');
              para.textContent = line;
              sectionElement.appendChild(para);
            }
          });
        }
  
        if (index === 0) {
          contentContainer.appendChild(sectionElement);
          const imgContainer = document.querySelector('.img-container');
          imgContainer.style.display = 'block';
        } else {
          contentContainer.appendChild(sectionElement);
        }
      });
  
      // Update image
      document.getElementById('main-image').src = article.thumbnail;
      document.getElementById('main-image').alt = article.title;
      document.getElementById('image-caption').textContent = 'Ảnh minh họa';
      document.getElementById('author-name').textContent = article.UserID?.username;
  
      // 2. Fetch related articles (same category)
      const relatedArticlesContainer = document.getElementById('related-articles');
      relatedArticlesContainer.innerHTML = '';
  
      const relatedResponse = await fetch(`http://localhost:3000/api/articles/category/${article.CategoryID?._id}?limit=4`, {
        headers,
        credentials: 'include'
      });
  
      if (relatedResponse.ok) {
        const relatedArticles = await relatedResponse.json();
        const articles = relatedArticles.data?.articles || [];
        
        if (Array.isArray(articles)) {
          articles.forEach(item => {
            const articleElement = document.createElement('a');
            articleElement.href = `./baichitiet.html?slug=${item.slug}`;
            articleElement.className = 'news-item';
            articleElement.innerHTML = `
              <img src="${item.thumbnail}" alt="${item.title}">
              <div class="news-text">
                <span class="category">${item.CategoryID?.name}</span>
                <p>${item.title}</p>
                <small>${item.UserID?.username} - ${timeAgo(item.updated_at)}</small>
              </div>
            `;
            relatedArticlesContainer.appendChild(articleElement);
          });
        } else {
          relatedArticlesContainer.innerHTML = '<p>Không có bài viết liên quan</p>';
        }
      } else {
        relatedArticlesContainer.innerHTML = '<p>Không tải được tin liên quan</p>';
      }
  
      // 3. Fetch other articles (all approved posts)
      const otherArticlesContainer = document.getElementById('other-articles');
      otherArticlesContainer.innerHTML = '';
  
      const otherResponse = await fetch(`http://localhost:3000/api/articles/?limit=4&sort=-updated_at`, {
        headers,
        credentials: 'include'
      });
  
      if (otherResponse.ok) {
        const otherArticles = await otherResponse.json();
        const articles = Array.isArray(otherArticles) ? otherArticles : [];
        
        if (articles.length > 0) {
          articles.forEach(item => {
            const articleElement = document.createElement('a');
            articleElement.href = `./baichitiet.html?slug=${item.slug}`;
            articleElement.className = 'news-item';
            articleElement.innerHTML = `
              <img src="${item.thumbnail}" alt="${item.title}">
              <div class="news-text">
                <span class="category">${item.CategoryID?.name}</span>
                <p>${item.title}</p>
                <small>${item.UserID?.username} - ${timeAgo(item.updated_at)}</small>
              </div>
            `;
            otherArticlesContainer.appendChild(articleElement);
          });
        } else {
          otherArticlesContainer.innerHTML = '<p>Không có bài viết khác</p>';
        }
      } else {
        otherArticlesContainer.innerHTML = '<p>Không tải được tin khác</p>';
      }
    } catch (error) {
      console.error('Lỗi khi tải dữ liệu:', error);
      document.querySelector('.content-left').innerHTML = '<p>Lỗi khi tải bài viết. Vui lòng thử lại sau.</p>';
      document.getElementById('related-articles').innerHTML = '<p>Lỗi khi tải tin liên quan</p>';
      document.getElementById('other-articles').innerHTML = '<p>Lỗi khi tải tin khác</p>';
    }
  });