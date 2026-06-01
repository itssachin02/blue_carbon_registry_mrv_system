Deployment steps for Blue Carbon Registry MRV System

Overview
- Frontend: Vercel (Next.js in `frontend`)
- Backend: Render (Express in `backend`)
- Database: MongoDB Atlas (free cluster)
- Blockchain: Polygon Amoy (Hardhat in `blockchain`)

Required environment variables

Backend (Render service):
- MONGO_URI = mongodb+srv://<user>:<pass>@<cluster>/<dbname>?retryWrites=true&w=majority
- JWT_SECRET = <random-string>
- PINATA_API_KEY = <pinata-key> (optional)
- PINATA_SECRET_KEY = <pinata-secret> (optional)
- PRIVATE_KEY = 0x... (deployer private key for testnet)
- BLOCKCHAIN_RPC_URL = <alchemy_or_infura_rpc_url_for_amoy>
- CONTRACT_ADDRESS = <deployed_contract_address> (set after deployment)
- MODEL_API_URL, SATELLITE_API_URL, SATELLITE_API_KEY (if used)

Frontend (Vercel project):
- NEXT_PUBLIC_API_URL = https://<your-backend>.onrender.com
- NEXT_PUBLIC_CONTRACT_ADDRESS = <contract-address> (optional)
- NEXT_PUBLIC_ETHERSCAN_BASE_URL / NEXT_PUBLIC_BLOCKCHAIN_EXPLORER_URL (optional)

Quick deploy commands (local testing)

# Backend local run
cd backend
npm install
MONGO_URI="<atlas-uri>" JWT_SECRET="test" node server.js

# Frontend build & start
cd frontend
npm install
npm run build
npm run start

# Blockchain deploy (local or CI)
cd blockchain
npm install
# set BLOCKCHAIN_RPC_URL and PRIVATE_KEY in env
npx hardhat run scripts/deploy.js --network amoy

Notes
- Do NOT commit `.env` or private keys to GitHub. Use Render/Vercel environment settings or GitHub Secrets.
- I updated `blockchain/hardhat.config.js` to include the `amoy` network using `process.env.BLOCKCHAIN_RPC_URL` and `process.env.PRIVATE_KEY`.

If you want, I can: 
- add a GitHub Actions workflow to run Hardhat deploy on merge to `main` (using repository secrets),
- add a `deploy` npm script to `blockchain/package.json`,
- or walk you through creating Atlas/Render/Vercel accounts step-by-step.
