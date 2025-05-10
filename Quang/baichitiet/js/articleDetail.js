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

  async function getCurrentUser() {
    try {
        const token = getCookie("token");
        console.log('getCurrentUser - Token from cookie:', token);

        if (!token) {
            console.log('No token found, user is unauthenticated');
            return null;
        }

        const payload = decodeJwt(token);
        console.log('getCurrentUser - Decoded payload:', payload);

        if (!payload) {
            console.log('Invalid token, treating as unauthenticated');
            return null;
        }

        const { id, username, role, avatar } = payload;
        console.log('Token payload:', { id, username, role, avatar });

        if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
            console.warn('Invalid ID format, treating as unauthenticated');
            return null;
        }

        const validationRes = await fetch('http://localhost:3000/api/validate-token', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${token.trim()}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ token })
        });

        console.log('getCurrentUser - Validation response status:', validationRes.status);

        if (!validationRes.ok) {
            const errorText = await validationRes.json();
            console.warn('Token validation failed:', errorText);
            if (validationRes.status === 401 || validationRes.status === 403) {
                console.log('Token blacklisted or invalid, treating as unauthenticated');
                return null;
            }
            throw new Error(`Token validation error: ${JSON.stringify(errorText)}`);
        }

        const validationData = await validationRes.json();
        if (!validationData.success) {
            console.log('Server rejected token, treating as unauthenticated');
            return null;
        }

        let userData = { id, username, role, avatar };
        try {
            const res = await fetch(`http://localhost:3000/api/users/${id}?_t=${Date.now()}`, {
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token.trim()}`
                }
            });

            if (!res.ok) {
                const errorText = await res.text();
                console.warn('API Error:', errorText);
                if (res.status === 403 || res.status === 401) {
                    console.warn('Permission or token issue, treating as unauthenticated');
                    return null;
                }
                throw new Error(`HTTP error! Status: ${res.status} - ${errorText}`);
            }

            const contentType = res.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                throw new Error('Response is not JSON');
            }

            const data = await res.json();
            console.log('User API Response:', data);
            const user = data.user || data;
            userData = {
                id,
                username: user.username !== undefined ? user.username : username,
                role: user.role !== undefined ? user.role : role,
                avatar: user.avatar !== undefined ? user.avatar : avatar
            };
        } catch (apiError) {
            console.warn('Falling back to token data due to API error:', apiError);
            return userData.id ? userData : null;
        }

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
  let slugOrId ;
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
    bookmarkButton.addEventListener('click', async () => {
      const user = await getCurrentUser();
      if (!user || !user.id) {
        alert('Bạn phải đăng nhập để thực hiện chức năng này');
        return;
      }
      if (!articleId || !token) {
        alert('Lỗi: Không tìm thấy bài viết hoặc token.');
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
      const user = await getCurrentUser(); // Fetch fresh user data
      console.log('Current user from token:', user); // Debug current user
      if (!user || !user.id) {
        console.warn('User ID not found in token, skipping view history.');
      } else {
        await fetch(`http://localhost:3000/api/articles/${articleId}/view/`, {
          method: 'POST',
          headers: {
            ...headers,
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify({ articleId, userId: user.id })
        });
        console.log('View history recorded successfully for user:', user.id);
      }
    } catch (error) {
      console.error('Lỗi khi ghi lịch sử xem:', error);
    }
  } else if (!token) {
    console.log('No token found, view history not recorded.');
  }

  // Split content into sections using both \r\n\r\n and \n\n
  const sections = article.content?.split(/(\r\n\r\n|\n\n)/).filter(section => section.trim().length > 0);
  const contentContainer = document.getElementById('article-content');
  contentContainer.innerHTML = '';

  if (sections.length > 2) {
    // First two sections
    for (let index = 0; index < 2; index++) {
      const section = sections[index];
      const sectionElement = document.createElement('div');
      sectionElement.className = 'dynamic-section';

      const lines = section.split(/(\r\n|\n)/).filter(line => line.trim().length > 0);
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

    // Insert thumbnail after the second section (single instance)
    const thumbnailContainer = document.createElement('div');
    thumbnailContainer.className = 'article-thumbnail';
    const thumbnailImg = document.createElement('img');
    thumbnailImg.src = article.thumbnail || '../image/img-sidebar/main-pic.png';
    thumbnailImg.alt = 'Article Thumbnail';
    thumbnailImg.style.maxWidth = '100%';
    thumbnailContainer.appendChild(thumbnailImg);
    contentContainer.appendChild(thumbnailContainer);

    // Hide default image container to avoid duplication
    const imgContainer = document.querySelector('.img-container');
    if (imgContainer) imgContainer.style.display = 'none';

    // Remaining sections
    for (let index = 2; index < sections.length; index++) {
      const section = sections[index];
      const sectionElement = document.createElement('div');
      sectionElement.className = 'dynamic-section';

      const lines = section.split(/(\r\n|\n)/).filter(line => line.trim().length > 0);
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

      const lines = section.split(/(\r\n|\n)/).filter(line => line.trim().length > 0);
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
      if (index === 0) {
        const imgContainer = document.querySelector('.img-container');
        if (imgContainer) imgContainer.style.display = 'block';
      }
    });

    // Update main image for 2 or fewer sections
    const mainImage = document.getElementById('main-image');
    if (mainImage) {
      mainImage.src = article.thumbnail || '../image/img-sidebar/main-pic.png';
      mainImage.alt = article.title || 'Hình ảnh bài viết';
    }
  }

  // Update caption and author (no image update here to avoid duplication)
  const imageCaption = document.getElementById('image-caption');
  if (imageCaption) imageCaption.textContent = 'Ảnh minh họa';
  const authorName = document.getElementById('author-name');
  if (authorName) authorName.textContent = article.UserID?.username || 'Tác giả';

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
            <img src="${item.thumbnail}" alt="${item.title}">
            <div class="news-text">
              <span class="category">${item.CategoryID?.name}</span>
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
            <img src="${item.thumbnail}" alt="${item.title}">
            <div class="news-text">
              <span class="category">${item.CategoryID?.name}</span>
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

    // Fetch comments when the page loads
    fetchComments(articleId);
  } catch (error) {
    console.error('Lỗi khi tải dữ liệu:', error);
    document.querySelector('.content-left').innerHTML = '<p>Lỗi khi tải bài viết. Vui lòng thử lại sau.</p>';
    document.getElementById('related-articles').innerHTML = '<p>Lỗi khi tải tin liên quan</p>';
    document.getElementById('other-articles').innerHTML = '<p>Lỗi khi tải tin khác</p>';
  }

  // Helper: Truncate text to fit within 3 lines
  function truncateTextToThreeLines(element, maxLines = 4) {
    const lineHeight = parseFloat(getComputedStyle(element).lineHeight); // Lấy chiều cao dòng
    const maxHeight = lineHeight * maxLines; // Tính chiều cao tối đa cho 3 dòng

    if (element.scrollHeight > maxHeight) {
      let originalText = element.textContent;
      while (element.scrollHeight > maxHeight && originalText.length > 0) {
        originalText = originalText.slice(0, -1); // Cắt bớt ký tự cuối
        element.textContent = originalText + '...'; // Thêm "..." vào cuối
      }
    }
  }

  // Áp dụng truncate cho các tiêu đề trong sidebar
  document.querySelectorAll('.news-text p').forEach(titleElement => {
    truncateTextToThreeLines(titleElement);
  });

  async function fetchComments(articleId, sort = 'most-relevant') {
    try {
        const response = await fetch(`http://localhost:3000/api/comments/article/${articleId}?sort=${sort}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const comments = await response.json();
        const commentsList = document.getElementById('comments-list');
        const commentCount = document.getElementById('comment-count');
        commentCount.textContent = comments.length;
        commentsList.innerHTML = '';

        const user = await getCurrentUser(); // Check if the user is logged in

        // Helper function to render comments recursively
        function renderComments(comments, parentElement) {
            comments.forEach(comment => {
                const commentItem = document.createElement('div');
                commentItem.className = 'comment-item';
                commentItem.innerHTML = `
                    <img src="${comment.UserID?.avatar || 'default-avatar.png'}" alt="Avatar">
                    <div class="comment-content">
                        <div class="comment-author">${comment.UserID?.username || 'Ẩn danh'}</div>
                        <div class="comment-text">${comment.content}</div>
                        <div class="comment-actions">
                            ${user ? `
                                <span class="reply-btn" data-id="${comment._id}">Trả lời</span>
                                ${user.id === comment.UserID?._id ? `
                                    <span class="edit-btn" data-id="${comment._id}">Sửa</span>
                                    <span class="delete-btn" data-id="${comment._id}">Xóa</span>
                                ` : ''}
                            ` : ''}
                            <span>${timeAgo(comment.created_at)}</span>
                        </div>
                    </div>
                `;

                parentElement.appendChild(commentItem);

                // Create a container for replies
                if (comment.replies && comment.replies.length > 0) {
                    const repliesContainer = document.createElement('div');
                    repliesContainer.className = 'comment-replies';
                    commentItem.appendChild(repliesContainer);
                    renderComments(comment.replies, repliesContainer); // Recursive call
                }
            });
        }

        renderComments(comments, commentsList);
    } catch (error) {
        console.error('Error fetching comments:', error);
        document.getElementById('comments-list').innerHTML = '<p>Lỗi khi tải bình luận.</p>';
    }
  }

  document.getElementById('comment-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const content = document.getElementById('comment-content').value.trim();
    if (!content) {
        alert('Nội dung bình luận không được để trống.');
        return;
    }
    try {
        const token = getCookie('token');
        if (!token) {
            alert('Bạn cần đăng nhập để bình luận.');
            return;
        }
        const response = await fetch('http://localhost:3000/api/comments/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ content, ArticleID: articleId })
        });
        if (!response.ok) throw new Error('Failed to submit comment');

        // Display success message in the UI
        const successMessage = document.createElement('p');
        successMessage.textContent = 'Bình luận của bạn đã được đăng!';
        successMessage.style.color = 'green';
        successMessage.style.marginTop = '10px';
        document.getElementById('comment-form').appendChild(successMessage);

        // Remove the success message after 3 seconds
        setTimeout(() => successMessage.remove(), 3000);

        fetchComments(articleId); // Refresh comments
    } catch (error) {
        console.error('Error submitting comment:', error);
        alert('Lỗi khi gửi bình luận.');
    }
    document.getElementById('comment-content').value = '';
  });

  document.getElementById('comments-list').addEventListener('click', async (e) => {
    const target = e.target;
    const commentId = target.dataset.id;

    if (target.classList.contains('reply-btn')) {
        // Check if a reply form already exists
        const existingReplyForm = document.querySelector(`#reply-form-${commentId}`);
        if (existingReplyForm) {
            existingReplyForm.remove(); // Remove the existing reply form
            return;
        }

        // Create a reply form
        const replyForm = document.createElement('form');
        replyForm.id = `reply-form-${commentId}`;
        replyForm.className = 'reply-form';
        replyForm.innerHTML = `
            <textarea placeholder="Viết phản hồi của bạn..." required></textarea>
            <div>
                <button type="submit" class="btn-submit-reply">Gửi</button>
                <button type="button" class="btn-cancel-reply">Hủy</button>
            </div>
        `;

        // Append the reply form directly below the comment actions
        const commentActions = target.closest('.comment-actions');
        commentActions.insertAdjacentElement('afterend', replyForm);

        // Handle reply form submission
        replyForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const content = replyForm.querySelector('textarea').value.trim();
            if (!content) {
                alert('Nội dung phản hồi không được để trống.');
                return;
            }
            try {
                const token = getCookie('token');
                if (!token) {
                    alert('Bạn cần đăng nhập để phản hồi.');
                    return;
                }
                const response = await fetch('http://localhost:3000/api/comments/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ content, ArticleID: articleId, CommentID: commentId })
                });
                if (!response.ok) throw new Error('Failed to submit reply');
                fetchComments(articleId);
            } catch (error) {
                console.error('Error submitting reply:', error);
                alert('Lỗi khi gửi phản hồi.');
            }
        });

        // Handle cancel button
        replyForm.querySelector('.btn-cancel-reply').addEventListener('click', () => {
            replyForm.remove();
        });
    } else if (target.classList.contains('edit-btn')) {
        // Check if an edit form already exists
        const existingEditForm = document.querySelector(`#edit-form-${commentId}`);
        if (existingEditForm) {
            existingEditForm.remove(); // Remove the existing edit form
            return;
        }

        // Create an edit form
        const editForm = document.createElement('form');
        editForm.id = `edit-form-${commentId}`;
        editForm.className = 'edit-form';
        const currentText = target.closest('.comment-content').querySelector('.comment-text').textContent.trim();
        editForm.innerHTML = `
            <textarea required>${currentText}</textarea>
            <div>
                <button type="submit" class="btn-submit-edit">Lưu</button>
                <button type="button" class="btn-cancel-edit">Hủy</button>
            </div>
        `;

        // Append the edit form directly below the comment actions
        const commentActions = target.closest('.comment-actions');
        commentActions.insertAdjacentElement('afterend', editForm);

        // Handle edit form submission
        editForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const newContent = editForm.querySelector('textarea').value.trim();
            if (!newContent) {
                alert('Nội dung sửa không được để trống.');
                return;
            }
            try {
                const token = getCookie('token');
                if (!token) {
                    alert('Bạn cần đăng nhập để sửa bình luận.');
                    return;
                }
                const response = await fetch(`http://localhost:3000/api/comments/${commentId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ content: newContent })
                });
                if (!response.ok) throw new Error('Failed to edit comment');
                fetchComments(articleId);
            } catch (error) {
                console.error('Error editing comment:', error);
                alert('Lỗi khi sửa bình luận.');
            }
        });

        // Handle cancel button
        editForm.querySelector('.btn-cancel-edit').addEventListener('click', () => {
            editForm.remove();
        });
    } else if (target.classList.contains('delete-btn')) {
      if (confirm('Bạn có chắc chắn muốn xóa bình luận này?')) {
        try {
          const token = getCookie('token');
          if (!token) {
            alert('Bạn cần đăng nhập để xóa bình luận.');
            return;
          }

          const response = await fetch(`http://localhost:3000/api/comments/${commentId}/`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (!response.ok) {
            const errorData = await response.json();
            console.error('Error deleting comment:', errorData);
            throw new Error(errorData.message || 'Failed to delete comment');
          }

          alert('Xóa bình luận thành công!');
          fetchComments(articleId); // Refresh comments
        } catch (error) {
          console.error('Error deleting comment:', error);
          alert('Lỗi khi xóa bình luận.');
        }
      }
    }
  });

  // Fetch comments when the page loads
  fetchComments(articleId);
});