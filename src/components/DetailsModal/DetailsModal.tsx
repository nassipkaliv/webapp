import type { Post } from '../../types/post';
import t from '../../locales/ru.json';

interface DetailsModalProps {
  post: Post;
  onClose: () => void;
}

function DetailsModal({ post, onClose }: DetailsModalProps) {
  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 px-4"
      onClick={onClose}
    >
      <div
        className="bg-[#373737] rounded-[20px] p-[clamp(16px,4vw,32px)] w-full max-w-[720px] flex flex-col gap-[clamp(12px,2vw,24px)] max-h-[70vh] relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center text-white/60 hover:text-white active:scale-90 transition-all z-10" onClick={onClose}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1 1L15 15M15 1L1 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
        <div className="flex-1 overflow-y-auto min-h-0 px-3 py-3">
          <div
            className="font-inter text-[14px] text-[#a6a6a6] leading-[140%] text-center"
            dangerouslySetInnerHTML={{ __html: post.detailsText || t.detailsModal.text1 }}
          />
        </div>
      </div>
    </div>
  );
}

export default DetailsModal;
