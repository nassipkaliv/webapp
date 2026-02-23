import { useState, forwardRef } from 'react';
import type { Post } from '../../types/post';
import { likePost, unlikePost, getImageUrl } from '../../api/posts';
import t from '../../locales/ru.json';

interface PostCardProps {
  post: Post;
  onDetailsClick?: (post: Post) => void;
}

const PostCard = forwardRef<HTMLDivElement, PostCardProps>(function PostCard({ post, onDetailsClick }, ref) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likeCount);

  const hasImage = post.imageUrl && post.imageUrl.length > 0;

  const handleLike = async () => {
    const newLiked = !liked;
    setLiked(newLiked);
    setLikeCount(prev => newLiked ? prev + 1 : prev - 1);
    try {
      if (newLiked) {
        await likePost(post.id);
      } else {
        await unlikePost(post.id);
      }
    } catch {
      setLiked(!newLiked);
      setLikeCount(prev => newLiked ? prev - 1 : prev + 1);
    }
  };

  return (
    <div ref={ref} data-post-id={post.id} className="bg-[#232227] rounded-[clamp(12px,1.5vw,20px)] py-[clamp(12px,1.5vw,24px)] px-[clamp(10px,1.3vw,20px)] flex flex-col gap-[clamp(12px,1.5vw,24px)]">
      {hasImage && (
        <div className="w-full rounded-[12px] overflow-hidden">
          <img
            src={getImageUrl(post.imageUrl)}
            alt=""
            className="w-full h-auto object-contain"
          />
        </div>
      )}

      <div
        className="font-inter text-[clamp(13px,1.4vw,16px)] text-white leading-[140%]"
        dangerouslySetInnerHTML={{ __html: post.description }}
      />

      {onDetailsClick && post.detailsText && (
        <button
          className="w-full py-2 rounded-[7px] bg-[#575757] font-inter font-bold text-[10px]! text-white text-center active:scale-[0.97] transition-transform duration-100 leading-[150%]"
          onClick={() => onDetailsClick(post)}
        >
          {t.post.detailsButton}
        </button>
      )}

      <button
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all duration-200 active:scale-95"
        onClick={handleLike}
      >
        <svg width="20" height="19" viewBox="0 0 25 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          {liked ? (
            <>
              <path d="M12.6321 23.3645C13.3989 23.3645 19.3234 18.3257 22.7806 14.1808C26.1064 10.1923 24.9061 5.4827 24.1747 4.17194C23.3099 2.62362 12.3091 7.71662 12.3091 7.71662C12.3091 7.71662 2.06056 1.95886 1.29369 3.20919C0.253834 4.90547 -1.2028 9.36705 1.73756 13.5161C4.85921 17.9235 11.8089 23.3645 12.6321 23.3645Z" fill="#DB0A28" />
              <path d="M12.58 22.0081C12.58 22.0081 23.4703 13.9476 24.406 9.02549C25.2916 4.36385 23.4787 2.10284 21.2468 1.01297C15.5891 -1.75025 12.7342 3.672 12.4653 3.672C12.1965 3.672 9.5375 -1.76067 4.06731 0.589947C1.05402 1.88404 -0.208807 5.40579 0.985256 9.3735C2.7378 15.1959 12.58 22.0081 12.58 22.0081Z" fill="#FF262E" />
            </>
          ) : (
            <path d="M12.58 22.0081C12.58 22.0081 23.4703 13.9476 24.406 9.02549C25.2916 4.36385 23.4787 2.10284 21.2468 1.01297C15.5891 -1.75025 12.7342 3.672 12.4653 3.672C12.1965 3.672 9.5375 -1.76067 4.06731 0.589947C1.05402 1.88404 -0.208807 5.40579 0.985256 9.3735C2.7378 15.1959 12.58 22.0081 12.58 22.0081Z" fill="none" stroke="white" strokeWidth="1.5" />
          )}
        </svg>
        <span className={`font-inter font-bold text-[12px] leading-[125%] ${liked ? 'text-[#FF262E]' : 'text-white'}`}>
          {likeCount}
        </span>
      </button>
    </div>
  );
});

export default PostCard;
