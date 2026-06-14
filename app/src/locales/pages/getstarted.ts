export const en = {
  getStarted: {
    heading: "Get Started",
    vision: {
      title: "Our Vision",
      content: `
### The Self Growth Philosophy

We believe that **true personal growth happens at the intersection of mind, body, and purpose**. Most people track their habits in one app, their fitness in another, and their goals on sticky notes. Self Growth brings it all together — giving you a unified, private, AI-powered platform to see how every part of your life connects.

### Why We Built This

Self-development is not a single metric. It's the compound effect of daily habits, consistent routines, deliberate learning, physical health, and intentional reflection. Self Growth was designed to:

- **Connect the dots** — See how your sleep affects your productivity, how your routines drive your skill growth, and how your habits compound toward your goals
- **Coach with context** — AI coaching that knows your actual data — not generic advice, but guidance grounded in your real progress, health metrics, and patterns
- **Keep you in control** — Your data stays on your device. No cloud accounts, no subscriptions for basic features, no selling your personal growth data
- **Grow with you** — From tracking your first habit to analyzing months of health data alongside skill development, the app scales with your journey

### The Bigger Picture

Self Growth is more than a tracker. It's a **personal growth operating system** that:

1. **Captures** — Goals, habits, routines, skills, learning, health, finances, and reflections in one place
2. **Connects** — Health data from Apple Health and Google Fit flows into the same system as your goals and habits
3. **Understands** — AI-powered semantic search and coaching sees patterns across all your data
4. **Guides** — Personalized insights and coaching adapt to your actual progress, not theoretical advice

### Our Commitment

- **Privacy first** — Local-first architecture. Your growth journey is yours alone
- **Open integration** — Apple Health, Google Fit, and the BWOC agent fleet — connect your existing tools
- **Holistic view** — Mind and body together, because you can't separate physical health from personal development
- **Actionable AI** — Every AI insight references your real data and suggests concrete next steps
`,
    },
    welcome: {
      title: "Welcome to Self Growth",
      content: `
Self Growth is a self-development tracking desktop app that helps you build better habits, track your learning, set goals, monitor your health, and get AI-powered coaching — all stored locally on your device.

### What you can do

- **Set Goals** — Define goals with target dates and track progress
- **Develop Habits** — Simple yes/no daily habit tracking with streaks
- **Build Routines** — Create daily/weekly routines with steps and mood tracking
- **Monitor Health** — Import Apple Health data or sync Google Fit for steps, heart rate, sleep, weight, calories, and workouts
- **Track Skills** — Monitor your skill levels across categories
- **Manage Learning** — Track courses, books, articles, and practice
- **Journal** — Write daily reflections with mood ratings
- **Ledger** — Track income and expenses for self-development investments (courses, books, coaching, subscriptions)
- **Todos** — Task management with priorities, due dates, and goal linking
- **AI Coach** — Get personalized advice based on your real data, including health metrics
- **AI Chat** — Multi-turn conversation with your AI coach
- **Smart Search** — Semantic search across all your data, including health summaries
- **Story Lab** — Generate and save inspirational stories from your progress
`,
    },
    setup: {
      title: "Setup Guide",
      content: `
### Step 1: Install the App

Download and install Self Growth for your platform. The app runs as a native desktop application.

### Step 2: Connect a BWOC Agent

Self Growth uses an agent in your **BWOC fleet** for AI features (coaching, insights, chat, stories, OCR). The agent owns its own LLM backend — the app only needs to know how to reach it.

1. Go to **Settings** in the app
2. Choose a **Transport**:
   - **A2A over HTTP** — point the **Agent URL** at the agent's A2A endpoint. This can be a local \`bwoc serve\` or a hosted endpoint on your fleet, so you can reach a gateway-hosted agent without running your own server.
   - **Local bwoc CLI** — runs \`bwoc\` on this machine against your workspace.
3. Set the **Agent ID** (default \`agent-growth-coach\`)
4. Click **Test Connection** to verify

> If you don't connect a BWOC agent, the app still works for tracking skills, routines, habits, goals, and journal — just without AI features.

### Step 3: Start Tracking

1. **Set a goal** — Go to Goals and define what you want to achieve
2. **Add a habit** — Go to Habits and create a simple daily habit
3. **Create a routine** — Go to Routines and set up a daily routine
4. **Import health data** — Go to Health and import your Apple Health export or connect Google Fit
5. **Add a skill** — Go to Skills and add something you want to develop
6. **Start learning** — Go to Learning and add a course, book, or article
7. **Track spending** — Go to Ledger and log your self-development investments
8. **Add todos** — Go to Todos and create tasks linked to your goals
9. **Write in your journal** — Go to Journal and write your first entry

### Step 4: Connect Health Data

Self Growth integrates with Apple Health and Google Fit to bring your health metrics into your self-development journey.

**Apple Health:**
1. On your iPhone, open the **Health** app
2. Tap your profile → **Export All Health Data**
3. Transfer the \`export.xml\` file to your computer
4. In Self Growth, go to **Health** → **Import XML Export**

**Google Fit:**
1. Create a project in [Google Cloud Console](https://console.cloud.google.com)
2. Enable the **Fitness API**
3. Create OAuth 2.0 credentials (Desktop app type)
4. In Self Growth, go to **Settings** → enter your Client ID and Client Secret
5. Go to **Health** → **Connect** → authenticate in your browser → paste the code

### Step 5: Use AI Features

Once your BWOC agent is connected:
- Ask the **AI Coach** questions on your Dashboard — it now includes your health data
- Generate **Insights** to see patterns across habits, goals, and health
- Get a **Weekly Summary** of your progress
- Open **Chat** for a deeper conversation
- Generate **Stories** inspired by your journey
`,
    },
    howto: {
      title: "How To Use",
      content: `
### Dashboard
Your home screen. Shows stats (streak, completions, routines, learning items, skills, goals) and quick access to AI Coach, Insights, and Weekly Summary.

### Goals
Set goals with descriptions and target dates. Update status as you make progress. Goals give direction to everything else you track.

### Habits
Simple daily tracking. Click the circles to mark a habit as done for each day. The app tracks your streak automatically.

### Routines
Create structured routines with multiple steps. Log completions with mood ratings. Great for morning routines, workout schedules, or study sessions.

### Health
Monitor your physical well-being with data from Apple Health and Google Fit. View summary cards with trends, interactive charts over time, and manage your data sources. Supported metrics include steps, heart rate, sleep, weight, calories burned, distance, active minutes, and workouts.

Health data is automatically included in AI coaching context and searchable via Smart Search after rebuilding the index.

### Skills
Track skills with categories (technical, soft, health, creative, business) and levels (0-10).

### Learning
Track courses, books, videos, and articles. Change status between Backlog, In Progress, and Completed.

### Ledger
Track your self-development finances. Log income and expenses across categories (courses, books, coaching, subscriptions, tools, health). View summary cards showing income, expenses, and balance. Filter by period (week/month/year) and category. See spending breakdown by category with visual bars.

### Todos
Manage tasks with priorities (low/medium/high/urgent), due dates with optional times, and categories. Link todos to goals for focused execution. Filter by status (pending/in_progress/completed) or priority. Mark tasks complete and track your progress.

### Journal
Write daily reflections. Add a mood rating to track how you feel over time. Supports markdown formatting.

### Chat
Have a multi-turn conversation with your AI coach. The coach has access to your tracked data — including health metrics — and can give personalized advice.

### Story Lab
Generate inspirational stories based on your tracked data. Choose a tone (encouraging, reflective, cinematic, playful, calm), write a prompt, and the AI creates a personalized story. Save your favorites.

### Smart Search
Search across all your skills, learning items, routines, todos, ledger entries, and daily health summaries using AI-powered semantic search. Click "Rebuild Index" to update the search index after adding new data.

### Settings
Configure your BWOC agent connection, Google Fit credentials, test connections, or reset all settings to defaults.
`,
    },
    faq: {
      title: "FAQ",
      content: `
**Where is my data stored?**
All data is stored locally on your device in a SQLite database. Nothing is sent to the cloud unless you use AI features, which communicate with your configured BWOC agent.

**Do I need an internet connection?**
No, except for AI features (coaching, chat, insights, stories) and Google Fit sync. All tracking features and Apple Health import work offline.

**Can I use this without a BWOC agent?**
Yes. Skills, routines, habits, goals, health tracking, ledger, todos, journal, and learning tracking all work without any AI connection.

**What is BWOC?**
BWOC is a backend-neutral framework for orchestrating AI agents. Self Growth addresses an agent in your BWOC fleet for its AI features; the agent runs whatever LLM backend you configure for it.

**How does health integration work?**
Self Growth supports two health data sources:
- **Apple Health**: Export your data as XML from the iPhone Health app and import it into Self Growth. Re-import anytime to update — duplicates are handled automatically.
- **Google Fit**: Connect via OAuth using your Google Cloud credentials. Sync pulls the last 30 days of fitness data.

Health data (steps, heart rate, sleep, weight, calories, distance, workouts) is stored locally and automatically included in AI coaching context and semantic search.

**How do I backup my data?**
Your database is stored at:
- **macOS**: \`~/Library/Application Support/com.bemindlabs.growth.v2/self-growth.db\`
- **Linux**: \`~/.local/share/self-growth/self-growth.db\`
- **Windows**: \`%AppData%\\\\BemindLabs\\\\Self Growth\\\\self-growth.db\`

Copy this file to back up all your data.

**How does Smart Search work?**
On desktop, the app generates vector embeddings locally using AllMiniLM-L6-v2. Click "Rebuild Index" in the Search page to index your data, then search using natural language. Health data is indexed as daily summaries covering the last 90 days.

**Can I export my data?**
Currently you can copy the SQLite database file directly. It can be opened with any SQLite viewer.

**What currencies does the Ledger support?**
The Ledger defaults to THB but supports any currency code per entry. Summary calculations are grouped by the most recent currency used.

**Can I link todos to goals?**
Yes. When creating a todo, you can optionally link it to an existing goal. This helps you break goals into actionable tasks.

**Is the AI reading all my data?**
When you use AI features, the app sends relevant context (recent skills, routines, goals, learning items, and 7-day health averages) to your configured BWOC agent. Financial (Ledger) and task (Todos) data is **not** sent to AI coaching — it is only searchable via Smart Search locally. AI data stays within your network when the agent runs on your own machine or fleet.
`,
    },
    terms: {
      title: "Terms & Conditions",
      content: `
**Last updated: March 2026**

### 1. Acceptance of Terms
By using Self Growth, you agree to these terms. If you do not agree, do not use the app.

### 2. Description of Service
Self Growth is a self-development tracking application that stores data locally on your device. AI features require a separately configured BWOC agent.

### 3. User Responsibilities
- You are responsible for maintaining the security of your device and data
- You are responsible for configuring and maintaining your own BWOC agent and fleet
- You are responsible for backing up your data

### 4. Data Ownership
All data you create in Self Growth belongs to you. The app stores data locally on your device. We do not collect, store, or have access to your data.

### 5. AI Features
AI features are powered by your BWOC agent. The quality, accuracy, and availability of AI responses depend on your agent configuration and the underlying LLM backend it uses.

### 6. Disclaimer
Self Growth is provided "as is" without warranties of any kind. The AI coaching features are for informational purposes only and do not constitute professional advice.

### 7. Limitation of Liability
Bemind Technology Co., Ltd. (Bemindlabs) shall not be liable for any damages arising from the use of this application.

### 8. Changes to Terms
We may update these terms from time to time. Continued use of the app constitutes acceptance of the updated terms.
`,
    },
    privacy: {
      title: "Privacy Policy",
      content: `
**Last updated: March 2026**

### Data Storage
All your data is stored **locally on your device** in a SQLite database. We do not operate any cloud servers or collect any user data.

### What We Don't Collect
- No personal information
- No usage analytics
- No crash reports
- No telemetry
- No cookies or tracking

### AI Feature Data Flow
When you use AI features (Coach, Chat, Insights, Stories), the app sends relevant context data to your **configured BWOC agent**. This includes:
- Recent skills and levels
- Active routines and completion data
- Learning items
- Goals
- Health metrics (7-day averages of steps, heart rate, sleep, etc.)
- Journal content (only when relevant to AI queries)

Ledger entries and todos are indexed for Smart Search but are **not** included in AI coaching context.

This data is sent to the agent you configure in Settings. When that agent runs on your own machine or fleet, this data never leaves your network.

### Health Data
Health data imported from Apple Health or synced from Google Fit is stored **locally on your device**. When using Google Fit sync, the app communicates with Google's Fitness API using your own OAuth credentials — no data passes through our servers.

### Third-Party Services
Self Growth does not integrate with any third-party analytics, advertising, or tracking services. External communication is limited to:
- Your configured **BWOC agent** (for AI features)
- **Google Fitness API** (only if you connect Google Fit, using your own credentials)

### Data Retention
Since all data is stored locally, you have full control over data retention. Delete the database file to remove all data.

### Children's Privacy
Self Growth is not directed at children under 13. We do not knowingly collect data from children.

### Contact
For privacy concerns, contact Bemind Technology Co., Ltd. (Bemindlabs).
`,
    },
  },
};

export const th = {
  getStarted: {
    heading: "เริ่มต้นใช้งาน",
    vision: {
      title: "วิสัยทัศน์ของเรา",
      content: `
### ปรัชญาของ Self Growth

เราเชื่อว่า **การเติบโตที่แท้จริงเกิดขึ้นบนจุดบรรจบของจิตใจ ร่างกาย และเป้าหมายชีวิต** คนส่วนใหญ่ติดตามนิสัยในแอปหนึ่ง ติดตามสุขภาพในอีกแอปหนึ่ง และจดเป้าหมายไว้บนกระดาษโน้ต Self Growth รวมทุกอย่างเข้าด้วยกัน — มอบแพลตฟอร์มที่เป็นหนึ่งเดียว เป็นส่วนตัว และขับเคลื่อนด้วย AI ให้คุณเห็นว่าทุกส่วนของชีวิตเชื่อมโยงกันอย่างไร

### ทำไมเราถึงสร้างสิ่งนี้

การพัฒนาตนเองไม่ใช่ตัวชี้วัดเพียงตัวเดียว แต่เป็นผลรวมที่ทบต้นจากนิสัยประจำวัน กิจวัตรที่สม่ำเสมอ การเรียนรู้อย่างตั้งใจ สุขภาพกาย และการทบทวนตนเองอย่างมีจุดมุ่งหมาย Self Growth ถูกออกแบบมาเพื่อ:

- **เชื่อมโยงจุดต่าง ๆ** — เห็นว่าการนอนของคุณส่งผลต่อประสิทธิภาพการทำงานอย่างไร กิจวัตรของคุณขับเคลื่อนการพัฒนาทักษะอย่างไร และนิสัยของคุณทบต้นไปสู่เป้าหมายอย่างไร
- **โค้ชอย่างเข้าใจบริบท** — การโค้ชด้วย AI ที่รู้จักข้อมูลจริงของคุณ — ไม่ใช่คำแนะนำทั่วไป แต่เป็นคำชี้แนะที่อิงจากความก้าวหน้าจริง ตัวชี้วัดสุขภาพ และรูปแบบของคุณ
- **ให้คุณเป็นผู้ควบคุม** — ข้อมูลของคุณอยู่บนอุปกรณ์ของคุณ ไม่มีบัญชีคลาวด์ ไม่มีค่าสมาชิกสำหรับฟีเจอร์พื้นฐาน และไม่มีการขายข้อมูลการเติบโตส่วนตัวของคุณ
- **เติบโตไปพร้อมคุณ** — ตั้งแต่การติดตามนิสัยแรกของคุณ ไปจนถึงการวิเคราะห์ข้อมูลสุขภาพหลายเดือนควบคู่กับการพัฒนาทักษะ แอปนี้ปรับขนาดไปตามเส้นทางของคุณ

### ภาพที่ใหญ่กว่า

Self Growth เป็นมากกว่าเครื่องมือติดตาม มันคือ **ระบบปฏิบัติการเพื่อการเติบโตส่วนบุคคล** ที่:

1. **รวบรวม** — เป้าหมาย นิสัย กิจวัตร ทักษะ การเรียนรู้ สุขภาพ การเงิน และการทบทวนตนเอง ไว้ในที่เดียว
2. **เชื่อมต่อ** — ข้อมูลสุขภาพจาก Apple Health และ Google Fit ไหลเข้าสู่ระบบเดียวกับเป้าหมายและนิสัยของคุณ
3. **เข้าใจ** — การค้นหาเชิงความหมายและการโค้ชด้วย AI มองเห็นรูปแบบในข้อมูลทั้งหมดของคุณ
4. **ชี้แนะ** — ข้อมูลเชิงลึกและการโค้ชที่ปรับให้เข้ากับความก้าวหน้าจริงของคุณ ไม่ใช่คำแนะนำเชิงทฤษฎี

### คำมั่นสัญญาของเรา

- **ความเป็นส่วนตัวมาก่อน** — สถาปัตยกรรมแบบ local-first เส้นทางการเติบโตของคุณเป็นของคุณคนเดียว
- **การเชื่อมต่อแบบเปิด** — Apple Health, Google Fit และกองทัพเอเจนต์ BWOC — เชื่อมต่อเครื่องมือที่คุณมีอยู่แล้ว
- **มุมมองแบบองค์รวม** — จิตใจและร่างกายไปด้วยกัน เพราะคุณไม่สามารถแยกสุขภาพกายออกจากการพัฒนาตนเองได้
- **AI ที่นำไปปฏิบัติได้** — ทุกข้อมูลเชิงลึกจาก AI อ้างอิงข้อมูลจริงของคุณและเสนอขั้นตอนถัดไปที่เป็นรูปธรรม
`,
    },
    welcome: {
      title: "ยินดีต้อนรับสู่ Self Growth",
      content: `
Self Growth เป็นแอปเดสก์ท็อปสำหรับติดตามการพัฒนาตนเอง ที่ช่วยให้คุณสร้างนิสัยที่ดีขึ้น ติดตามการเรียนรู้ ตั้งเป้าหมาย ดูแลสุขภาพ และรับการโค้ชด้วย AI — โดยจัดเก็บข้อมูลทั้งหมดไว้บนอุปกรณ์ของคุณ

### สิ่งที่คุณทำได้

- **ตั้งเป้าหมาย** — กำหนดเป้าหมายพร้อมวันที่เป้าหมายและติดตามความก้าวหน้า
- **สร้างนิสัย** — ติดตามนิสัยประจำวันแบบใช่/ไม่ใช่ พร้อมสถิติต่อเนื่อง
- **สร้างกิจวัตร** — สร้างกิจวัตรประจำวัน/รายสัปดาห์พร้อมขั้นตอนและการติดตามอารมณ์
- **ดูแลสุขภาพ** — นำเข้าข้อมูล Apple Health หรือซิงค์ Google Fit สำหรับก้าวเดิน อัตราการเต้นหัวใจ การนอน น้ำหนัก แคลอรี และการออกกำลังกาย
- **ติดตามทักษะ** — ติดตามระดับทักษะของคุณในแต่ละหมวดหมู่
- **จัดการการเรียนรู้** — ติดตามคอร์ส หนังสือ บทความ และการฝึกฝน
- **บันทึกประจำวัน** — เขียนบันทึกทบทวนประจำวันพร้อมการให้คะแนนอารมณ์
- **บัญชีรายรับรายจ่าย** — ติดตามรายรับและรายจ่ายสำหรับการลงทุนพัฒนาตนเอง (คอร์ส หนังสือ การโค้ช ค่าสมาชิก)
- **สิ่งที่ต้องทำ** — จัดการงานพร้อมลำดับความสำคัญ วันครบกำหนด และการเชื่อมโยงกับเป้าหมาย
- **AI Coach** — รับคำแนะนำเฉพาะบุคคลจากข้อมูลจริงของคุณ รวมถึงตัวชี้วัดสุขภาพ
- **AI Chat** — สนทนาหลายรอบกับโค้ช AI ของคุณ
- **ค้นหาอัจฉริยะ** — ค้นหาเชิงความหมายในข้อมูลทั้งหมดของคุณ รวมถึงสรุปสุขภาพ
- **Story Lab** — สร้างและบันทึกเรื่องราวสร้างแรงบันดาลใจจากความก้าวหน้าของคุณ
`,
    },
    setup: {
      title: "คู่มือการตั้งค่า",
      content: `
### ขั้นที่ 1: ติดตั้งแอป

ดาวน์โหลดและติดตั้ง Self Growth สำหรับแพลตฟอร์มของคุณ แอปนี้ทำงานเป็นแอปพลิเคชันเดสก์ท็อปแบบเนทีฟ

### ขั้นที่ 2: เชื่อมต่อเอเจนต์ BWOC

Self Growth ใช้เอเจนต์ใน **กองทัพ BWOC** ของคุณสำหรับฟีเจอร์ AI (การโค้ช ข้อมูลเชิงลึก แชท เรื่องราว OCR) เอเจนต์มี LLM backend ของตัวเอง — แอปเพียงแค่ต้องรู้วิธีเข้าถึงมัน

1. ไปที่ **Settings** ในแอป
2. เลือก **Transport**:
   - **A2A over HTTP** — ชี้ **Agent URL** ไปที่ A2A endpoint ของเอเจนต์ ซึ่งอาจเป็น \`bwoc serve\` ในเครื่อง หรือ endpoint ที่โฮสต์ไว้บนกองทัพของคุณ เพื่อให้คุณเข้าถึงเอเจนต์ที่โฮสต์บนเกตเวย์ได้โดยไม่ต้องรันเซิร์ฟเวอร์ของคุณเอง
   - **Local bwoc CLI** — รัน \`bwoc\` บนเครื่องนี้กับ workspace ของคุณ
3. ตั้งค่า **Agent ID** (ค่าเริ่มต้น \`agent-growth-coach\`)
4. คลิก **Test Connection** เพื่อตรวจสอบ

> หากคุณไม่เชื่อมต่อเอเจนต์ BWOC แอปยังคงใช้งานได้สำหรับการติดตามทักษะ กิจวัตร นิสัย เป้าหมาย และบันทึกประจำวัน — เพียงแต่ไม่มีฟีเจอร์ AI

### ขั้นที่ 3: เริ่มติดตาม

1. **ตั้งเป้าหมาย** — ไปที่ Goals และกำหนดสิ่งที่คุณต้องการบรรลุ
2. **เพิ่มนิสัย** — ไปที่ Habits และสร้างนิสัยประจำวันง่าย ๆ
3. **สร้างกิจวัตร** — ไปที่ Routines และตั้งค่ากิจวัตรประจำวัน
4. **นำเข้าข้อมูลสุขภาพ** — ไปที่ Health และนำเข้าไฟล์ส่งออก Apple Health หรือเชื่อมต่อ Google Fit
5. **เพิ่มทักษะ** — ไปที่ Skills และเพิ่มสิ่งที่คุณต้องการพัฒนา
6. **เริ่มเรียนรู้** — ไปที่ Learning และเพิ่มคอร์ส หนังสือ หรือบทความ
7. **ติดตามการใช้จ่าย** — ไปที่ Ledger และบันทึกการลงทุนพัฒนาตนเองของคุณ
8. **เพิ่มสิ่งที่ต้องทำ** — ไปที่ Todos และสร้างงานที่เชื่อมโยงกับเป้าหมายของคุณ
9. **เขียนบันทึกประจำวัน** — ไปที่ Journal และเขียนบันทึกแรกของคุณ

### ขั้นที่ 4: เชื่อมต่อข้อมูลสุขภาพ

Self Growth ผสานการทำงานกับ Apple Health และ Google Fit เพื่อนำตัวชี้วัดสุขภาพของคุณเข้าสู่เส้นทางการพัฒนาตนเอง

**Apple Health:**
1. บน iPhone ของคุณ เปิดแอป **Health**
2. แตะที่โปรไฟล์ของคุณ → **Export All Health Data**
3. ถ่ายโอนไฟล์ \`export.xml\` ไปยังคอมพิวเตอร์ของคุณ
4. ใน Self Growth ไปที่ **Health** → **Import XML Export**

**Google Fit:**
1. สร้างโปรเจกต์ใน [Google Cloud Console](https://console.cloud.google.com)
2. เปิดใช้งาน **Fitness API**
3. สร้างข้อมูลรับรอง OAuth 2.0 (ประเภท Desktop app)
4. ใน Self Growth ไปที่ **Settings** → ป้อน Client ID และ Client Secret ของคุณ
5. ไปที่ **Health** → **Connect** → ยืนยันตัวตนในเบราว์เซอร์ → วางโค้ด

### ขั้นที่ 5: ใช้ฟีเจอร์ AI

เมื่อเชื่อมต่อเอเจนต์ BWOC ของคุณแล้ว:
- ถามคำถามกับ **AI Coach** บนแดชบอร์ดของคุณ — ตอนนี้รวมข้อมูลสุขภาพของคุณด้วย
- สร้าง **Insights** เพื่อดูรูปแบบในนิสัย เป้าหมาย และสุขภาพ
- รับ **Weekly Summary** สรุปความก้าวหน้าของคุณ
- เปิด **Chat** เพื่อการสนทนาที่ลึกขึ้น
- สร้าง **Stories** ที่ได้แรงบันดาลใจจากเส้นทางของคุณ
`,
    },
    howto: {
      title: "วิธีใช้งาน",
      content: `
### Dashboard
หน้าหลักของคุณ แสดงสถิติ (สถิติต่อเนื่อง การทำสำเร็จ กิจวัตร รายการเรียนรู้ ทักษะ เป้าหมาย) และทางลัดไปยัง AI Coach, Insights และ Weekly Summary

### Goals
ตั้งเป้าหมายพร้อมคำอธิบายและวันที่เป้าหมาย อัปเดตสถานะเมื่อคุณก้าวหน้า เป้าหมายให้ทิศทางกับทุกสิ่งที่คุณติดตาม

### Habits
การติดตามรายวันอย่างง่าย คลิกที่วงกลมเพื่อทำเครื่องหมายว่าทำนิสัยสำเร็จในแต่ละวัน แอปจะติดตามสถิติต่อเนื่องของคุณโดยอัตโนมัติ

### Routines
สร้างกิจวัตรที่มีโครงสร้างพร้อมหลายขั้นตอน บันทึกการทำสำเร็จพร้อมการให้คะแนนอารมณ์ เหมาะสำหรับกิจวัตรตอนเช้า ตารางออกกำลังกาย หรือช่วงเวลาเรียน

### Health
ดูแลสุขภาพกายของคุณด้วยข้อมูลจาก Apple Health และ Google Fit ดูการ์ดสรุปพร้อมแนวโน้ม กราฟแบบโต้ตอบตามช่วงเวลา และจัดการแหล่งข้อมูลของคุณ ตัวชี้วัดที่รองรับได้แก่ ก้าวเดิน อัตราการเต้นหัวใจ การนอน น้ำหนัก แคลอรีที่เผาผลาญ ระยะทาง นาทีที่กระฉับกระเฉง และการออกกำลังกาย

ข้อมูลสุขภาพจะถูกรวมไว้ในบริบทการโค้ชด้วย AI โดยอัตโนมัติ และค้นหาได้ผ่านการค้นหาอัจฉริยะหลังจากสร้างดัชนีใหม่

### Skills
ติดตามทักษะพร้อมหมวดหมู่ (เทคนิค ทักษะนุ่มนวล สุขภาพ ความคิดสร้างสรรค์ ธุรกิจ) และระดับ (0-10)

### Learning
ติดตามคอร์ส หนังสือ วิดีโอ และบทความ เปลี่ยนสถานะระหว่าง Backlog, In Progress และ Completed

### Ledger
ติดตามการเงินเพื่อการพัฒนาตนเองของคุณ บันทึกรายรับและรายจ่ายในแต่ละหมวดหมู่ (คอร์ส หนังสือ การโค้ช ค่าสมาชิก เครื่องมือ สุขภาพ) ดูการ์ดสรุปที่แสดงรายรับ รายจ่าย และยอดคงเหลือ กรองตามช่วงเวลา (สัปดาห์/เดือน/ปี) และหมวดหมู่ ดูรายละเอียดการใช้จ่ายตามหมวดหมู่ด้วยแถบแสดงผล

### Todos
จัดการงานพร้อมลำดับความสำคัญ (ต่ำ/กลาง/สูง/เร่งด่วน) วันครบกำหนดพร้อมเวลาเสริม และหมวดหมู่ เชื่อมโยงสิ่งที่ต้องทำกับเป้าหมายเพื่อการลงมือทำอย่างมุ่งเน้น กรองตามสถานะ (รอดำเนินการ/กำลังดำเนินการ/เสร็จสิ้น) หรือลำดับความสำคัญ ทำเครื่องหมายงานว่าเสร็จสิ้นและติดตามความก้าวหน้าของคุณ

### Journal
เขียนบันทึกทบทวนประจำวัน เพิ่มการให้คะแนนอารมณ์เพื่อติดตามความรู้สึกของคุณตามช่วงเวลา รองรับการจัดรูปแบบ markdown

### Chat
สนทนาหลายรอบกับโค้ช AI ของคุณ โค้ชเข้าถึงข้อมูลที่คุณติดตาม — รวมถึงตัวชี้วัดสุขภาพ — และให้คำแนะนำเฉพาะบุคคลได้

### Story Lab
สร้างเรื่องราวสร้างแรงบันดาลใจจากข้อมูลที่คุณติดตาม เลือกโทน (ให้กำลังใจ ทบทวน เชิงภาพยนตร์ สนุกสนาน สงบ) เขียนพรอมต์ แล้ว AI จะสร้างเรื่องราวเฉพาะบุคคล บันทึกเรื่องโปรดของคุณ

### Smart Search
ค้นหาในทักษะ รายการเรียนรู้ กิจวัตร สิ่งที่ต้องทำ รายการบัญชี และสรุปสุขภาพรายวันทั้งหมดของคุณ ด้วยการค้นหาเชิงความหมายที่ขับเคลื่อนด้วย AI คลิก "Rebuild Index" เพื่ออัปเดตดัชนีการค้นหาหลังจากเพิ่มข้อมูลใหม่

### Settings
ตั้งค่าการเชื่อมต่อเอเจนต์ BWOC ข้อมูลรับรอง Google Fit ทดสอบการเชื่อมต่อ หรือรีเซ็ตการตั้งค่าทั้งหมดเป็นค่าเริ่มต้น
`,
    },
    faq: {
      title: "คำถามที่พบบ่อย",
      content: `
**ข้อมูลของฉันถูกเก็บไว้ที่ไหน?**
ข้อมูลทั้งหมดถูกเก็บไว้ในเครื่องบนอุปกรณ์ของคุณในฐานข้อมูล SQLite ไม่มีสิ่งใดถูกส่งไปยังคลาวด์ เว้นแต่คุณจะใช้ฟีเจอร์ AI ซึ่งสื่อสารกับเอเจนต์ BWOC ที่คุณตั้งค่าไว้

**ฉันต้องมีการเชื่อมต่ออินเทอร์เน็ตหรือไม่?**
ไม่ ยกเว้นสำหรับฟีเจอร์ AI (การโค้ช แชท ข้อมูลเชิงลึก เรื่องราว) และการซิงค์ Google Fit ฟีเจอร์ติดตามทั้งหมดและการนำเข้า Apple Health ทำงานแบบออฟไลน์ได้

**ฉันใช้แอปนี้ได้โดยไม่มีเอเจนต์ BWOC หรือไม่?**
ได้ ทักษะ กิจวัตร นิสัย เป้าหมาย การติดตามสุขภาพ บัญชี สิ่งที่ต้องทำ บันทึกประจำวัน และการติดตามการเรียนรู้ ทั้งหมดทำงานได้โดยไม่ต้องเชื่อมต่อ AI

**BWOC คืออะไร?**
BWOC เป็นเฟรมเวิร์กที่เป็นกลางต่อ backend สำหรับการจัดการเอเจนต์ AI Self Growth เรียกใช้เอเจนต์ในกองทัพ BWOC ของคุณสำหรับฟีเจอร์ AI โดยเอเจนต์จะรัน LLM backend ใดก็ตามที่คุณตั้งค่าไว้

**การผสานข้อมูลสุขภาพทำงานอย่างไร?**
Self Growth รองรับแหล่งข้อมูลสุขภาพสองแหล่ง:
- **Apple Health**: ส่งออกข้อมูลของคุณเป็น XML จากแอป Health บน iPhone และนำเข้าสู่ Self Growth นำเข้าซ้ำได้ทุกเมื่อเพื่ออัปเดต — จัดการข้อมูลซ้ำซ้อนโดยอัตโนมัติ
- **Google Fit**: เชื่อมต่อผ่าน OAuth โดยใช้ข้อมูลรับรอง Google Cloud ของคุณ การซิงค์จะดึงข้อมูลฟิตเนสย้อนหลัง 30 วัน

ข้อมูลสุขภาพ (ก้าวเดิน อัตราการเต้นหัวใจ การนอน น้ำหนัก แคลอรี ระยะทาง การออกกำลังกาย) ถูกเก็บไว้ในเครื่องและรวมไว้ในบริบทการโค้ชด้วย AI และการค้นหาเชิงความหมายโดยอัตโนมัติ

**ฉันจะสำรองข้อมูลได้อย่างไร?**
ฐานข้อมูลของคุณถูกเก็บไว้ที่:
- **macOS**: \`~/Library/Application Support/com.bemindlabs.growth.v2/self-growth.db\`
- **Linux**: \`~/.local/share/self-growth/self-growth.db\`
- **Windows**: \`%AppData%\\\\BemindLabs\\\\Self Growth\\\\self-growth.db\`

คัดลอกไฟล์นี้เพื่อสำรองข้อมูลทั้งหมดของคุณ

**Smart Search ทำงานอย่างไร?**
บนเดสก์ท็อป แอปสร้าง vector embeddings ในเครื่องโดยใช้ AllMiniLM-L6-v2 คลิก "Rebuild Index" ในหน้า Search เพื่อสร้างดัชนีข้อมูลของคุณ แล้วค้นหาด้วยภาษาธรรมชาติ ข้อมูลสุขภาพถูกสร้างดัชนีเป็นสรุปรายวันครอบคลุม 90 วันล่าสุด

**ฉันสามารถส่งออกข้อมูลของฉันได้หรือไม่?**
ปัจจุบันคุณสามารถคัดลอกไฟล์ฐานข้อมูล SQLite ได้โดยตรง สามารถเปิดด้วยโปรแกรมดู SQLite ใดก็ได้

**Ledger รองรับสกุลเงินอะไรบ้าง?**
Ledger ใช้ค่าเริ่มต้นเป็น THB แต่รองรับรหัสสกุลเงินใด ๆ ต่อรายการ การคำนวณสรุปจะถูกจัดกลุ่มตามสกุลเงินที่ใช้ล่าสุด

**ฉันสามารถเชื่อมโยงสิ่งที่ต้องทำกับเป้าหมายได้หรือไม่?**
ได้ เมื่อสร้างสิ่งที่ต้องทำ คุณสามารถเชื่อมโยงกับเป้าหมายที่มีอยู่ได้ ซึ่งช่วยให้คุณแบ่งเป้าหมายออกเป็นงานที่ลงมือทำได้

**AI อ่านข้อมูลทั้งหมดของฉันหรือไม่?**
เมื่อคุณใช้ฟีเจอร์ AI แอปจะส่งบริบทที่เกี่ยวข้อง (ทักษะล่าสุด กิจวัตร เป้าหมาย รายการเรียนรู้ และค่าเฉลี่ยสุขภาพ 7 วัน) ไปยังเอเจนต์ BWOC ที่คุณตั้งค่าไว้ ข้อมูลการเงิน (Ledger) และงาน (Todos) **ไม่** ถูกส่งไปยังการโค้ชด้วย AI — สามารถค้นหาได้ผ่าน Smart Search ในเครื่องเท่านั้น ข้อมูล AI ยังคงอยู่ในเครือข่ายของคุณเมื่อเอเจนต์ทำงานบนเครื่องหรือกองทัพของคุณเอง
`,
    },
    terms: {
      title: "ข้อกำหนดและเงื่อนไข",
      content: `
**อัปเดตล่าสุด: มีนาคม 2026**

### 1. การยอมรับข้อกำหนด
เมื่อใช้ Self Growth ถือว่าคุณยอมรับข้อกำหนดเหล่านี้ หากคุณไม่ยอมรับ โปรดอย่าใช้แอป

### 2. คำอธิบายบริการ
Self Growth เป็นแอปพลิเคชันติดตามการพัฒนาตนเองที่จัดเก็บข้อมูลไว้ในเครื่องบนอุปกรณ์ของคุณ ฟีเจอร์ AI ต้องมีเอเจนต์ BWOC ที่ตั้งค่าแยกต่างหาก

### 3. ความรับผิดชอบของผู้ใช้
- คุณมีหน้าที่รับผิดชอบในการรักษาความปลอดภัยของอุปกรณ์และข้อมูลของคุณ
- คุณมีหน้าที่รับผิดชอบในการตั้งค่าและดูแลเอเจนต์ BWOC และกองทัพของคุณเอง
- คุณมีหน้าที่รับผิดชอบในการสำรองข้อมูลของคุณ

### 4. ความเป็นเจ้าของข้อมูล
ข้อมูลทั้งหมดที่คุณสร้างใน Self Growth เป็นของคุณ แอปจัดเก็บข้อมูลไว้ในเครื่องบนอุปกรณ์ของคุณ เราไม่เก็บรวบรวม จัดเก็บ หรือเข้าถึงข้อมูลของคุณ

### 5. ฟีเจอร์ AI
ฟีเจอร์ AI ขับเคลื่อนโดยเอเจนต์ BWOC ของคุณ คุณภาพ ความแม่นยำ และความพร้อมใช้งานของการตอบกลับด้วย AI ขึ้นอยู่กับการตั้งค่าเอเจนต์ของคุณและ LLM backend ที่ใช้

### 6. ข้อจำกัดความรับผิดชอบ
Self Growth ให้บริการ "ตามสภาพที่เป็นอยู่" โดยไม่มีการรับประกันใด ๆ ฟีเจอร์การโค้ชด้วย AI มีไว้เพื่อวัตถุประสงค์ในการให้ข้อมูลเท่านั้น และไม่ถือเป็นคำแนะนำจากผู้เชี่ยวชาญ

### 7. ข้อจำกัดความรับผิด
Bemind Technology Co., Ltd. (Bemindlabs) จะไม่รับผิดต่อความเสียหายใด ๆ ที่เกิดจากการใช้แอปพลิเคชันนี้

### 8. การเปลี่ยนแปลงข้อกำหนด
เราอาจอัปเดตข้อกำหนดเหล่านี้เป็นครั้งคราว การใช้แอปต่อไปถือเป็นการยอมรับข้อกำหนดที่อัปเดตแล้ว
`,
    },
    privacy: {
      title: "นโยบายความเป็นส่วนตัว",
      content: `
**อัปเดตล่าสุด: มีนาคม 2026**

### การจัดเก็บข้อมูล
ข้อมูลทั้งหมดของคุณถูกเก็บไว้ **ในเครื่องบนอุปกรณ์ของคุณ** ในฐานข้อมูล SQLite เราไม่ได้ดำเนินการเซิร์ฟเวอร์คลาวด์ใด ๆ หรือเก็บรวบรวมข้อมูลผู้ใช้ใด ๆ

### สิ่งที่เราไม่เก็บรวบรวม
- ไม่มีข้อมูลส่วนบุคคล
- ไม่มีการวิเคราะห์การใช้งาน
- ไม่มีรายงานข้อขัดข้อง
- ไม่มี telemetry
- ไม่มีคุกกี้หรือการติดตาม

### การไหลของข้อมูลในฟีเจอร์ AI
เมื่อคุณใช้ฟีเจอร์ AI (Coach, Chat, Insights, Stories) แอปจะส่งข้อมูลบริบทที่เกี่ยวข้องไปยัง **เอเจนต์ BWOC ที่คุณตั้งค่าไว้** ซึ่งรวมถึง:
- ทักษะและระดับล่าสุด
- กิจวัตรที่ใช้งานอยู่และข้อมูลการทำสำเร็จ
- รายการเรียนรู้
- เป้าหมาย
- ตัวชี้วัดสุขภาพ (ค่าเฉลี่ย 7 วันของก้าวเดิน อัตราการเต้นหัวใจ การนอน ฯลฯ)
- เนื้อหาบันทึกประจำวัน (เฉพาะเมื่อเกี่ยวข้องกับคำถาม AI)

รายการบัญชีและสิ่งที่ต้องทำถูกสร้างดัชนีสำหรับ Smart Search แต่ **ไม่** รวมอยู่ในบริบทการโค้ชด้วย AI

ข้อมูลนี้ถูกส่งไปยังเอเจนต์ที่คุณตั้งค่าใน Settings เมื่อเอเจนต์นั้นทำงานบนเครื่องหรือกองทัพของคุณเอง ข้อมูลนี้จะไม่ออกจากเครือข่ายของคุณ

### ข้อมูลสุขภาพ
ข้อมูลสุขภาพที่นำเข้าจาก Apple Health หรือซิงค์จาก Google Fit ถูกเก็บไว้ **ในเครื่องบนอุปกรณ์ของคุณ** เมื่อใช้การซิงค์ Google Fit แอปจะสื่อสารกับ Fitness API ของ Google โดยใช้ข้อมูลรับรอง OAuth ของคุณเอง — ไม่มีข้อมูลผ่านเซิร์ฟเวอร์ของเรา

### บริการของบุคคลที่สาม
Self Growth ไม่ได้ผสานการทำงานกับบริการวิเคราะห์ โฆษณา หรือการติดตามของบุคคลที่สามใด ๆ การสื่อสารภายนอกจำกัดอยู่ที่:
- **เอเจนต์ BWOC** ที่คุณตั้งค่าไว้ (สำหรับฟีเจอร์ AI)
- **Google Fitness API** (เฉพาะเมื่อคุณเชื่อมต่อ Google Fit โดยใช้ข้อมูลรับรองของคุณเอง)

### การเก็บรักษาข้อมูล
เนื่องจากข้อมูลทั้งหมดถูกเก็บไว้ในเครื่อง คุณจึงมีอำนาจควบคุมการเก็บรักษาข้อมูลอย่างเต็มที่ ลบไฟล์ฐานข้อมูลเพื่อลบข้อมูลทั้งหมด

### ความเป็นส่วนตัวของเด็ก
Self Growth ไม่ได้มุ่งเป้าไปที่เด็กอายุต่ำกว่า 13 ปี เราไม่เก็บรวบรวมข้อมูลจากเด็กโดยเจตนา

### ติดต่อ
สำหรับข้อกังวลด้านความเป็นส่วนตัว โปรดติดต่อ Bemind Technology Co., Ltd. (Bemindlabs)
`,
    },
  },
};
