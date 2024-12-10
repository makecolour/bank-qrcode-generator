import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

class Banks {
    constructor() {
        this.banks = [];
        this.loadBanks();
    }

    loadBanks() {
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
        const filePath = path.resolve(__dirname, '../utils/banks.json'); 
        if (!fs.existsSync(filePath)) {
            throw new Error(`File not found: ${filePath}`);
        }
        const data = fs.readFileSync(filePath, 'utf8');
        const jsonData = JSON.parse(data);
        this.banks = jsonData.data; 
    }

    getAllBanks() {
        return this.banks;
    }

    getBankById(id) {
        return this.banks.find(bank => bank.id === id);
    }

    getBankByCode(code) {
        return this.banks.find(bank => bank.code === code);
    }

    getBanksByTransferSupport(supported) {
        return this.banks.filter(bank => bank.transferSupported === supported);
    }

    getBanksByLookupSupport(supported) {
        return this.banks.filter(bank => bank.lookupSupported === supported);
    }

    getBankByBin(bin) {
        return this.banks.find(bank => bank.bin === bin);
    }
}

export default new Banks();