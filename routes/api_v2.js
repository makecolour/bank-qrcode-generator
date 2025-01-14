import express from 'express';
import logger from '../services/logger.js';
import vietQR from '../models/vietqrAPI.js'; 

const router = express.Router();

router.get('/qr-png', async (req, res, next) => {
    if(!req.query.template) {
        req.query.template = 'qr_only';
    }
    try {
        const qrCode = await vietQR.genQRCodeBase64(req.query);
        if(qrCode.data.code && qrCode.data.code != '00') {
            throw new Error(qrCode.data.desc);
        }
        logger.info('Generated VietQR: ' + qrCode.data.data.qrDataURL);
        res.send({
            status: 'success',
            data: qrCode.data.data.qrDataURL,
            request: req.query
        });
    } catch (err) {
        logger.error(err.message);
        res.status(500).send(err.message);
    }
});

router.get('/qr-string', async (req, res, next) => {
    try {
        const qrString = await vietQR.genQRCodeBase64(req.query);
        logger.info('Generated VietQR string: ' + qrString.data.data.qrCode);
        res.send({
            status: 'success',
            data: qrString.data.data.qrCode,
            request: req.query
        });
    } catch (err) {
        logger.error(err.message);
        res.status(500).send(err.message);
    }
});

router.get('/banks', async (req, res, next) => {
    try {
        const banks = await vietQR.getBanks();
        res.send(banks.data);
    } catch (err) {
        logger.error(err.message);
        res.status(500).send(err.message);
    }
});

router.get('/qr-quicklink', async (req, res, next) => {
    if(!req.query.template) {
        req.query.template = 'qr_only';
    }
    try {
        const qrCode = await vietQR.genQuickLink(req.query);
        res.send({
            status: 'success',
            data: qrCode,
            request: req.query
        });
    } catch (err) {
        logger.error(err.message);
        res.status(500).send(err.message);
    }
});

router.get('/templates', async (req, res, next) => {
    try {
        res.send({
            status: 'success',
            data: [
                {
                    name: 'Compact 2',
                    description: 'Bao gồm : Mã QR, các logo , thông tin chuyển khoản',
                    value: 'compact2',
                    width: 540,
                    height: 640
                },
                {
                    name: 'Compact',
                    description: 'QR kèm logo VietQR, Napas, ngân hàng',
                    value: 'compact',
                    width: 540,
                    height: 540
                },
                {
                    name: 'QR Only',
                    description: 'Trả về ảnh QR đơn giản, chỉ bao gồm QR',
                    value: 'qr_only',
                    width: 480,
                    height: 480
                },
                {
                    name: 'Print',
                    description: 'Bao gồm : Mã QR, các logo và đầy đủ thông tin chuyển khoản',
                    value: 'print',
                    width: 600,
                    height: 776
                }
            ]
        });
    } catch (err) {
        logger.error(err.message);
        res.status(500).send(err.message);
    }
});

export default router;