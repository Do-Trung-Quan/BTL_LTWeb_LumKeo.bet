const mongoose = require('mongoose');

const cascadeDeleteArticle = async (articleId) => {
  const Comment = mongoose.model('Comment');
  const Bookmark = mongoose.model('Bookmark');
  const ViewHistory = mongoose.model('ViewHistory');
  const Notification = mongoose.model('Notification');

  await Comment.deleteMany({ ArticleID: articleId });
  await Bookmark.deleteMany({ ArticleID: articleId });
  await ViewHistory.deleteMany({ ArticleID: articleId });
  await Notification.deleteMany({
    noti_entity_ID: articleId,
    noti_entity_type: 'Article',
  });
};

const cascadeDeleteUser = async (userId) => {
  const Article = mongoose.model('Article');
  const Comment = mongoose.model('Comment');
  const Bookmark = mongoose.model('Bookmark');
  const ViewHistory = mongoose.model('ViewHistory');
  const Notification = mongoose.model('Notification');

  const articles = await Article.find({ UserID: userId });
  for (const article of articles) {
    await Article.findOneAndDelete({ _id: article._id }); // Gọi middleware Article
  }

  await Comment.deleteMany({ UserID: userId });
  await Bookmark.deleteMany({ UserID: userId });
  await ViewHistory.deleteMany({ UserID: userId });
  await Notification.deleteMany({ UserID: userId });
};

const cascadeDeleteComment = async (commentId) => {
  const Comment = mongoose.model('Comment');
  const Notification = mongoose.model('Notification');

  await Comment.deleteMany({ CommentID: commentId });
  await Notification.deleteMany({
    noti_entity_ID: commentId,
    noti_entity_type: 'Comment',
  });
};

const cascadeDeleteCategory = async (categoryId) => {
  const Category = mongoose.model('Category');
  const Article = mongoose.model('Article');

  // Xóa Category con
  await Category.deleteMany({ parentCategory: categoryId });

  // Xóa các bài viết liên quan
  const articles = await Article.find({ CategoryID: categoryId });
  for (const article of articles) {
    await Article.findOneAndDelete({ _id: article._id }); // Gọi middleware Article
  }
};

module.exports = {
  cascadeDeleteArticle,
  cascadeDeleteUser,
  cascadeDeleteComment,
  cascadeDeleteCategory,
};
