import { Processor, WorkerHost } from '@nestjs/bullmq';
import { EmbeddingService } from '../services/embedding.service';
import { Job } from 'bullmq';

@Processor('recommendation')
export class EmbeddingProcessor extends WorkerHost {
  constructor(private readonly embedding: EmbeddingService) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    switch (job.name) {
      case 'candidate.embedding.update': {
        await this.embedding.updateCandidateEmbedding(job.data);
        break;
      }

      default:
        break;
    }
  }
}
