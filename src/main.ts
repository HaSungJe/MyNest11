import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { CustomErrorFilter } from './exception/exception';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { ApiBadRequestResultDto, ValidationErrorDto } from './global.result.dto';
import dayjs from 'dayjs';
import * as bodyParser from 'body-parser';
import * as path from 'path';

async function bootstrap() {
    const app = await NestFactory.create<NestExpressApplication>(AppModule);

    // JSON Parser의 크기 제한 설정
    const limit = '15Mb';
    app.use(bodyParser.json({ limit }));
    app.use(bodyParser.urlencoded({ limit, extended: true }));
    app.useGlobalFilters(new CustomErrorFilter());

    // 기본 템플릿 ejs 설정. 운영환경에서는 public과 views의 경로를 한 번 더 상위로 이동
    app.useStaticAssets(path.resolve(__dirname, process.env.SERVER === 'DEV' ? '../../public' : '../../../public'));
    app.setBaseViewsDir(path.resolve(__dirname, process.env.SERVER === 'DEV' ? '../../views' : '../../../views'));
    app.setViewEngine('ejs');

    // API Swagger
    const reflector = app.get(Reflector);
    const modules = Reflect.getMetadata('imports', AppModule) || [];
    const swaggerApiConfigData = new DocumentBuilder();
    swaggerApiConfigData.setTitle('API Document');
    swaggerApiConfigData.setVersion(dayjs().format('YYYY-MM-DD HH:mm'));
    swaggerApiConfigData.addBearerAuth({type: 'http', scheme: 'bearer', bearerFormat: 'JWT', name: 'Authorization', in: 'header'}, 'accessToken');
    const swaggerApiConfig = swaggerApiConfigData.build();

    // API Swagger 링크생성
    const swagger_path = 'swagger';
    const jqueryCDN = `https://code.jquery.com/jquery-3.7.1.slim.js`;
    let selectBoxHtml = `<option value="/${swagger_path}">전체</option>`;
    for (let i=0; i<modules.length; i++) {
        const type = reflector.get<string>('type', modules[i]);
        if (type && type === 'API') {
            const path = reflector.get<string>('path', modules[i]);
            const description = reflector.get<string>('description', modules[i]);
            selectBoxHtml += `<option value="/${swagger_path}/${path}">${description}</option>`;
        }
    }
    const js = `
        $(document).ready(function() {
            // 현재 페이지 정보
            const page = window.location.origin + window.location.pathname;

            // 서버 변경시, 주소 이동
            $(document).on('change', '#swaggerList', function() {
                location.href = $(this).val();
            });

            // 서버목록 해당 페이지 맞는 것으로 선택하기
            const selectPage = setInterval(() => {
                const target = $(".schemes-server-container");
                if (target) {
                    const html = \`
                        <div>
                            <span class="servers-title">Tap</span>
                            <div class="servers">
                                <label for="swaggerList">
                                    <select id="swaggerList">
                                        ${selectBoxHtml}
                                    </select>  
                                </label>
                            </div>
                        </div>
                    \`;
                    target.append(html);
                    $("#swaggerList").val(page);
                    clearInterval(selectPage);
                }
            }, 100);
        });
    `;

    // Swagger - 전체
    SwaggerModule.setup(swagger_path, app, SwaggerModule.createDocument(app, swaggerApiConfig, {
        include: [],
    }), {
        customJs: jqueryCDN,
        customJsStr: js
    });

    // Swagger - 개별
    for (let i=0; i<modules.length; i++) {
        const type = reflector.get<string>('type', modules[i]);
        if (type && type === 'API') {
            const path = reflector.get<string>('path', modules[i]);
            SwaggerModule.setup(`${swagger_path}/${path}`, app, SwaggerModule.createDocument(app, swaggerApiConfig, {
                include: [modules[i]]
            }), {
                customJs: jqueryCDN,
                customJsStr: js
            });
        }
    }

    // CORS
    app.enableCors({
        "origin": "*",
        "allowedHeaders": "*",
        "methods": "GET,HEAD,PUT,PATCH,POST,DELETE",
        "preflightContinue": false,
        "optionsSuccessStatus": 204
    });

    // class-validator Pipe
    app.useGlobalPipes(
        new ValidationPipe({
            transform: true,
            forbidNonWhitelisted: true,
            exceptionFactory: (errors) => {
                const result = new ApiBadRequestResultDto();
                result.validationError = [];

                for (let i=0; i<errors.length; i++) {
                    const error = errors[i];
                    const errorDto = new ValidationErrorDto();
                    errorDto.type = (Object.keys(errors[i]['constraints']))[0];

                    if (errorDto.type === 'isBoolean') {
                        if (error?.contexts) {
                            errorDto.property = error?.contexts[errorDto.type]?.target || '';
                            errorDto.message = error?.constraints[errorDto.type];
                        } else {
                            errorDto.property = error?.property;
                            errorDto.message = error?.constraints[errorDto.type];
                        }
                    } else {
                        errorDto.property = error?.property;
                        errorDto.message = error?.constraints[errorDto.type];
                    }

                    result.validationError.push(errorDto)
                }

                result.message = result.validationError.length > 0 ? result.validationError[0].message : '실패했습니다.';
                return new BadRequestException(result);
            }
        }),
    );

    await app.listen(process.env.SERVER_PORT || 3000);
}

bootstrap();
