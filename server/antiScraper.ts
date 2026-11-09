import { Request, Response, NextFunction } from 'express';

// Track daily lead extraction volume per IP / User identifier
interface UsageRecord {
  date: string; // YYYY-MM-DD
  count: number;
}

const dailyLeadExtractTracker = new Map<string, UsageRecord>();
const MAX_THIRD_PARTY_DAILY_EXTRACT = 500;

// Known scraping and 3rd party extension / bot user-agent fingerprints
const SCRAPER_USER_AGENT_PATTERNS = [
  /python-requests/i,
  /scrapy/i,
  /curl/i,
  /wget/i,
  /postman/i,
  /insomnia/i,
  /puppeteer/i,
  /playwright/i,
  /selenium/i,
  /phantomjs/i,
  /headlesschrome/i,
  /axios/i,
  /go-http-client/i,
  /java\//i,
  /libwww/i,
  /extractor/i,
  /scraper/i,
  /extension/i
];

function getClientIdentifier(req: any): string {
  if (req.user?.id) {
    return `user_${req.user.id}`;
  }
  const forwarded = req.headers['x-forwarded-for'];
  const ip = typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : req.socket?.remoteAddress || 'unknown_client';
  return `ip_${ip}`;
}

function getTodayString(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Hard Anti-Scraper & 3rd-Party Extractor Rate Limiter
 * Restricts 3rd party plugins, automated extensions, headless bots, and extractors
 * to an absolute maximum of 500 leads extracted per 24-hour day.
 */
export function antiScraperProtectionMiddleware(req: any, res: Response, next: NextFunction) {
  const isSuperAdmin = Boolean(
    req.user && (
      req.user.isSuperAdmin ||
      req.user.is_super_admin ||
      req.user.role === 'superadmin' ||
      req.user.email === 'alex@leadsarrow.io' ||
      req.user.email === 'alex@nexuslead.io'
    )
  );

  // Superadmins have unrestricted platform inspection
  if (isSuperAdmin) {
    return next();
  }

  const userAgent = String(req.headers['user-agent'] || '');
  const isAutomatedOrBot = SCRAPER_USER_AGENT_PATTERNS.some((pat) => pat.test(userAgent));

  // If detected as known headless/scraping agent without browser context, block immediately
  if (isAutomatedOrBot && !req.headers['sec-ch-ua'] && !req.headers['accept-language']) {
    return res.status(403).json({
      error: 'Access blocked: Automated extractors and non-browser clients are strictly restricted.',
      code: 'EXTRACTOR_FORBIDDEN'
    });
  }

  // Intercept response to count extracted leads
  const clientId = getClientIdentifier(req);
  const today = getTodayString();
  const currentRecord = dailyLeadExtractTracker.get(clientId);

  let currentCount = 0;
  if (currentRecord && currentRecord.date === today) {
    currentCount = currentRecord.count;
  } else {
    dailyLeadExtractTracker.set(clientId, { date: today, count: 0 });
  }

  // Check if daily hard limit of 500 already reached
  if (currentCount >= MAX_THIRD_PARTY_DAILY_EXTRACT) {
    return res.status(429).json({
      error: `Security limit reached: You have reached the maximum daily limit of ${MAX_THIRD_PARTY_DAILY_EXTRACT} leads extracted per 24 hours. Automated 3rd-party extractors and bulk scrapers are strictly blocked.`,
      code: 'DAILY_EXTRACT_LIMIT_REACHED',
      limit: MAX_THIRD_PARTY_DAILY_EXTRACT,
      used: currentCount
    });
  }

  // Hook into res.json to track the number of leads successfully sent to the client
  const originalJson = res.json.bind(res);
  res.json = (body: any) => {
    let extractedNumber = 0;
    if (body?.leads && Array.isArray(body.leads)) {
      extractedNumber = body.leads.length;
    }

    if (extractedNumber > 0) {
      const rec = dailyLeadExtractTracker.get(clientId) || { date: today, count: 0 };
      if (rec.date === today) {
        rec.count += extractedNumber;
      } else {
        rec.date = today;
        rec.count = extractedNumber;
      }
      dailyLeadExtractTracker.set(clientId, rec);

      // Add strict rate-limit protection headers
      res.setHeader('X-Extraction-Daily-Limit', String(MAX_THIRD_PARTY_DAILY_EXTRACT));
      res.setHeader('X-Extraction-Daily-Used', String(rec.count));
      res.setHeader('X-Extraction-Remaining', String(Math.max(0, MAX_THIRD_PARTY_DAILY_EXTRACT - rec.count)));
    }

    return originalJson(body);
  };

  next();
}

