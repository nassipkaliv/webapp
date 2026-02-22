export interface Post {
  id: number;
  title: string;
  description: string;
  whyTitle: string;
  whyItems: string[];
  imageUrl: string;
  telegramLink: string;
  whatsappLink: string;
  instagramLink: string;
  detailsText: string;
  likeCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
