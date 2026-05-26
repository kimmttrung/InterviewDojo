import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';

import axios, { AxiosError } from 'axios';

@Injectable()
export class JinaService {
  private readonly logger = new Logger(JinaService.name);

  private readonly apiUrl = 'https://api.jina.ai/v1/embeddings';

  private readonly model = 'jina-embeddings-v3';

  async embedding(text: string): Promise<number[]> {
    if (!text?.trim()) {
      return [];
    }

    try {
      const response = await axios.post(
        this.apiUrl,

        {
          model: this.model,

          input: [text],
        },

        {
          headers: {
            Authorization: `Bearer ${process.env.JINA_API_KEY}`,

            'Content-Type': 'application/json',
          },

          timeout: 15_000,
        },
      );

      const embedding = response.data?.data?.[0]?.embedding;

      if (!embedding || !Array.isArray(embedding)) {
        throw new Error('Invalid embedding response');
      }

      return embedding;
    } catch (error) {
      const err = error as AxiosError;

      this.logger.error(
        'Jina embedding failed',

        err.response?.data ?? err.message,
      );

      throw new InternalServerErrorException('Embedding generation failed');
    }
  }
}
