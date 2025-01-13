import dotenv from 'dotenv';
import { VietQR } from 'vietqr';

dotenv.config();

class VietQRAPI {
    constructor() {
        if (!VietQRAPI.instance) {
            VietQRAPI.instance = new VietQR({
                clientID: process.env.VIETQR_CLIENT_ID,
                apiKey: process.env.VIETQR_API_KEY,
            });
        }
    }

    getInstance() {
        return VietQRAPI.instance;
    }


}

const vietQRInstance = new VietQRAPI().getInstance();
export default vietQRInstance;