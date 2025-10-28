import { Catch, ExceptionFilter, ArgumentsHost, HttpStatus } from '@nestjs/common';
import { Response } from 'express';

@Catch(Error)
export class CustomErrorFilter implements ExceptionFilter {
    catch(exception: Error, host: ArgumentsHost) {
        // 413
        if (exception.message && exception.message.includes('request entity too large')) {
            const ctx = host.switchToHttp();
            const response = ctx.getResponse<Response>();
            const errorResponse = {
                statusCode: 413,
                code: 'DATA_TO_LARGE',
                message: `한 요청당 제한된 크기를 초과하였습니다. [최대 15Mb]`,
            };

            return response.status(HttpStatus.PAYLOAD_TOO_LARGE).send(errorResponse);
        }

        // 다른 예외 처리
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        if (exception['response']) {
            exception['response']['statusCode'] = exception['status'];
            return response.status(exception['status']).send(exception['response']);
        } else {
            return response.status(500).send({statusCode: 500, message: '요청이 실패했습니다. 관리자에게 문의해주세요.'});
        }
    }
}