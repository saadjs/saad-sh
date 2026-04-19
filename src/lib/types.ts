export interface PostMetadata {
  title: string;
  description: string;
  date: string;
  tags: string[];
  published: boolean;
  image?: string;
}

export interface Post {
  slug: string;
  metadata: PostMetadata;
}
