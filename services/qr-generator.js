import logger from '../services/logger.js';
import VietQR from "../models/VietQR.js";
import QRCode from 'qrcode';
import vietQRInstance from '../models/vietqrAPI.js';
import dotenv from 'dotenv';
import { registerFont, createCanvas, loadImage } from 'canvas';
import { VIETQR as VietQRV1, SERVICE_CODE, CURRENCY } from "../models/VietQR_v1.js";
import path from 'path';
import { fileURLToPath } from 'url';
dotenv.config();

const buildQRString = (req, res) => {
    const acquierID = req.query.acquier_id;
    const consumerID = req.query.consumer_id;
    const money = req.query.money;
    const content = req.query.content;
    const serviceCode = req.query.service_code;

    if (!acquierID || !consumerID) {
        throw new Error("Missing required parameters");
    }

    const vietQR = new VietQR();
    vietQR
        .setBeneficiaryOrganization(acquierID, consumerID)
        .setTransactionAmount(money);
    if (content) {
        vietQR.setAdditionalDataFieldTemplate(content);
    }
    if (serviceCode) {
        vietQR.setServiceCode(serviceCode);
    }
    return vietQR.build();
};

const buildQRRenderOptions = (req, res) => {
    if(req.query.render_options) {
        return JSON.parse(req.query.render_options);
    } else {
        var options = {};
        if(req.query.margin) {
            options.margin = parseInt(req.query.margin);
        }
        if(req.query.scale) {
            options.scale = parseInt(req.query.scale);
        }
        if(req.query.width) {
            options.width = parseInt(req.query.width);
        }
        if(req.query.color) {
            try {
                options.color = JSON.parse(req.query.color);
            } catch (err) {
                options.color = req.query.color;
            }
        } else if(req.query.color_dark || req.query.color_light) {
            options.color = {
                dark: req.query.color_dark ? req.query.color_dark : '#000000ff',
                light: req.query.color_light ? req.query.color_light : '#ffffffff'
            }
        }
        if(req.query.mode) {
            options.mode = req.query.mode;
        }
        if(req.query.type) {
            options.type = req.query.type;
        }
        if(req.query.error_correction_level) {
            options.errorCorrectionLevel = req.query.error_correction_level;
        }
        return options;
    }
};

const addLogoToCanvas = async (canvas, logoUrl, options) => {
    const ctx = canvas.getContext('2d');

    try {
        const logo = await loadImage(logoUrl);

        if (!logo) {
            logger.error('Failed to load logo: Invalid image data');
            throw new Error('Invalid logo provided');
        }

        const logoMaxSize = Math.max(canvas.width, canvas.height) * 0.2; 
        const logoRatio = Math.min(logoMaxSize / logo.width, logoMaxSize / logo.height);
        const logoWidth = logo.width * logoRatio;
        const logoHeight = logo.height * logoRatio;
        const padding = 1;
        const rectWidth = logoWidth + padding * 2;
        const rectHeight = logoHeight + padding * 2;
        const logoX = (canvas.width - logoWidth) / 2;
        const logoY = (canvas.height - logoHeight) / 2;
        const rectX = logoX - padding;
        const rectY = logoY - padding;

        ctx.fillStyle = options.color && options.color.light ? options.color.light : '#ffffffff';
        ctx.fillRect(rectX, rectY, rectWidth, rectHeight);

        ctx.drawImage(logo, logoX, logoY, logoWidth, logoHeight);
    } catch (err) {
        logger.error('Failed to load logo:', err);
        throw new Error('Invalid logo provided');
    }
};


const buildQRDataUrl = async (req, res) => {
    var qrString = buildQRString(req, res);
    if(req.query.version && req.query.version == 1) {
        qrString = buildQRStringAlt(req, res);
    } else {
        qrString = buildQRString(req, res);
    }

    const options = buildQRRenderOptions(req, res);

    if (req.query.logo) {
        var size = process.env.QR_DEFAULT_SIZE ? parseInt(process.env.QR_DEFAULT_SIZE) : 500;
        if(options.scale) {
            size = size * options.scale
        } 
        if(options.width) {
            size = options.width;
        }
        const canvas = createCanvas(size, size); 
        const ctx = canvas.getContext('2d');

        await QRCode.toCanvas(canvas, qrString, options);

        await addLogoToCanvas(canvas, req.query.logo, options);

        const dataUrl = canvas.toDataURL('image/png');
        logger.info('Generated QR Code with logo: ' + dataUrl);
        return dataUrl;
    } else {
        const dataUrl = await QRCode.toDataURL(qrString, options);
        logger.info('Generated QR Code without logo: ' + qrString);
        return dataUrl;
    }
};

const drawTextBackground = (ctx, x, y, textWidth, textHeight, radius, textBackground) => {
    const rectX = x - textWidth / 2 - textHeight * 0.15;
    const rectY = y - textHeight + textHeight * 0.3;
    const rectWidth = textWidth + textHeight * 0.15;
    const rectHeight = textHeight;

    ctx.fillStyle = textBackground;
    ctx.beginPath();
    ctx.moveTo(rectX + radius, rectY);
    ctx.lineTo(rectX + rectWidth - radius, rectY);
    ctx.arcTo(rectX + rectWidth, rectY, rectX + rectWidth, rectY + radius, radius);
    ctx.lineTo(rectX + rectWidth, rectY + rectHeight - radius);
    ctx.arcTo(rectX + rectWidth, rectY + rectHeight, rectX + rectWidth - radius, rectY + rectHeight, radius);
    ctx.lineTo(rectX + radius, rectY + rectHeight);
    ctx.arcTo(rectX, rectY + rectHeight, rectX, rectY + rectHeight - radius, radius);
    ctx.lineTo(rectX, rectY + radius);
    ctx.arcTo(rectX, rectY, rectX + radius, rectY, radius);
    ctx.closePath();
    ctx.fill();
};

const wrapText = (ctx, text, x, y, maxWidth, lineHeight, textBackground, textColor) => {
    if(!textColor) {
        textColor = 'black';
    }
    const words = text.split(' ');
    let line = '';
    for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = ctx.measureText(testLine);
        const testWidth = metrics.width;
        if (testWidth > maxWidth && n > 0) {
            if (textBackground && textBackground != null) {
                const textHeight = lineHeight * 1.1; 
                const textWidth = ctx.measureText(line).width;
                const radius = lineHeight * 0.15; 

                drawTextBackground(ctx, x, y, textWidth, textHeight, radius, textBackground);
            }
            ctx.fillStyle = textColor; 
            ctx.fillText(line, x, y);
            line = words[n] + ' ';
            y += lineHeight;
        } else {
            line = testLine;
        }
    }
    if (textBackground && textBackground != null) {
        const textHeight = lineHeight * 1.1; 
        const textWidth = ctx.measureText(line).width;
        const radius = lineHeight * 0.15; 

        drawTextBackground(ctx, x, y, textWidth, textHeight, radius, textBackground);
    }
    ctx.fillStyle = textColor;
    ctx.fillText(line, x, y);
    return y + lineHeight; 
};

const drawRoundedRect = (ctx, x, y, width, height, radius) => {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.clip();
};

const buildQRDataUrlWithInfo = async (req, res) => {
    let qrString = '';
    if (req.query.version && req.query.version == 1) {
        qrString = buildQRStringAlt(req, res);
    } else {
        qrString = buildQRString(req, res);
    }

    const options = buildQRRenderOptions(req, res);
    if (!options.margin) {
        options.margin = 8;
    }
    if(!options.errorCorrectionLevel) {
        options.errorCorrectionLevel = 'H';
    }

    const backgroundUrl = req.query.background_url; 
    const canvasWidth = process.env.COMPACT_QR_WIDTH ? parseInt(process.env.COMPACT_QR_WIDTH) : 960;
    const canvasHeight = process.env.COMPACT_QR_HEIGHT ? parseInt(process.env.COMPACT_QR_HEIGHT) : 1704;
    const qrCanvasSize = canvasWidth * 0.65; 
    const logoUrl = req.query.header_logo; 
    let logoHeight = 0;
    const logoPaddingTop = canvasHeight * 0.045; 

    let logo;
    let desiredLogoHeight = canvasHeight * 0.055; 
    let logoWidth = 0;
    if (logoUrl) {
        logo = await loadImage(logoUrl);
        const aspectRatio = logo.width / logo.height;
        logoWidth = desiredLogoHeight * aspectRatio; 
        logoHeight = desiredLogoHeight;
    }

    const currencyCode = req.query.currency && CURRENCY[req.query.currency.toLowerCase()] ? req.query.currency.toUpperCase() : 'VND';

    const money = req.query.money ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: currencyCode }).format(req.query.money) : '';
    var bankName = req.query.bank_name || '';
    var bankImg = '';

    if (req.query.acquier_id) {
        const banks = await vietQRInstance.getBanks();
        const bank = banks.data.find(bank => bank.bin === req.query.acquier_id);
        if (bank) {
            bankName = bank.name;
            bankImg = bank.logo;
        }
    }

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const arialPathNormal = path.resolve(__dirname, '../utils/ARIAL.TTF');
    const arialPathBold = path.resolve(__dirname, '../utils/ARIALBD.TTF');
    const arialPathItalic = path.resolve(__dirname, '../utils/ARIALI.TTF');
    registerFont(arialPathNormal, { family: 'Arial', weight: 'normal', style: 'normal' });
    registerFont(arialPathBold, { family: 'Arial', weight: 'bold', style: 'normal' });
    registerFont(arialPathItalic, { family: 'Arial', weight: 'normal', style: 'italic' });

    const params = [
        { label: req.query.consumer_name.toUpperCase() || '', font: `${canvasHeight * 0.024}px Arial` },
        { label: req.query.consumer_id || '', font: `${canvasHeight * 0.025}px Arial` },
        { label: bankName || '', font: `${canvasHeight * 0.025}px Arial` },
        { label: money, font: `bold ${canvasHeight * 0.03}px Arial` },
        { label: req.query.content || '', font: `${canvasHeight * 0.025}px Arial` }
    ];

    const filteredParams = params.filter(param => param.label !== '');

    const qrCanvas = createCanvas(qrCanvasSize, qrCanvasSize);

    await QRCode.toCanvas(qrCanvas, qrString, { ...options, width: qrCanvasSize, height: qrCanvasSize });

    if (req.query.logo) {
        await addLogoToCanvas(qrCanvas, req.query.logo, options);
    } else {
        // await addLogoToCanvas(qrCanvas, bankImg, options);
    }

    const canvas = createCanvas(canvasWidth, canvasHeight);
    const ctx = canvas.getContext('2d');

    const canvasRadius = canvasHeight * 0.02;
    ctx.save();
    drawRoundedRect(ctx, 0, 0, canvasWidth, canvasHeight, canvasRadius);
    ctx.clip();

    if (backgroundUrl) {
        const background = await loadImage(backgroundUrl);
        const scale = Math.max(canvasWidth / background.width, canvasHeight / background.height);
        const bgWidth = background.width * scale;
        const bgHeight = background.height * scale;
        const bgX = (canvasWidth - bgWidth) / 2;
        const bgY = (canvasHeight - bgHeight) / 2;
        ctx.drawImage(background, bgX, bgY, bgWidth, bgHeight);
    } else {
        ctx.fillStyle = '#f6f6f6';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    ctx.restore();

    if (logoUrl) {
        const logoX = (canvas.width - logoWidth) / 2;
        ctx.drawImage(logo, logoX, logoPaddingTop, logoWidth, logoHeight);
    }

    const qrX = (canvas.width - qrCanvasSize) / 2;
    const qrY = logoHeight + logoPaddingTop + canvasHeight * 0.045; 

    const radius = canvasHeight * 0.0125; 
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.7)'; 
    ctx.shadowBlur = canvasWidth * 0.047; 
    ctx.shadowOffsetX = canvasWidth * 0.03125; 
    ctx.shadowOffsetY = canvasWidth * 0.03125; 
    ctx.fillStyle = '#ffffff';
    drawRoundedRect(ctx, qrX, qrY, qrCanvasSize, qrCanvasSize, radius);
    ctx.drawImage(qrCanvas, qrX, qrY, qrCanvasSize, qrCanvasSize);
    ctx.restore();

    var textColor;
    if(req.query.text_color) {
        textColor = req.query.text_color;
    } else if(options.color?.dark) {
        textColor = options.color.dark;
    } else {
        textColor = 'black';
    }

    var textBackground;
    if(req.query.text_background) {
        switch (req.query.text_background) {
            case 'transparent':
                textBackground = null;
                break;
            case 'none':
                textBackground = null;
            default:
                textBackground = req.query.text_background;
                break;
        }
    } else if(options.color?.light) {
        textBackground = options.color.light;
    }  

    ctx.textAlign = 'center';

    let textStartY = qrY + qrCanvasSize + canvasHeight * 0.0845; 
    const maxWidth = canvasWidth * 0.97; 
    const lineHeight = canvasHeight * 0.04; 
    const paramSpacing = canvasHeight * 0.012; 

    filteredParams.forEach(param => {
        ctx.font = param.font;
        textStartY = wrapText(ctx, param.label, canvas.width / 2, textStartY, maxWidth, lineHeight, textBackground, textColor);
        textStartY += paramSpacing; 
    });

    if (req.query.footer) {
        ctx.font = `italic ${canvasHeight * 0.015}px Arial`;
        const footerY = canvasHeight - canvasHeight * 0.02; 
        var footerColor;
        if(req.query.footer_color) {
            footerColor = req.query.footer_color;
        } else {
            footerColor = 'white';
        }
        wrapText(ctx, req.query.footer, canvas.width / 2, footerY, maxWidth, lineHeight, '', footerColor);
    }
    const dataUrl = canvas.toDataURL('image/png');
    logger.info('Generated QR Code with additional info: ' + qrString);
    return dataUrl;
};

const buildQRSVG = async (req, res) => {
    var qrString = buildQRString(req, res);
    if(req.query.version && req.query.version == 1) {
        qrString = buildQRStringAlt(req, res);
    } else {
        qrString = buildQRString(req, res);
    }
    const options = buildQRRenderOptions(req, res);

    if (req.query.logo) {
        var size = process.env.QR_DEFAULT_SIZE ? parseInt(process.env.QR_DEFAULT_SIZE) : 500;
        if(options.scale) {
            size = size * options.scale
        } 
        if(options.width) {
            size = options.width;
        }
        const canvas = createCanvas(size, size); 
        const ctx = canvas.getContext('2d');

        await QRCode.toCanvas(canvas, qrString, options);

        await addLogoToCanvas(canvas, req.query.logo, options);

        const svg = canvas.toDataURL('image/svg+xml');
        logger.info('Generated QR Code with logo: ' + svg);
        return svg;
    } else {
        if(!options.type){
            options.type = 'svg';
        }
        const svg = await QRCode.toString(qrString, options);
        logger.info('Generated QR Code without logo: ' + qrString);
        return svg;
    }
};

const buildQRStringAlt = (req, res) => {
    const acquierID = req.query.acquier_id;
    const consumerID = req.query.consumer_id;
    const money = req.query.money;
    const content = req.query.content;
    const serviceCode = req.query.service_code;
    const currency = req.query.currency;
    const merchantCategory = req.query.merchant_category;

    if (!acquierID || !consumerID) {
        throw new Error("Missing required parameters");
    }
    const vietQRdata = new VietQRV1();
    vietQRdata.fields.is_dynamic_qr = true;

    vietQRdata.fields.merchant_category = merchantCategory;

    vietQRdata.fields.acq = acquierID;

    vietQRdata.fields.merchant_id = consumerID;

    if (money) {
        vietQRdata.fields.amount = money
    }
    if (currency && CURRENCY[currency]) {
        vietQRdata.fields.currency = CURRENCY[currency];
    }
    if (content) {
        vietQRdata.fields.purpose_txn = content;
    }
    if (serviceCode && SERVICE_CODE[serviceCode]) {
        vietQRdata.fields.service_code = SERVICE_CODE[serviceCode];
    }
    return vietQRdata.builder();
};

export { buildQRDataUrl, buildQRSVG, buildQRString, buildQRStringAlt, buildQRDataUrlWithInfo };