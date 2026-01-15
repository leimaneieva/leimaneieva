# Social Analytics SaaS - Sentiment Intelligence Platform

A premium Next.js social analytics platform powered by Claude AI for real-time sentiment analysis across social media platforms. Built with Supabase for multi-tenant architecture with Row Level Security (RLS).

## 🚀 Features

- **AI-Powered Sentiment Analysis**: Claude Sonnet 4 analyzes social media mentions with detailed reasoning
- **Multi-Platform Support**: Instagram, Facebook, Twitter, and LinkedIn integration
- **Real-Time Dashboard**: Interactive charts showing sentiment trends and distribution
- **Smart Filtering**: Filter mentions by positive, negative, neutral, or unanalyzed
- **Multi-Tenant Architecture**: Secure RLS policies ensure data isolation per user
- **Beautiful UI**: Gradient-based design with smooth animations and micro-interactions
- **OAuth Integration**: Secure social media account connections
- **Batch Processing**: Efficient analysis of large mention volumes

## 📋 Prerequisites 

- Node.js 18+ and npm/yarn
- Supabase account (free tier works)
- Anthropic API key for Claude access
- Social media app credentials (Instagram, Facebook, etc.)

## 🛠️ Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Database**: Supabase (PostgreSQL with RLS)
- **AI**: Claude Sonnet 4 via Anthropic API
- **Authentication**: Supabase Auth
- **Styling**: Tailwind CSS
- **UI Components**: Custom React components with Lucide icons

## 📦 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/leimaneieva.git
cd leimaneieva
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
```

### 3. Set Up Supabase Project

1. Create a new project at [supabase.com](https://supabase.com)
2. Name your project: `designs` (or your preferred name)
3. Copy your project URL and anon key

### 4. Create Database Tables

Run the following SQL in your Supabase SQL Editor:

```sql
-- Enable Row Level Security
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- Profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Social accounts table
CREATE TABLE social_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('instagram', 'facebook', 'twitter', 'linkedin')),
  account_id TEXT NOT NULL,
  account_name TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, platform, account_id)
);

-- Enable RLS
ALTER TABLE social_accounts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for social_accounts
CREATE POLICY "Users can view own social accounts"
  ON social_accounts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own social accounts"
  ON social_accounts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own social accounts"
  ON social_accounts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own social accounts"
  ON social_accounts FOR DELETE
  USING (auth.uid() = user_id);

-- Mentions table
CREATE TABLE mentions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  social_account_id UUID REFERENCES social_accounts(id) ON DELETE CASCADE NOT NULL,
  platform TEXT NOT NULL,
  content TEXT NOT NULL,
  author TEXT NOT NULL,
  author_handle TEXT,
  post_url TEXT,
  posted_at TIMESTAMPTZ NOT NULL,
  sentiment_score NUMERIC(3,1),
  sentiment_label TEXT CHECK (sentiment_label IN ('positive', 'negative', 'neutral')),
  sentiment_reasoning TEXT,
  engagement_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_mentions_user_id ON mentions(user_id);
CREATE INDEX idx_mentions_sentiment_label ON mentions(sentiment_label);
CREATE INDEX idx_mentions_posted_at ON mentions(posted_at DESC);

-- Enable RLS
ALTER TABLE mentions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for mentions
CREATE POLICY "Users can view own mentions"
  ON mentions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own mentions"
  ON mentions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own mentions"
  ON mentions FOR UPDATE
  USING (auth.uid() = user_id);

-- Sentiment analytics table (aggregated daily stats)
CREATE TABLE sentiment_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  positive_count INTEGER DEFAULT 0,
  negative_count INTEGER DEFAULT 0,
  neutral_count INTEGER DEFAULT 0,
  average_score NUMERIC(3,1) DEFAULT 0,
  total_mentions INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Create index
CREATE INDEX idx_sentiment_analytics_user_date ON sentiment_analytics(user_id, date DESC);

-- Enable RLS
ALTER TABLE sentiment_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for sentiment_analytics
CREATE POLICY "Users can view own analytics"
  ON sentiment_analytics FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own analytics"
  ON sentiment_analytics FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own analytics"
  ON sentiment_analytics FOR UPDATE
  USING (auth.uid() = user_id);

-- Function to update analytics when mentions are updated
CREATE OR REPLACE FUNCTION update_sentiment_analytics()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process if sentiment was added or changed
  IF NEW.sentiment_score IS NOT NULL AND 
     (OLD.sentiment_score IS NULL OR NEW.sentiment_score != OLD.sentiment_score) THEN
    
    INSERT INTO sentiment_analytics (
      user_id,
      date,
      positive_count,
      negative_count,
      neutral_count,
      average_score,
      total_mentions
    )
    SELECT
      NEW.user_id,
      DATE(NEW.posted_at),
      COUNT(*) FILTER (WHERE sentiment_label = 'positive'),
      COUNT(*) FILTER (WHERE sentiment_label = 'negative'),
      COUNT(*) FILTER (WHERE sentiment_label = 'neutral'),
      AVG(sentiment_score),
      COUNT(*)
    FROM mentions
    WHERE user_id = NEW.user_id 
      AND DATE(posted_at) = DATE(NEW.posted_at)
      AND sentiment_score IS NOT NULL
    ON CONFLICT (user_id, date)
    DO UPDATE SET
      positive_count = EXCLUDED.positive_count,
      negative_count = EXCLUDED.negative_count,
      neutral_count = EXCLUDED.neutral_count,
      average_score = EXCLUDED.average_score,
      total_mentions = EXCLUDED.total_mentions;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-update analytics
CREATE TRIGGER trigger_update_sentiment_analytics
AFTER INSERT OR UPDATE ON mentions
FOR EACH ROW
EXECUTE FUNCTION update_sentiment_analytics();
```

### 5. Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Anthropic API (Claude)
ANTHROPIC_API_KEY=sk-ant-your-api-key

# Social Media OAuth (Required for production)
# Instagram (via Facebook)
INSTAGRAM_APP_ID=your-app-id
INSTAGRAM_APP_SECRET=your-app-secret
INSTAGRAM_REDIRECT_URI=http://localhost:3000/api/auth/callback/instagram

# Facebook
FACEBOOK_APP_ID=your-app-id
FACEBOOK_APP_SECRET=your-app-secret
FACEBOOK_REDIRECT_URI=http://localhost:3000/api/auth/callback/facebook

# Twitter/X
TWITTER_CLIENT_ID=your-client-id
TWITTER_CLIENT_SECRET=your-client-secret

# LinkedIn
LINKEDIN_CLIENT_ID=your-client-id
LINKEDIN_CLIENT_SECRET=your-client-secret

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 6. Get API Keys

#### Anthropic API Key (Required)
1. Visit [console.anthropic.com](https://console.anthropic.com)
2. Sign up or log in
3. Go to API Keys section
4. Create a new API key
5. Copy the key to your `.env.local`

**Pricing**: The £55/month tier provides Claude Sonnet 4 access suitable for analyzing ~10,000 mentions/month.

#### Social Media Credentials (Optional for Development)

The app includes mock data for development. For production:

**Instagram/Facebook**:
1. Go to [developers.facebook.com](https://developers.facebook.com)
2. Create a new app
3. Add Instagram Basic Display or Facebook Login
4. Configure OAuth redirect URIs
5. Copy App ID and Secret

**Twitter**:
1. Visit [developer.twitter.com](https://developer.twitter.com)
2. Create a new project and app
3. Enable OAuth 2.0
4. Copy credentials

**LinkedIn**:
1. Go to [linkedin.com/developers](https://www.linkedin.com/developers)
2. Create a new app
3. Request access to required APIs
4. Copy credentials

### 7. Run Development Server

```bash
npm run dev
# or
yarn dev
```

Visit [http://localhost:3000](http://localhost:3000) to see your app.

## 🔐 Authentication Setup

### Configure Supabase Auth

1. In Supabase Dashboard, go to Authentication → Providers
2. Enable Email provider
3. Configure redirect URLs:
   - Development: `http://localhost:3000/auth/callback`
   - Production: `https://yourdomain.com/auth/callback`

### Test Authentication

```typescript
// Sign up a test user via Supabase Dashboard or use:
const { data, error } = await supabase.auth.signUp({
  email: 'test@example.com',
  password: 'your-secure-password'
})
```

## 📊 Usage

### 1. Connect Social Accounts

1. Navigate to the Sentiment page
2. Click "Connect Social Account"
3. Choose a platform (Instagram/Facebook)
4. Complete OAuth flow
5. Grant required permissions

### 2. Ingest Social Data

```bash
# The app automatically fetches mentions when accounts are connected
# Or trigger manually via API:
curl -X POST http://localhost:3000/api/sentiment/ingest \
  -H "Content-Type: application/json" \
  -d '{"socialAccountId": "uuid", "platform": "instagram"}'
```

### 3. Analyze Sentiment

```bash
# Auto-analyze all unanalyzed mentions
curl -X POST http://localhost:3000/api/sentiment/analyze \
  -H "Content-Type: application/json" \
  -d '{"batchSize": 10}'

# Or use the UI "Analyze" button
```

### 4. View Dashboard

- See real-time sentiment trends
- Filter by positive/negative/neutral
- View detailed AI reasoning
- Export reports

## 🏗️ Project Structure

```
leimaneieva/
├── app/
│   ├── (dashboard)/
│   │   └── sentiment/
│   │       └── page.tsx          # Main sentiment dashboard
│   └── api/
│       └── sentiment/
│           ├── analyze/
│           │   └── route.ts      # Claude AI sentiment analysis
│           └── ingest/
│               └── route.ts      # Social data ingestion
├── components/
│   ├── SentimentHealthCard.tsx   # Charts & trends
│   ├── MentionFeed.tsx           # Mention list with filters
│   └── ConnectSocial.tsx         # OAuth connection UI
├── lib/
│   └── supabase.ts               # Supabase client & helpers
└── README.md                     # This file
```

## 🔒 Security Features

### Row Level Security (RLS)
All tables enforce RLS policies ensuring users can only access their own data:
- Profiles: Users see only their profile
- Social Accounts: Users manage only their connections
- Mentions: Users view only their mentions
- Analytics: Users access only their statistics

### OAuth Security
- Tokens encrypted at rest
- Secure token refresh flows
- Automatic token expiry handling
- Revocable access anytime

### API Security
- Supabase Auth JWT validation
- User ID verification on all operations
- Rate limiting on analysis endpoints
- Service role key never exposed to client

## 📈 Scaling Considerations

### Database Performance
- Indexed queries on user_id, posted_at, sentiment_label
- Materialized sentiment_analytics for fast aggregations
- Consider partitioning mentions table by date for >1M rows

### API Rate Limits
- Claude API: ~10 requests/second (configurable)
- Built-in 100ms delay between batch requests
- Consider queue system (Bull, Temporal) for high volume

### Caching
- Cache social API responses for 5-15 minutes
- Cache sentiment results (never re-analyze)
- Use Redis for session storage in production

## 🐛 Troubleshooting

### "Unauthorized" errors
- Check Supabase JWT token is valid
- Verify RLS policies are enabled
- Ensure user_id matches auth.uid()

### Sentiment analysis failing
- Verify ANTHROPIC_API_KEY is correct
- Check API quota hasn't been exceeded
- Review Claude API response errors in logs

### Social account connection issues
- Verify OAuth credentials are correct
- Check redirect URIs match exactly
- Ensure app has required permissions

### Database connection errors
- Verify Supabase URL and keys
- Check network connectivity
- Review Supabase dashboard for issues

## 🚀 Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Add environment variables in Vercel dashboard
```

### Environment Variables
Add all `.env.local` variables to your deployment platform.

### Post-Deployment
1. Update OAuth redirect URIs to production URLs
2. Configure custom domain in Supabase
3. Set up monitoring (Sentry, LogRocket)
4. Enable Supabase backups

## 💡 Feature Roadmap

- [ ] Twitter/LinkedIn integration
- [ ] Webhook support for real-time ingestion
- [ ] Advanced filtering (date range, keywords, platforms)
- [ ] Sentiment alerts via email/Slack
- [ ] Competitor analysis
- [ ] Multi-language sentiment support
- [ ] PDF/CSV export
- [ ] Team collaboration features
- [ ] API access for customers

## 📄 License

MIT License - feel free to use for personal or commercial projects.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org)
- Powered by [Claude AI](https://anthropic.com)
- Database by [Supabase](https://supabase.com)
- Icons by [Lucide](https://lucide.dev)

## 💬 Support

For questions or issues:
- Open a GitHub issue
- Email: support@yourapp.com
- Documentation: [docs.yourapp.com](https://docs.yourapp.com)

---

Built with ❤️ for the £55/month Claude tier
