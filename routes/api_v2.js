import express from 'express';
import logger from '../services/logger.js';
import dotenv from 'dotenv';
import vietQR from '../models/vietqrAPI.js'; 

dotenv.config();
const router = express.Router();

router.get('/qr-png', async (req, res, next) => {
    if(!req.query.template) {
        req.query.template = 'qr_only';
    }
    try {
        const qrCode = await vietQR.genQRCodeBase64(req.query);
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

export default router;