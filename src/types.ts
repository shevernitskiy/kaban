export type MessageId = number;

export type StreamInfo = {
  online: boolean;
  title: string;
  category: string;
  start_time: number;
  preview?: string;
  viewers: number;
  likes?: number;
};

export type PostState = {
  id: number;
  title?: string;
};
