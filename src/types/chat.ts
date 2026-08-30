export type ParticipantPair = [string, string];

export type Conversation = {
  id: string;
  participants: ParticipantPair;
  createdAt: number;
  updatedAt: number;
};

export type ChatMessage = {
  id: string;
  conversationId: string;
  senderId: string;
  receiverId: string;
  text: string;
  createdAt: number;
};
