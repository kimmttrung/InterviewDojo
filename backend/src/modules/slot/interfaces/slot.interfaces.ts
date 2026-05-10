export interface SlotResponse {
  id: number;
  mentorId: number;
  startTime: Date;
  endTime: Date;
  status: string;
  createdAt: Date;
}

export interface BatchPayloadResponse {
  count: number;
}
