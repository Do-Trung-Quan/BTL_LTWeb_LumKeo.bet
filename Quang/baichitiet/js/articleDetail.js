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

  // Helper: Decode JWT
  function decodeJwt(token) {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
          })
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Error decoding JWT:', error);
      return null;
    }
  }

  // Helper: Get current user
  async function getCurrentUser() {
    try {
      const token = getCookie('token');
      console.log('Token:', token);
      if (!token) {
        console.warn('No token found, user not authenticated');
        return null;
      }

      const payload = decodeJwt(token);
      if (!payload) {
        throw new Error('Token không hợp lệ!');
      }

      const { id, username, role, avatar } = payload;
      console.log('User ID:', id);
      console.log('User Name:', username);
      console.log('User Role:', role);

      let userData = { id, username, role, avatar };
      return userData;
    } catch (error) {
      console.error('getCurrentUser Error:', error);
      return null;
    }
  }

  // Set user icon behavior based on authentication
  function setUserIconBehavior(user) {
    const userIcons = document.querySelectorAll('.account-button'); // Target all account buttons
    if (userIcons.length === 0) {
      console.error('User icon (account-button) not found');
      return;
    }

    userIcons.forEach(userIcon => {
      if (!user) {
        userIcon.href = 'http://127.0.0.1:5500/Hi-Tech/Login.html';
        userIcon.addEventListener('click', (e) => {
          console.log('Redirecting to login page');
        });
      } else {
        let redirectPage;
        switch (user.role?.toLowerCase()) {
          case 'admin':
            redirectPage = '../../../Thuy + DucMinh/ADMIN_QLBB.html';
            break;
          case 'author':
            redirectPage = '../../../Thuy + DucMinh/AUTHOR_QLBV.html';
            break;
          case 'user':
            redirectPage = '../../../Thuy + DucMinh/USER_BBDL.html';
            break;
          default:
            redirectPage = 'http://127.0.0.1:5500/Hi-Tech/Login.html';
            console.warn('Unknown role:', user.role);
        }
        userIcon.href = redirectPage;
        userIcon.addEventListener('click', (e) => {
          console.log(`Redirecting to ${redirectPage} for role: ${user.role}`);
        });
      }
    });
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
  let slug;
  const urlParams = new URLSearchParams(window.location.search);
  slugOrId = urlParams.get('slug');

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

  // Fetch user data and set icon behavior
  const user = await getCurrentUser();
  setUserIconBehavior(user);

  let articleId, articleSlug; // Will be set after fetching article data

  try {
    // 1. Fetch article details
    let articleResponse;
    let article;

    if (urlParams.has('slug')) {
      // Fetch article ID by slug
      const slugToIdResponse = await fetch(`http://localhost:3000/api/articles/slug-to-id/${slugOrId}`, {
        headers,
        credentials: 'include'
      });
      if (!slugToIdResponse.ok) {
        const errorText = await slugToIdResponse.text();
        console.error('Error fetching article ID by slug:', errorText);
        throw new Error('Lỗi khi ánh xạ slug: ' + slugToIdResponse.statusText);
      }
      const slugData = await slugToIdResponse.json();
      console.log('Slug to ID response:', slugData); // Debug the response
      articleId = slugData.data?.articleId; // Extract from nested data
      if (!articleId) {
        throw new Error('Không tìm thấy ID bài viết với slug: ' + slugOrId);
      }

      // Fetch full article details by ID
      articleResponse = await fetch(`http://localhost:3000/api/articles/${articleId}/`, {
        headers,
        credentials: 'include'
      });
      if (!articleResponse.ok) {
        const errorText = await articleResponse.text();
        console.error('Error fetching article by ID:', errorText);
        throw new Error('Lỗi khi tải bài viết: ' + articleResponse.statusText);
      }
      const articleData = await articleResponse.json();
      console.log('Article data response:', articleData); // Debug the article response
      article = articleData; // Extract from nested data
      if (!article) {
        throw new Error('Không tìm thấy bài viết với ID: ' + articleId);
      }
      articleSlug = article.slug;
    } else {
      // Fetch by ID if articleId is present
      articleResponse = await fetch(`http://localhost:3000/api/articles/${slugOrId}/`, {
        headers,
        credentials: 'include'
      });
      if (!articleResponse.ok) {
        const errorText = await articleResponse.text();
        console.error('Error fetching article by ID:', errorText);
        throw new Error('Lỗi khi tải bài viết: ' + articleResponse.statusText);
      }
      const articleData = await articleResponse.json();
      article = articleData.data;
      if (!article) {
        throw new Error('Không tìm thấy bài viết với ID: ' + slugOrId);
      }
      articleId = article._id;
      articleSlug = article.slug;
      // Redirect to slug-based URL
      window.location.href = `http://127.0.0.1:5500/Quang/baichitiet/html/baichitiet.html?slug=${articleSlug}`;
      return; // Exit to allow redirect
    }

    // Update main article metadata
    const categoryLink = document.getElementById('category-link');
    categoryLink.innerHTML = `${article.CategoryID?.name || 'Danh mục'}<i class="fas fa-chevron-right"></i>`;

    const categorySlug = article.CategoryID?.slug || 'default';
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

    document.getElementById('article-title').textContent = article.title || 'Tiêu đề không khả dụng';
    document.getElementById('article-meta').innerHTML = `<strong>${article.UserID?.username || 'Tác giả'}</strong> - ${timeAgo(article.updated_at)}`;
    document.getElementById('article-highlight').textContent = article.summary || 'Không có nội dung nổi bật';

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
    const sections = article.content?.split('\n\n') || ['Nội dung không khả dụng'];
    const contentContainer = document.getElementById('article-content');
    contentContainer.innerHTML = '';

    if (sections.length > 2) {
      // First two sections
      for (let index = 0; index < 2; index++) {
        const section = sections[index];
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
      }

      // Insert thumbnail after the second section
      const thumbnailContainer = document.createElement('div');
      thumbnailContainer.className = 'article-thumbnail';
      const thumbnailImg = document.createElement('img');
      thumbnailImg.src = article.thumbnail || '../image/img-sidebar/main-pic.png';
      thumbnailImg.alt = 'Article Thumbnail';
      thumbnailImg.style.maxWidth = '100%';
      thumbnailContainer.appendChild(thumbnailImg);
      contentContainer.appendChild(thumbnailContainer);

      // Remaining sections
      for (let index = 2; index < sections.length; index++) {
        const section = sections[index];
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

        contentContainer.appendChild(sectionElement);
      }
    } else {
      // Original logic for 2 or fewer sections
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
    }

    // Update image
    document.getElementById('main-image').src = article.thumbnail || '../image/img-sidebar/main-pic.png';
    document.getElementById('main-image').alt = article.title || 'Hình ảnh bài viết';
    document.getElementById('image-caption').textContent = 'Ảnh minh họa';
    document.getElementById('author-name').textContent = article.UserID?.username || 'Tác giả';

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
      console.log('Related articles response:', relatedArticles); // Debug related articles
      
      if (Array.isArray(articles)) {
        articles.forEach(item => {
          const articleElement = document.createElement('a');
          articleElement.href = `./baichitiet.html?slug=${item.slug}`;
          articleElement.className = 'news-item';
          articleElement.innerHTML = `
            <img src="${item.thumbnail || '../image/img-sidebar/item1.png'}" alt="${item.title}">
            <div class="news-text">
              <span class="category">${item.CategoryID?.name || 'Danh mục'}</span>
              <p>${item.title}</p>
              <small>${item.UserID?.username || 'Tác giả'} - ${timeAgo(item.updated_at)}</small>
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

    // 3. Fetch other articles (all approved posts, different category)
    const otherArticlesContainer = document.getElementById('other-articles');
    otherArticlesContainer.innerHTML = '';
    
    const currentCategoryId = article.CategoryID?._id;
    
    // Không giới hạn số lượng khi fetch
    const otherResponse = await fetch(`http://localhost:3000/api/articles?limit=0`, {
      headers,
      credentials: 'include'
    });
    
    if (otherResponse.ok) {
      const otherArticles = await otherResponse.json();
      const articles = otherArticles.data?.articles || [];
      console.log('Other articles response:', otherArticles); // Debug
    
      // Lọc các bài viết khác category hiện tại
      const filteredArticles = articles.filter(item => item.CategoryID?._id !== currentCategoryId);
      console.log('Filtered articles:', filteredArticles); // Debug
    
      // Lấy tối đa 4 bài
      const selectedArticles = filteredArticles.slice(0, 4);
    
      if (selectedArticles.length > 0) {
        selectedArticles.forEach(item => {
          const articleElement = document.createElement('a');
          articleElement.href = `./baichitiet.html?slug=${item.slug}`;
          articleElement.className = 'news-item';
          articleElement.innerHTML = `
            <img src="${item.thumbnail || '../image/img-sidebar/default.png'}" alt="${item.title}">
            <div class="news-text">
              <span class="category">${item.CategoryID?.name || 'Không xác định'}</span>
              <p>${item.title}</p>
              <small>${item.UserID?.username || 'Tác giả'} - ${timeAgo(item.updated_at)}</small>
            </div>
          `;
          otherArticlesContainer.appendChild(articleElement);
        });
      } else {
        otherArticlesContainer.innerHTML = '<p>Không có bài viết khác thuộc danh mục khác</p>';
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