export type FeedAuthor = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
};

export type FeedPost = {
  id: string;
  text: string;
  imageUrl: string | null;
  createdAt: string;
  author: FeedAuthor;
  visibility: "public" | "private";
  likeCount: number;
  likedByMe: boolean;
  likedByUsers: FeedAuthor[];
  commentCount: number;
  isAuthor: boolean;
};
