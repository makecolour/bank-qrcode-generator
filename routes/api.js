import express from 'express';
import logger from '../services/logger.js';
import { buildQRDataUrl, buildQRSVG, buildQRString, buildQRStringAlt, buildQRDataUrlWithInfo } from '../services/qr-generator.js';

const router = express.Router();

router.get('/qr-png', async (req, res, next) => {
    try {
        const qrUrl = await buildQRDataUrl(req, res);
        res.send({
            status: 'success',
            data: qrUrl,
            request: req.query
        });
    } catch (err) {
        logger.error(err.message);
        res.status(500).send(err.message);
    }
});

router.get('/qr-svg', async (req, res, next) => {
    try {
        const qrSvg = await buildQRSVG(req, res);
        res.send({
            status: 'success',
            data: qrSvg,
            request: req.query
        });
    } catch (err) {
        logger.error(err.message);
        res.status(500).send(err.message);
    }
});

router.get('/qr-string', async (req, res, next) => {
    try {
        let qrString;
        if(req.query.version && req.query.version == 1) {
            qrString = buildQRStringAlt(req, res);
        } else {
            qrString = buildQRString(req, res);
        }
        res.send({
            status: 'success',
            data: qrString,
            request: req.query
        });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

router.get('/qr-png-with-info', async (req, res, next) => {
    try {
        const qrUrl = await buildQRDataUrlWithInfo(req, res);
        res.send({
            status: 'success',
            data: qrUrl,
            request: req.query
        });
    } catch (err) {
        logger.error(err.message);
        res.status(500).send(err.message);
    }
});

export default router;
