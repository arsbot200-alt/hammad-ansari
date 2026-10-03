# Gallery — Your Memories, Beautifully Organized

A lightning-fast, zero-compression lossless photo gallery web application with timeline albums, search, trash bin, and built-in photo editor.

---

## 🚀 Instant Deployment on Render (Recommended)

Render is ideal for this application because it runs a persistent full-stack Node.js server without serverless execution timeouts or upload size limits.

### Method 1: Deploy with Git & Render Dashboard (Super Easy)
1. **Unzip** `gallery-render-deploy.zip` into a directory.
2. Push the files to your GitHub or GitLab repository:
   ```bash
   git init
   git add .
   git commit -m "Deploy Gallery to Render"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/gallery-app.git
   git push -u origin main
   ```
3. Open [https://dashboard.render.com/](https://dashboard.render.com/) and click **New +** $\to$ **Web Service**.
4. Connect your GitHub repository.
5. Configure the following fields:
   - **Name**: `gallery-app` (or any name you prefer)
   - **Language / Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: `Free`
6. Click **Deploy Web Service**! Render will build your Vite frontend and launch the live Node.js server. Your gallery will be live at `https://your-app.onrender.com`.

### Method 2: 1-Click Render Blueprint
If you connect your repository via Render's **Blueprints** tab, Render automatically detects the included `render.yaml` and sets all build/start commands and environment variables with zero manual entry!

---

## ⚡ Deployment on Vercel
If you still want to deploy on Vercel:
- The project also retains `vercel.json` and serverless router `api/index.ts`.
- Push to GitHub and click **Import** in the Vercel dashboard.

---

## 💻 Local Development
```bash
npm install
npm run dev
```
Open `http://localhost:3000` in your browser.
