import { Controller, Get, NotFoundException, Param, ParseIntPipe } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AiAnalysisService } from './ai-analysis.service';

@ApiTags('AI Analysis')
@Controller('ai-analysis')
export class AiAnalysisController {
    constructor(private readonly aiAnalysisService: AiAnalysisService) { }

    @Get('solo-recording/:recordingId')
    async getBySoloRecordingId(
        @Param('recordingId', ParseIntPipe) recordingId: number,
    ) {
        const result =
            await this.aiAnalysisService.getSoloRecordingAnalysis(recordingId);

        if (!result) {
            throw new NotFoundException('Không tìm thấy AI analysis cho recording này');
        }

        return result;
    }
}