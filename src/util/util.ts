import { utils, write, read } from 'xlsx-js-style';
import { parseStringPromise } from 'xml2js';
import { HttpStatus } from '@nestjs/common';
import { ValidationErrorDto } from '@root/result.dto';
import nodemailer from 'nodemailer';
import sharp from 'sharp';
import * as bcrypt from 'bcrypt';

/**
 * Create Custom Class-Validation Reject Error
 * - 유효성 검사 커스텀 생성
 * 
 * @param property 
 * @param message 
 * @returns 
 */
export function createValidationError(property: string, message: string): Array<ValidationErrorDto> {
    return [{type: 'isBoolean', property, message}];
}

/**
 * 파일명 인코딩 체크
 * 
 * @param str 
 * @returns 
 */
export function isLatin1(str: string): boolean {
    const buffer = Buffer.from(str, 'latin1');
    return buffer.toString('latin1') === str;
}

/**
 * 시,분 체크
 * 
 * @param v 
 * @returns 
 */
export function checkTimeFormat(v: string) {
    return /^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
}

/**
 * Bcrypt 암호화
 * 
 * @param {*} str 
 * @returns 
 */
export async function getBcrypt(str: string): Promise<string> {
    return await bcrypt.hash(process.env.BCRYPT_CODE + str, 13);
}

/**
 * Bcrypt 비교
 * 
 * @param {*} strA 
 * @param {*} strB 
 */
export async function matchBcrypt(strA: string, strB: string): Promise<boolean> {
    let match1 = await bcrypt.compare(process.env.BCRYPT_CODE + strA, strB);
    let match2 = await bcrypt.compare(process.env.BCRYPT_CODE + strB, strA);
    return match1 || match2;
}

/**
 * 엑셀파일 생성
 * 
 * @param list 
 * @returns 
 */
export function createExcel(list: Array<object>) {
    let excel = utils.book_new();

    for (let i=0; i<list.length; i++) {
        let data = list[i];
        utils.book_append_sheet(excel, data['sheet'], data['name']);
    }

    return write(excel, {bookType: 'xlsx', type: 'base64'});
}

/**
 * 엑셀시트 생성
 * 
 * @param conf
 * @param list 
 * @returns 
 */
export function createSheet(conf: any, list: Array<any>) {
    try {
        const header_style = { 
            border: {
                bottom: {style: 'thin', color: '#000000'},
                top: {style: 'thin', color: '#000000'},
                left: {style: 'thin', color: '#000000'},
                right: {style: 'thin', color: '#000000'},
            },  
            alignment: { horizontal: "center", vertical: "center" }, 
            fill: {fgColor: {rgb: "E9E9E9"}}, 
            font: {bold: true, sz: 15},
        }
    
        const row_style = { 
            font: { color: { rgb: 188038} },
            alignment: { horizontal: "center", vertical: "center" },
            border: {
                left: {style: 'thin', color: '#000000'},
                right: {style: 'thin', color: '#000000'},
            },
            
        }
    
        const row_style_last = {
            font: { color: { rgb: 188038} },
            alignment: { horizontal: "center", vertical: "center" }, 
            border: {
                left: {style: 'thin', color: '#000000'},
                right: {style: 'thin', color: '#000000'},
                bottom: {style: 'thin', color: '#000000'},
            }
        }
    
        let size_cols = [];
        let rows = [[]];
        let list_keys = list && list[0] ? Object.keys(list[0]) : [];
        let keys = conf.map((e) => {
            if (list_keys.includes(e.column)) {
                return e.column;
            }
        });
    
        for (let i=0; i<keys.length; i++) {
            if (keys[i]) {
                // 셀 너비, 높이조절
                size_cols.push({ wpx: 200}); 
        
                rows[0].push({
                    v: conf.find(e => e.column === keys[i])['memo'],
                    t: 's',
                    s: header_style
                });
            }
        }
    
        for (let i=0; i<list.length; i++) {
            let tmp_row = [];
            let row = list[i];
    
            let style = i < list.length-1 ? row_style : row_style_last;
    
            for (let i=0; i<keys.length; i++) {
                tmp_row.push({
                    v: row[keys[i]] ? row[keys[i]] : '',
                    t: 's',
                    s: style
                });
            }
    
            rows.push(tmp_row)
        }
    
        let sheet = utils.aoa_to_sheet(rows);
    
        // 셀 너비 조정
        sheet["!cols"] = size_cols;
    
        // 셀 높이 조절
        let size_rows = [{ hpx: 50}];
        for (let i=0; i<list.length; i++) {
            size_rows.push({ hpx: 25});
        }
        sheet["!rows"] = size_rows;
    
        return sheet;
    } catch (error) {
        return null;
    }
}

/**
 * 엑셀시트 생성
 * - 지급물품 패키지별 신청내역 엑셀다운
 * 
 * @param conf 
 * @param excel_add_conf_1_dept
 * @param excel_add_conf_2_dept
 * @param excel_add_conf_3_dept
 * @param list 
 * @returns 
 */
export function createSheetForSupplyReserve(conf: any, excel_add_conf_1_dept: any, excel_add_conf_2_dept: any, excel_add_conf_3_dept: any, list: Array<any>) {
    try {
        const header_style = { 
            border: {
                bottom: {style: 'thin', color: '#000000'},
                top: {style: 'thin', color: '#000000'},
                left: {style: 'thin', color: '#000000'},
                right: {style: 'thin', color: '#000000'},
            },  
            alignment: { horizontal: "center", vertical: "center"}, 
            fill: {fgColor: {rgb: "E9E9E9"}}, 
            font: {bold: true, sz: 10},
        }
    
        const row_style = { 
            font: { color: { rgb: 188038} },
            alignment: { horizontal: "center", vertical: "center", wrapText: true },
            border: {
                left: {style: 'thin', color: '#000000'},
                right: {style: 'thin', color: '#000000'},
            },
        }
    
        const row_style_last = {
            font: { color: { rgb: 188038} },
            alignment: { horizontal: "center", vertical: "center", wrapText: true }, 
            border: {
                left: {style: 'thin', color: '#000000'},
                right: {style: 'thin', color: '#000000'},
                bottom: {style: 'thin', color: '#000000'},
            }
        }
    
        let size_cols = [];
        let size_rows = [{ hpx: 15}, { hpx: 15}, { hpx: 15}];
        let rows = [[], [], []];
        let merges = [];

        let cell_index = 0;
        let list_keys = list && list[0] ? Object.keys(list[0]) : [];
        let keys = conf.map((e: {column: string, memo: string}) => {
            merges.push({
                s: { r: 0, c: cell_index }, e: { r: 2, c: cell_index }
            });
            cell_index++;

            if (list_keys.includes(e.column)) {
                return e.column;
            }
        });
    
        for (let i=0; i<keys.length; i++) {
            if (keys[i]) {
                // 셀 너비, 높이조절
                size_cols.push({ wpx: 200}); 
        
                rows[0].push({
                    v: conf.find(e => e.column === keys[i])['memo'],
                    t: 's',
                    s: header_style
                });

                rows[1].push({
                    v: conf.find(e => e.column === keys[i])['memo'],
                    t: 's',
                    s: header_style
                });

                rows[2].push({
                    v: conf.find(e => e.column === keys[i])['memo'],
                    t: 's',
                    s: header_style
                });
            }
        }

        // dept1 - 그룹
        let group_cell_index = cell_index;
        let item_cell_index = cell_index;
        for (let i=0; i<excel_add_conf_1_dept.length; i++) {
            const data = excel_add_conf_1_dept[i];

            for (let y=0; y<data['col']; y++) {
                rows[0].push({
                    v: data['memo'],
                    t: 's',
                    s: header_style
                });
            }
            
            merges.push({
                s: { r: 0, c: group_cell_index }, e: { r: 0, c: group_cell_index + data['col']-1 }
            });
            group_cell_index += data['col'];
        }

        // dept2 - 구성품
        for (let i=0; i<excel_add_conf_2_dept.length; i++) {
            const data = excel_add_conf_2_dept[i];

            for (let y=0; y<data['col']; y++) {
                rows[1].push({
                    v: data['memo'],
                    t: 's',
                    s: header_style
                });
            }
            
            merges.push({
                s: { r: 1, c: item_cell_index }, e: { r: 1, c: item_cell_index + data['col']-1 }
            });

            item_cell_index += data['col'];
        }
    
        // dept3 - 구성품 옵션
        for (let i=0; i<excel_add_conf_3_dept.length; i++) {
            const data = excel_add_conf_3_dept[i];
            size_cols.push({ wpx: 100}); 

            rows[2].push({
                v: data['memo'],
                t: 's',
                s: header_style
            });
        }

        for (let i=0; i<list.length; i++) {
            let tmp_row = [];
            let row = list[i];
            let style = i < list.length-1 ? row_style : row_style_last;
    
            for (let i=0; i<keys.length; i++) {
                tmp_row.push({
                    v: row[keys[i]] ? row[keys[i]] : '',
                    t: 's',
                    s: style
                });
            }

            let maxOptionCount: number = 1;
            if (list[i]['options']) {
                const options: Array<Array<string | number>> = list[i]['options'];
                
                options.map((option: Array<string>) => {
                    maxOptionCount = option.length > maxOptionCount ? option.length : maxOptionCount;
                    
                    tmp_row.push({
                        v: option.join('\n'),
                        t: 's',
                        s: style
                    });
                });
            }

            rows.push(tmp_row)
            size_rows.push({ hpx: 15 * maxOptionCount});
        }
    
        let sheet = utils.aoa_to_sheet(rows);
    
        // 셀 너비 조정
        sheet["!cols"] = size_cols;
    
        // 셀 높이 조절
        sheet["!rows"] = size_rows;

        // 셀 병합
        sheet['!merges'] = merges;
    
        return sheet;
    } catch (error) {
        return null;
    }
}

/**
 * 엑셀파일 읽기
 * 
 * @param file 
 */
export function readExcel(conf: any, file: Express.Multer.File) {
    try {
        let result = [];
        let excel = read(file.buffer, {type: 'buffer'});

        for (let i=0; i<excel.SheetNames.length; i++) {
            let sheetName = excel.SheetNames[i];
            let sheet = utils.sheet_to_json(excel.Sheets[sheetName], { raw: false, dateNF: 'yyyy-mm-dd' });
            
            for (let i=0; i<sheet.length; i++) {
                let obj = {};
                for (let y=0; y<conf.length; y++) {
                    let data = sheet[i][conf[y]['memo']];
                    if (data) {
                        const type = conf[y]['type'] ? conf[y]['type'] : null;
                        obj[conf[y]['column']] = data;
                    } 
                }
    
                result.push(obj);
            }
        }

        return { statusCode: HttpStatus.OK, result: result };
    } catch (err) {
        return { statusCode: HttpStatus.BAD_REQUEST, message: '파일을 읽어오는데 실패하였습니다.' }
    }
}

/**
 * XML 파일 읽기
 * - row만
 * 
 * @param file 
 * @returns 
 */
export async function readXmlOnlyRow(file: string) {

    try {        
        const data = await parseStringPromise(file);        
        return data['DATAPACKET']['ROWDATA'][0]['ROW'];
    } catch (error) {
        throw new Error(`Failed to parse XML file: ${error.message}`);
    }
}

/**
 * 메일 송신
 * 
 * @param email 
 * @returns 
 */
export async function sendEmail(email: string, subject: string, text: string) {
    const transporter = nodemailer.createTransport({
        service: 'naver',
        host: 'smtp.naver.com',
        port: 465,
        auth: {
            user: process.env.SENDER_NAVER_ID,
            pass: process.env.SENDER_NAVER_PW
        }
    });

    try {
        await transporter.sendMail({
            from: `${process.env.SENDER_NAVER_ID}@naver.com`,
            to: email,
            subject: subject,
            text: text,
        });

        return { statusCode: HttpStatus.OK }
    } catch (err) {
        return { statusCode: HttpStatus.BAD_REQUEST, message: '이메일 전송 실패' }
    } finally {
        transporter.close();
    }
}

/**
 * 파일의 메타데이터 얻기
 * 
 * @param buffer 
 */
export async function getFileMetaData(buffer: Buffer) {
    return await sharp(buffer).metadata();
}

/**
 * 이미지파일의 썸네일 생성
 * 
 * @param buffer 
 * @param width 
 * @param height 
 * @returns 
 */
export async function getFileImageThumnail(buffer: Buffer, width: number, height: number) {
    width = Math.round(width);
    height = Math.round(height);
    return await sharp(buffer).resize(width, height).toBuffer();
}