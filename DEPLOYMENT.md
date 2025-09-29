# 🚀 Deployment Guide - Railway

This guide explains how to deploy NewsX Backend API to Railway.

## 📋 Prerequisites

- Railway account ([sign up here](https://railway.app))
- MongoDB Atlas database or Railway MongoDB service
- Git repository pushed to GitHub/GitLab

## 🔧 Railway Setup

### 1. Create New Project

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your repository: `nest-news-api-crawl-tuoitre`

### 2. Environment Variables

Add these environment variables in Railway dashboard:

#### Required Variables:
```
DATABASE_URL=mongodb+srv://username:password@cluster.mongodb.net/newsx-db?retryWrites=true&w=majority
NODE_ENV=production
PORT=3000
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d
```

#### Optional Variables:
```
CORS_ORIGIN=https://yourdomain.com
LOG_LEVEL=log
```

### 3. MongoDB Setup Options

#### Option A: MongoDB Atlas (Recommended)
1. Create MongoDB Atlas account
2. Create new cluster
3. Create database user
4. Whitelist Railway IPs: `0.0.0.0/0` (or specific IPs)
5. Get connection string and add to `DATABASE_URL`

#### Option B: Railway MongoDB Service
1. In Railway project, click "New Service"
2. Select "MongoDB"
3. Railway will provide connection details
4. Use internal connection string in `DATABASE_URL`

## 🚀 Deployment Process

### Automatic Deployment (Recommended)

1. **Push to Repository**: Railway auto-deploys on git push
```bash
git add .
git commit -m "Deploy to Railway"
git push origin main
```

2. **Railway Build Process**:
   - Detects Node.js project
   - Installs dependencies: `npm install`
   - Builds application: `npm run build`
   - Generates Prisma client: `npx prisma generate`
   - Starts application: `npm run start:prod`

### Manual Deployment

1. Connect Railway CLI:
```bash
npm install -g @railway/cli
railway login
railway link
```

2. Deploy:
```bash
railway up
```

## 🔍 Verification

### Check Deployment Status

1. **Railway Dashboard**: Monitor build logs and deployment status
2. **Health Check**: Visit your Railway URL to check if API is running
3. **Database Connection**: Check logs for successful Prisma connection

### Test API Endpoints

```bash
# Health check
curl https://your-app.railway.app/

# Get categories
curl https://your-app.railway.app/category

# Search posts
curl "https://your-app.railway.app/post/search?q=test"
```

## 📊 Monitoring & Logs

### View Logs
```bash
# Railway CLI
railway logs

# Or in Railway Dashboard > Deployments > View Logs
```

### Common Log Patterns
```
✅ Success: "NewsX Backend API is running!"
✅ Success: "AppService initialized"  
✅ Success: "Auto-crawling started (every 5 minutes)"
❌ Error: "PrismaClientInitializationError" (Database connection failed)
❌ Error: "Module not found" (Build issue)
```

## 🛠️ Troubleshooting

### Common Issues

#### 1. Database Connection Failed
```bash
# Check DATABASE_URL format
# Ensure MongoDB allows Railway IPs
# Verify database credentials
```

#### 2. Build Failed
```bash
# Check package.json scripts
# Ensure all dependencies are in package.json
# Check TypeScript errors
```

#### 3. Application Won't Start
```bash
# Check PORT environment variable
# Verify start:prod script
# Check for missing dependencies
```

#### 4. Prisma Issues
```bash
# Ensure DATABASE_URL is set correctly
# Check if postbuild script runs: npx prisma generate
# Verify Prisma schema is valid
```

### Debug Commands

```bash
# Check environment variables
railway variables

# View service status
railway status

# Connect to database (if using Railway MongoDB)
railway connect mongodb
```

## 🔄 Auto-Crawling in Production

The application automatically:
- ✅ Starts RSS crawling every 5 minutes
- ✅ Logs crawling activities
- ✅ Handles errors gracefully
- ✅ Updates existing posts with new content

Monitor crawling logs:
```bash
railway logs --filter="RSS crawling"
```

## 📈 Performance Optimization

### Railway Recommendations:
- Use **Starter Plan** for development/testing
- Upgrade to **Pro Plan** for production traffic
- Enable **Auto Scaling** for high traffic
- Set up **Health Checks** for better uptime

### Application Optimizations:
- Database indexing on frequently queried fields
- Pagination for large datasets  
- Error handling for RSS feed failures
- Connection pooling for MongoDB

## 🔒 Security Considerations

### Production Checklist:
- ✅ Strong JWT_SECRET (32+ characters)
- ✅ Environment-specific DATABASE_URL
- ✅ CORS configuration for your domain
- ✅ Input validation and sanitization
- ✅ Rate limiting (implement if needed)
- ✅ HTTPS enabled (Railway provides this)

## 💡 Tips & Best Practices

1. **Monitor Resource Usage**: Check Railway dashboard for CPU/Memory usage
2. **Database Maintenance**: Regular MongoDB maintenance and backups
3. **Error Monitoring**: Set up alerts for critical errors
4. **Performance Monitoring**: Track API response times
5. **Security Updates**: Keep dependencies updated

## 📞 Support

### Railway Support:
- [Railway Documentation](https://docs.railway.app)
- [Railway Discord](https://discord.gg/railway)
- [Railway GitHub](https://github.com/railwayapp)

### Project Support:
- Check logs first: `railway logs`
- Review environment variables
- Test database connectivity
- Verify build process completion

## 🎉 Success!

Your NewsX Backend API should now be running on Railway with:
- ✅ Automated RSS crawling every 5 minutes
- ✅ Full API endpoints for categories and posts
- ✅ Search functionality
- ✅ Pagination support
- ✅ Error handling and logging
- ✅ Production-ready configuration

**Your API URL**: `https://your-app-name.railway.app`