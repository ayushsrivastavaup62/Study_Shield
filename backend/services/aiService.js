const { GoogleGenerativeAI } = require('@google/generative-ai');
const OpenAI = require('openai');

class AIService {
  constructor() {
    this.provider = process.env.AI_PROVIDER || 'GEMINI';
    this.maxRetries = 3;
    this.timeout = 10000; // 10 seconds
    
    // Initialize AI providers with validation
    try {
      if (this.provider === 'GEMINI') {
        if (!process.env.GEMINI_API_KEY) {
          console.warn('⚠️ GEMINI_API_KEY not found, using fallback classification only');
          this.genAI = null;
        } else {
          this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
          // Use gemini-1.5-flash which is more stable
          this.model = this.genAI.getGenerativeModel({ 
            model: 'models/gemini-1.5-pro-latest',
            generationConfig: {
              temperature: 0.1,
              maxOutputTokens: 50,
            }
          });
          console.log('✅ Gemini AI initialized successfully');
        }
      } else if (this.provider === 'OPENAI') {
        if (!process.env.OPENAI_API_KEY) {
          console.warn('⚠️ OPENAI_API_KEY not found, using fallback classification only');
          this.openai = null;
        } else {
          this.openai = new OpenAI({ 
            apiKey: process.env.OPENAI_API_KEY,
            timeout: this.timeout
          });
          console.log('✅ OpenAI initialized successfully');
        }
      }
    } catch (error) {
      console.error('❌ AI Provider initialization failed:', error.message);
      this.genAI = null;
      this.openai = null;
    }
  }

  async classifyContent(videoData) {
    const title = videoData.title || 'N/A';
    const channelTitle = videoData.channelTitle || 'N/A';
    
    console.log(`\n==================================================`);
    console.log(`[HYBRID FILTER] Starting classification for: "${title}" [Channel: ${channelTitle}]`);

    // 1. Run deterministic weighted scoring hybrid analysis
    const scoringResult = this.runHybridScoring(videoData);

    console.log(`[HYBRID FILTER] Confidence Scores:`);
    console.log(` - Educational Score: ${scoringResult.educationalScore}`);
    console.log(` - Non-Educational Score: ${scoringResult.nonEducationalScore}`);
    console.log(` - Matched Educational Keywords:`, scoringResult.matchedEdKeywords);
    console.log(` - Matched Non-Educational Keywords:`, scoringResult.matchedNonEdKeywords);

    // 2. Check high-confidence ALLOW or BLOCK conditions
    if (scoringResult.decision !== null) {
      console.log(`[HYBRID FILTER] High-Confidence Deterministic Decision: ${scoringResult.decision ? 'ALLOW (EDUCATIONAL)' : 'BLOCK (NON-EDUCATIONAL)'} (Reason: ${scoringResult.confidence})`);
      console.log(`==================================================\n`);
      return scoringResult.decision;
    }

    // 3. Borderline Case - Use AI model if available for ultimate tie-breaking
    if (this.genAI || this.openai) {
      console.log(`[HYBRID FILTER] Borderline/Uncertain scores. Invoking AI model for ultimate tie-breaker...`);
      try {
        const aiDecision = await this.classifyContentWithAI(videoData);
        console.log(`[HYBRID FILTER] AI Tie-Breaker Decision: ${aiDecision ? 'ALLOW (EDUCATIONAL)' : 'BLOCK (NON-EDUCATIONAL)'}`);
        console.log(`==================================================\n`);
        return aiDecision;
      } catch (aiError) {
        console.error(`[HYBRID FILTER] AI Tie-Breaker failed:`, aiError.message);
      }
    }

    // 4. Default Smart Rules if AI is unavailable or fails:
    // Prefer EDUCATIONAL if scores are close or tied
    let finalDecision = true;
    let reason = 'Tie or close scores default to ALLOW';
    
    if (scoringResult.nonEducationalScore > scoringResult.educationalScore) {
      finalDecision = false;
      reason = 'Non-educational score is higher';
    }

    console.log(`[HYBRID FILTER] AI unavailable or failed. Scoring Tie-Breaker: ${finalDecision ? 'ALLOW (EDUCATIONAL)' : 'BLOCK (NON-EDUCATIONAL)'} (Reason: ${reason})`);
    console.log(`==================================================\n`);
    return finalDecision;
  }

  runHybridScoring(videoData) {
    const title = (videoData.title || '').toLowerCase();
    const description = (videoData.description || '').toLowerCase();
    const channelTitle = (videoData.channelTitle || '').toLowerCase();
    const categoryId = (videoData.categoryId || '').toString();
    const tags = (videoData.tags || []).map(t => t.toLowerCase());

    let educationalScore = 0;
    let nonEducationalScore = 0;
    const matchedEdKeywords = [];
    const matchedNonEdKeywords = [];

    // --- 1. Trusted Educational Channels (Auto-Allow) ---
    const trustedChannels = [
      'physics wallah', 'physicswallah', 'pw', 'khan sir', 'khan academy',
      'unacademy', 'apna college', 'codewithharry', 'code with harry',
      'gate smashers', 'gatesmashers', 'take u forward', 'takeuforward',
      'striver', '3blue1brown', '3 blue 1 brown', 'mit opencourseware',
      'stanford', 'computerphile', 'numberphile', 'crashcourse', 'crash course',
      'freecodecamp', 'lex fridman', 'veritasium', 'vsauce', 'ted-ed', 'tedx', 'ted'
    ];

    const isTrustedChannel = trustedChannels.some(channel => {
      return channelTitle.includes(channel);
    });

    if (isTrustedChannel) {
      return {
        decision: true,
        confidence: 'high_trusted_channel',
        educationalScore: 99,
        nonEducationalScore: 0,
        matchedEdKeywords: ['TRUSTED_CHANNEL'],
        matchedNonEdKeywords: []
      };
    }

    // --- 2. Hard-Block Keywords (Immediate Block) ---
    const hardBlockKeywords = [
      'pubg', 'free fire', 'freefire', 'gta 5', 'gta5', 'gta v', 'grand theft auto',
      'gaming shorts', 'meme', 'memes', 'prank', 'pranks', 'roast', 'roasts', 'roasting',
      'reaction video', 'tiktok', 'reels', 'instagram reels', 'viral shorts', 'funny shorts',
      'cringe compilation', 'cringe', 'music video', 'diss track', 'fan wars', 'sigma edit',
      'sigma edits', 'attitude status', 'thirst trap', 'thirsttrap', 'gambling', 'betting', 'casino'
    ];

    const matchedHardBlock = [];
    for (const keyword of hardBlockKeywords) {
      if (this.keywordMatches(title, keyword) || 
          tags.some(tag => this.keywordMatches(tag, keyword)) || 
          (keyword === 'reaction video' && this.keywordMatches(description, keyword))) {
        matchedHardBlock.push(keyword);
      }
    }

    if (matchedHardBlock.length > 0) {
      return {
        decision: false,
        confidence: 'high_hard_block',
        educationalScore: 0,
        nonEducationalScore: 99,
        matchedEdKeywords: [],
        matchedNonEdKeywords: matchedHardBlock
      };
    }

    // --- 3. Weighted Keywords Scoring ---
    const educationalKeywords = [
      'tutorial', 'learn', 'learning', 'course', 'lecture', 'education', 'educational',
      'coding', 'programming', 'developer', 'software', 'development', 'web development',
      'frontend', 'backend', 'full stack', 'mern', 'react', 'angular', 'vue', 'node',
      'express', 'mongodb', 'sql', 'database', 'javascript', 'typescript', 'python',
      'java', 'c++', 'cpp', 'c#', 'golang', 'rust', 'devops', 'linux', 'git', 'github',
      'api', 'leetcode', 'dsa', 'algorithm', 'algorithms', 'data structure', 'data structures',
      'math', 'mathematics', 'algebra', 'geometry', 'calculus', 'physics', 'mechanics',
      'thermodynamics', 'electromagnetics', 'quantum', 'chemistry', 'organic chemistry',
      'inorganic', 'biology', 'science', 'scientific', 'experiment', 'engineering',
      'university', 'college', 'school', 'research', 'thesis', 'jee', 'neet', 'upsc',
      'ssc', 'gate', 'cat', 'boards', 'cbse', 'ncert', 'placement prep', 'interview prep',
      'explained', 'explanation', 'how to', 'guide', 'tips', 'lesson', 'class', 'chapter',
      'documentary', 'case study', 'history', 'geography', 'economics', 'finance'
    ];

    const nonEducationalKeywords = [
      'gaming', 'gameplay', 'gamer', 'game', 'playthrough', 'stream', 'livestream',
      'pubg', 'free fire', 'gta', 'minecraft', 'fortnite', 'roblox', 'cod', 'fifa', 'esports',
      'meme', 'memes', 'funny', 'comedy', 'jokes', 'standup', 'roast', 'prank', 'trolling',
      'challenge', 'vlog', 'vlogs', 'vlogger', 'daily vlog', 'lifestyle', 'routine', 'haul',
      'unboxing', 'makeup', 'beauty', 'fashion', 'movie', 'movies', 'film', 'teaser',
      'trailer', 'web series', 'netflix', 'episode', 'season', 'drama', 'music', 'song',
      'songs', 'album', 'remix', 'rap', 'lofi', 'dance', 'cover song', 'viral', 'trending',
      'shorts', 'reels', 'celebrity', 'gossip', 'controversy', 'sigma', 'attitude',
      'flirting', 'asmr', 'pranks', 'funny moments', 'highlights', 'show', 'entertainment'
    ];

    // A. Title Scoring (Weight = 3)
    for (const keyword of educationalKeywords) {
      if (this.keywordMatches(title, keyword)) {
        educationalScore += 3;
        matchedEdKeywords.push(`${keyword}(title)`);
      }
    }
    for (const keyword of nonEducationalKeywords) {
      if (this.keywordMatches(title, keyword)) {
        nonEducationalScore += 3;
        matchedNonEdKeywords.push(`${keyword}(title)`);
      }
    }

    // B. Tags Scoring (Weight = 2)
    for (const tag of tags) {
      for (const keyword of educationalKeywords) {
        if (this.keywordMatches(tag, keyword)) {
          educationalScore += 2;
          matchedEdKeywords.push(`${keyword}(tag)`);
        }
      }
      for (const keyword of nonEducationalKeywords) {
        if (this.keywordMatches(tag, keyword)) {
          nonEducationalScore += 2;
          matchedNonEdKeywords.push(`${keyword}(tag)`);
        }
      }
    }

    // C. Description Scoring (Weight = 1)
    for (const keyword of educationalKeywords) {
      if (this.keywordMatches(description, keyword)) {
        educationalScore += 1;
        matchedEdKeywords.push(`${keyword}(desc)`);
      }
    }
    for (const keyword of nonEducationalKeywords) {
      if (this.keywordMatches(description, keyword)) {
        nonEducationalScore += 1;
        matchedNonEdKeywords.push(`${keyword}(desc)`);
      }
    }

    // --- 4. Category Analysis ---
    if (categoryId === '27' || categoryId === '28') {
      educationalScore += 3;
      matchedEdKeywords.push('category(education/sci-tech)');
    }
    if (categoryId === '20' || categoryId === '10' || categoryId === '24') {
      nonEducationalScore += 3;
      matchedNonEdKeywords.push('category(gaming/music/ent)');
    }

    // --- 5. Channel Name Analysis ---
    const edChannelKeywords = ['academy', 'education', 'lecture', 'lectures', 'classroom', 'school', 'hub', 'tutorials', 'science', 'maths', 'physics', 'chemistry', 'coding'];
    const entChannelKeywords = ['gaming', 'games', 'vlogs', 'meme', 'music', 'tv', 'entertainment'];

    for (const keyword of edChannelKeywords) {
      if (channelTitle.includes(keyword)) {
        educationalScore += 2;
        matchedEdKeywords.push(`channel(${keyword})`);
      }
    }
    for (const keyword of entChannelKeywords) {
      if (channelTitle.includes(keyword)) {
        nonEducationalScore += 2;
        matchedNonEdKeywords.push(`channel(${keyword})`);
      }
    }

    // --- 6. Smart Rule: Interview/Documentary Safety ---
    const isDocOrInterview = ['documentary', 'interview', 'biography', 'podcast', 'historical', 'discussion', 'talk'].some(kw => 
      this.keywordMatches(title, kw) || this.keywordMatches(description, kw)
    );
    if (isDocOrInterview && educationalScore > 0) {
      educationalScore += 2;
      matchedEdKeywords.push('smart_rule(doc/interview safety)');
    }

    // --- 7. Decision Logic ---
    const uniqueEd = Array.from(new Set(matchedEdKeywords));
    const uniqueNonEd = Array.from(new Set(matchedNonEdKeywords));

    let decision = null;
    let confidence = 'medium';

    if (nonEducationalScore >= educationalScore + 3) {
      decision = false;
      confidence = 'high_score_block';
    } else if (educationalScore >= 5 && educationalScore > nonEducationalScore) {
      decision = true;
      confidence = 'high_score_allow';
    }

    return {
      decision,
      confidence,
      educationalScore,
      nonEducationalScore,
      matchedEdKeywords: uniqueEd,
      matchedNonEdKeywords: uniqueNonEd
    };
  }

  async classifyContentWithAI(videoData) {
    const { title, description, tags, category, categoryId } = videoData;
    const categoryLabel = category || categoryId || 'N/A';
    
    const prompt = `You are a content moderator for an educational platform. Classify this YouTube video as EDUCATIONAL or NON-EDUCATIONAL.

Video Title: ${title}
Description: ${description || 'N/A'}
Tags: ${tags ? tags.join(', ') : 'N/A'}
Category: ${categoryLabel}

EDUCATIONAL content includes:
- Coding tutorials, programming, DSA, software development
- Mathematics, Physics, Chemistry, Science, Engineering
- AI/ML, Technology, Computer Science
- Productivity tips, study techniques
- Educational podcasts, lectures, courses
- How-to tutorials, learning content

NON-EDUCATIONAL content includes:
- Gaming, gaming streams, esports
- Memes, funny videos, entertainment
- Roast videos, pranks, comedy
- Music videos, reactions
- Vlogs, lifestyle content, movie clips
- Shorts entertainment, viral videos

Respond with ONLY one word: EDUCATIONAL or NON-EDUCATIONAL`;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        console.log(`🔄 AI classification attempt ${attempt}/${this.maxRetries}`);
        
        let result;
        if (this.provider === 'GEMINI' && this.genAI) {
          result = await this.classifyWithGemini(prompt);
        } else if (this.provider === 'OPENAI' && this.openai) {
          result = await this.classifyWithOpenAI(prompt);
        } else {
          throw new Error('No valid AI provider configured');
        }
        
        console.log(`✅ AI classification result: ${result ? 'EDUCATIONAL' : 'NON-EDUCATIONAL'}`);
        return result;
        
      } catch (error) {
        console.error("FULL GEMINI ERROR:", error);
        console.error(`❌ AI classification attempt ${attempt} failed:`, error.message);
        
        if (attempt === this.maxRetries) {
          console.log('⚠️ All AI attempts failed, using fallback classification');
          return this.fallbackClassification(videoData);
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
    
    return this.fallbackClassification(videoData);
  }

  async classifyWithGemini(prompt) {
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('AI request timeout')), this.timeout);
    });

    const classificationPromise = this.model.generateContent(prompt);
    
    const result = await Promise.race([classificationPromise, timeoutPromise]);
    const response = result.response.text().trim().toUpperCase();
    
    // Validate response
    if (response === 'EDUCATIONAL') return true;
    if (response === 'NON-EDUCATIONAL') return false;
    
    // If response is unclear, use fallback
    console.log('⚠️ Unclear AI response, using fallback');
    throw new Error('Unclear AI response');
  }

  async classifyWithOpenAI(prompt) {
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('AI request timeout')), this.timeout);
    });

    const classificationPromise = this.openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 10,
      temperature: 0.1
    });
    
    const result = await Promise.race([classificationPromise, timeoutPromise]);
    const response = result.choices[0]?.message?.content?.trim().toUpperCase() || '';
    
    // Validate response
    if (response === 'EDUCATIONAL') return true;
    if (response === 'NON-EDUCATIONAL') return false;
    
    console.log('⚠️ Unclear AI response, using fallback');
    throw new Error('Unclear AI response');
  }

  /** Word-boundary match to avoid false positives (e.g. "cod" in "code", "reaction" in chemistry titles). */
  keywordMatches(text, keyword) {
    const k = keyword.toLowerCase().trim();
    if (!k) return false;
    if (k.includes(' ')) return text.includes(k);
    if (!/^[a-z0-9+#.]+$/i.test(k)) return text.includes(k);
    const escaped = k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`(?:^|[^a-z0-9])${escaped}(?:[^a-z0-9]|$)`, 'i').test(text);
  }

  fallbackClassification(videoData) {
    const { title, description, tags, category, categoryId } = videoData;
    const text = `${title} ${description || ''} ${tags ? tags.join(' ') : ''} ${category || ''} ${categoryId || ''}`.toLowerCase();

    console.log('🔧 Using keyword-based fallback classification');
    
    // Expanded educational keywords
    const educationalKeywords = [
'tutorial','learn','learning','course','lecture','education','educational',
'coding','programming','developer','software','development','web development',
'frontend','backend','full stack','mern','mean','react','angular','vue',
'node','express','mongodb','sql','mysql','postgresql','database','firebase',
'javascript','typescript','python','java','c','c++','cpp','c sharp','c#',
'golang','rust','php','kotlin','swift','ruby','perl','r programming',
'html','css','tailwind','bootstrap','redux','nextjs','next js',
'data science','machine learning','deep learning','artificial intelligence',
'ai','ml','nlp','computer vision','tensorflow','pytorch','opencv',
'neural network','algorithm','data structure','dsa','competitive programming',
'leetcode','codeforces','codechef','geeksforgeeks','interview prep',
'system design','operating system','os','dbms','oops','cn','computer networks',
'cyber security','ethical hacking','cloud computing','aws','azure','gcp',
'docker','kubernetes','devops','linux','git','github','api','rest api',
'graphql','microservices','software engineering','debugging','deployment',
'hosting','vercel','netlify','render','npm','yarn','vite','webpack',

'math','mathematics','algebra','geometry','trigonometry','calculus',
'integration','differentiation','probability','statistics','linear algebra',
'matrix','determinant','vector','equation','formula','theorem','derivation',
'physics','mechanics','thermodynamics','electromagnetics','quantum physics',
'electronics','digital electronics','analog electronics','microprocessor',
'microcontroller','embedded systems','vlsi','signals and systems',
'communication system','optical communication','radar','antenna',
'chemistry','organic chemistry','inorganic chemistry','physical chemistry',
'biology','botany','zoology','genetics','biotechnology','anatomy',
'science','scientific','experiment','lab','practical',

'engineering','mechanical engineering','civil engineering',
'electrical engineering','electronics engineering','computer science',
'information technology','ece','cse','it engineering',

'study','studying','focus','productivity','deep work','pomodoro',
'note making','revision','exam strategy','time management',
'self improvement','discipline','career guidance','motivation for students',

'how to','guide','tips','explained','explanation','lesson','class',
'chapter','unit','topic','concept','practice','assignment','homework',
'numericals','problem solving','solutions','question answer',
'important questions','one shot','revision series','marathon class',

'jee','jee mains','jee advanced','neet','upsc','ssc','gate','cat',
'iit jam','nda','cds','bank po','railway exam','cuet','boards',
'cbse','icse','ncert','semester exam','placement preparation',

'iit','nit','iiit','university','college','school','academy',
'research','academic','thesis','seminar','workshop','bootcamp',

'khan sir','physics wallah','pw','unacademy','byjus','vedantu',
'apna college','code with harry','take u forward','striver',
'love babbar','gate smashers','knowledge gate',

'history','geography','political science','economics','english grammar',
'spoken english','vocabulary','communication skills','personality development',

'finance','stock market','investing','trading basics','economy',
'business studies','accountancy','entrepreneurship','startup',

'ai tools','chatgpt','openai','gemini ai','prompt engineering',
'automation','internet of things','iot','robotics','blockchain',

'current affairs','news analysis','educational podcast','case study',
'documentary','interview','career roadmap','roadmap','learning path',

'aptitude','reasoning','quantitative aptitude','logical reasoning',
'verbal ability','mock test','practice set','sample paper',

'medical lecture','anatomy lecture','pharmacology','physiology',
'pathology','biochemistry','surgery','clinical education',

'civil services','government jobs','job preparation','placement',
'resume building','interview questions','hr interview','technical interview',

'excel','power bi','tableau','analytics','business analytics',
'data visualization','pandas','numpy','matplotlib','scikit learn',

'networking','ccna','ccnp','routing','switching',
'hardware','computer architecture','assembly language',

'digital marketing','seo','content writing','copywriting',
'email marketing','social media marketing',

'language learning','german language','french language',
'japanese language','hindi grammar','english speaking',

'philosophy','psychology','sociology','law','constitution',
'environmental science','disaster management',

'kids learning','educational animation','school learning',
'nursery rhymes educational','general knowledge','gk',

'btech','mtech','mba','bca','mca','bsc','msc','phd',

'seminar presentation','project demonstration','mini project',
'major project','capstone project','innovation','prototype',

'fitness education','nutrition science','health science',
'yoga tutorial','meditation guide',

'excel tutorial','word tutorial','powerpoint tutorial',
'computer basics','typing tutorial','ms office',

'ethical ai','space science','astronomy','astrophysics',
'satellite communication','wireless communication',

'arduino','raspberry pi','esp32','sensor','automation project',
'pcb design','circuit analysis','simulation','multisim','ltspice',

'vhdl','verilog','fpga','cad tools','electromagnetic field theory',

'numerical methods','numerical techniques','discrete mathematics',
'compiler design','theory of computation',

'android development','ios development','flutter','react native',

'open source','hackathon','internship preparation',
'placement series','coding interview','problem solving skills',

'teacher','professor','mentor','student community',
'educational livestream','doubt solving','concept clearing',

'board exam strategy','last minute revision','important derivations',
'formula revision','tricks and shortcuts','short tricks',

'public speaking','presentation skills','critical thinking',
'creative thinking','innovation skills'
];

    
    // Expanded non-educational keywords
    const nonEducationalKeywords = [
'gaming','game','gameplay','gamer','esports','stream','livestream',
'pubg','bgmi','free fire','valorant','minecraft','fortnite','gta',
'gta 5','call of duty','cod','fifa','efootball','roblox',
'gaming shorts','gaming montage','clutch','kills','rank push',

'meme','memes','funny','comedy','humor','lol','hilarious',
'jokes','standup comedy','stand up','funny moments','fails',
'dark humor','roast','roasting','reaction','reaction video',
'trolling','prank','pranks','social experiment','challenge','dare',

'music','music video','song','songs','album','concert',
'dj','remix','lofi','rap','hip hop','bollywood songs',
'punjabi songs','romantic songs','sad songs','party songs',
'lyrics','audio song','dance video','dance performance',
'choreography','cover song','karaoke',

'vlog','vlogger','daily vlog','travel vlog','lifestyle',
'day in my life','morning routine','night routine',
'vacation vlog','trip vlog','couple vlog','family vlog',

'movie','movies','film','cinema','web series','netflix',
'amazon prime','hotstar','trailer','movie clip','scene',
'cinematic','film review','movie review','teaser',

'entertainment','viral','trending','tiktok','shorts',
'youtube shorts','instagram reels','reels','snapchat',
'viral shorts','viral video','status video',

'celebrity','celeb','actor','actress','influencer',
'drama','beef','controversy','gossip','breakup',
'relationship goals','dating','love story',

'fashion','style','makeup','beauty','skincare',
'haul','shopping haul','unboxing','luxury lifestyle',
'outfit','ootd','jewelry','sneakers','streetwear',

'food vlog','street food','mukbang','eating challenge',
'restaurant review','food challenge','asmr eating',

'car review','bike review','supercar','sports car',
'modified car','racing','drift','burnout',

'anime','cartoon','amv','fan edit','fan war',
'marvel','dc','superhero','edit compilation',

'wwe','ufc highlights','football highlights',
'cricket highlights','sports entertainment',
'fan reaction','match reaction',

'motivation shorts','sigma edits','attitude status',
'alpha male','sad edit','emotional edit','shayari status',

'dating advice','relationship advice','girlfriend prank',
'boyfriend prank','couple challenge',

'crypto hype','get rich quick','lottery','casino',
'gambling','betting','trading signals',

'ghost prank','horror prank','scary videos','jump scare',
'creepy content','paranormal entertainment',

'luxury','rich lifestyle','celebrity house tour',
'private jet','super rich','millionaire lifestyle',

'pet funny','cat memes','dog memes','animal funny videos',

'twerk','bikini','thirst trap','hot edits','fan service',

'fanfiction','shipping','stan culture','fandom',

'reality show','bigg boss','splitsvilla','mtv roadies',

'asmr','sleep sounds','girlfriend asmr','roleplay asmr',

'boxing entertainment','celebrity fight','trash talk',

'dance challenge','viral dance','instagram trend',
'tiktok trend','trend compilation',

'funny shorts','meme compilation','best moments',
'epic moments','rage compilation',

'clickbait','fake prank','fake giveaway','drama alert',

'beer pong','party vlog','nightclub','clubbing',
'party night','drinking challenge',

'fan meetup','subscriber special','qna vlog',
'house tour','room tour',

'relationship drama','family drama','crying video',
'breakdown video','public stunt',

'celebrity news','paparazzi','award show','red carpet',

'viral instagram','snap story','whatsapp status',
'facebook reels','trending now',

'comedy shorts','funny reels','reaction shorts',
'gaming shorts','meme shorts',

'celeb gossip','internet drama','influencer controversy',

'fan edit','edit audio','slowed reverb','nightcore',

'reality entertainment','scripted video','fake scenario',

'fun challenge','24 hour challenge','overnight challenge',

'music mashup','viral audio','bass boosted',

'beauty vlog','spa vlog','salon vlog',

'shopping vlog','mall vlog','random vlog',

'thug life','savage moments','crazy moments',

'public interview entertainment','street flirting',
'pickup lines','dating experiment',

'funny gaming','rage quit','stream highlights',

'celebration vlog','birthday vlog','wedding vlog',

'fan wars','console wars','toxic gameplay',

'reaction mashup','cringe compilation','fails compilation',

'celebrity interview entertainment','paparazzi moments'
];

    
    const educationalScore = educationalKeywords.filter((keyword) =>
      this.keywordMatches(text, keyword)
    ).length;

    const nonEducationalScore = nonEducationalKeywords.filter((keyword) =>
      this.keywordMatches(text, keyword)
    ).length;

    const MIN_EDUCATIONAL_SCORE = 2;
    const BLOCK_MARGIN = 2;

    console.log(
      `📊 Keyword scores - Educational: ${educationalScore}, Non-educational: ${nonEducationalScore}`
    );

    const hardBlockKeywords = [
      'prank',
      'roast',
      'reels',
      'tiktok',
      'meme',
      'pubg',
      'free fire',
      'gaming shorts',
      'viral shorts',
      'music video',
    ];

    if (hardBlockKeywords.some((keyword) => this.keywordMatches(text, keyword))) {
      console.log('🚫 Hard blocked by strong entertainment keyword');
      return false;
    }

    const trustedEducationalChannels = [
      'khan sir',
      'physics wallah',
      'pw',
      'unacademy',
      'apna college',
      'code with harry',
      'love babbar',
      'take u forward',
      'gate smashers',
      'knowledge gate',
      'striver',
    ];

    if (trustedEducationalChannels.some((channel) => text.includes(channel))) {
      console.log('✅ Trusted educational source');
      return true;
    }

    if (
      educationalScore >= MIN_EDUCATIONAL_SCORE &&
      educationalScore >= nonEducationalScore
    ) {
      console.log('✅ Allowed: educational score meets threshold');
      return true;
    }

    if (nonEducationalScore >= educationalScore + BLOCK_MARGIN) {
      console.log('🚫 Blocked: non-educational score leads by margin');
      return false;
    }

    if (educationalScore >= nonEducationalScore) {
      console.log('✅ Allowed: tie or close scores favor educational');
      return true;
    }

    if (nonEducationalScore > educationalScore) {
      console.log('🚫 Blocked: non-educational score higher');
      return false;
    }

    console.log('✅ Allowed: uncertain content defaults to educational');
    return true;
  }

  // Health check method
  async healthCheck() { 
    if (this.provider === 'GEMINI' && this.genAI) {
      try {
        await this.model.generateContent('test');
        return { status: 'healthy', provider: 'GEMINI' };
      } catch (error) {
        return { status: 'unhealthy', provider: 'GEMINI', error: error.message };
      }
    } else if (this.provider === 'OPENAI' && this.openai) {
      try {
        await this.openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: 'test' }],
          max_tokens: 5
        });
        return { status: 'healthy', provider: 'OPENAI' };
      } catch (error) {
        return { status: 'unhealthy', provider: 'OPENAI', error: error.message };
      }
    }
    return { status: 'fallback_only', provider: 'none' };
  }
}

module.exports = new AIService();
