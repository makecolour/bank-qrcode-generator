import express from 'express';
import 'dotenv/config';

const router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: process.env.APP_NAME || ' Banking QR Generator' });
});

export default router;