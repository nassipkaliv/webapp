export type BotStep =
  | 'idle'
  | 'awaiting_title'
  | 'awaiting_description'
  | 'awaiting_why_title'
  | 'awaiting_why_items'
  | 'awaiting_image'
  | 'awaiting_details_text'
  | 'awaiting_telegram_link'
  | 'awaiting_whatsapp_link'
  | 'awaiting_instagram_link'
  | 'confirm_create'
  | 'awaiting_edit_field'
  | 'awaiting_edit_value'
  | 'awaiting_delete_confirm';

export interface BotSession {
  step: BotStep;
  postDraft: {
    title?: string;
    description?: string;
    whyTitle?: string;
    whyItems?: string[];
    imageUrl?: string;
    detailsText?: string;
    telegramLink?: string;
    whatsappLink?: string;
    instagramLink?: string;
  };
  editPostId?: number;
  editField?: string;
}

const sessions = new Map<number, BotSession>();

export function getSession(chatId: number): BotSession {
  if (!sessions.has(chatId)) {
    sessions.set(chatId, { step: 'idle', postDraft: {} });
  }
  return sessions.get(chatId)!;
}

export function resetSession(chatId: number) {
  sessions.set(chatId, { step: 'idle', postDraft: {} });
}
