# Anabaptist Orchestra Camp Website Redesign — Lovable Build Brief

> **Project**: Orchestracamp.info Complete Redesign  
> **Platform**: Lovable (lovable.dev)  
> **Current Stack**: WordPress / Elegant Themes Evolution (legacy)  
> **Target Launch**: Before 2027 enrollment opens (dates: Aug 12–15, 2027)  
> **Prepared**: July 19, 2026  

---

## EXECUTION ORDER (Paste into Lovable one phase at a time)

### PHASE 1 — Project Scaffold & Brand Tokens
Set up the Lovable project, configure the design system with brand tokens, typography, and color palette. Establish the global CSS variables and component primitives (buttons, cards, typography scale) so subsequent phases inherit the visual identity automatically.

### PHASE 2 — Homepage Hero & Layout Shell
Build the full homepage: hero section with camp date announcement, navigation, footer, and the responsive layout shell. Implement the dark theme with deep navy and warm gold accents. This establishes the site's visual presence and information hierarchy.

### PHASE 3 — Content Pages (About, FAQ, Media, Contact)
Build the four core content pages: About page with steering committee bios, FAQ page with accordion layout, Media page with concert video grid, and Contact page with form. Connect all pages to the navigation shell.

### PHASE 4 — Blog System (Announcements & Posts)
Implement the Supabase-backed blog/announcements system with the `posts` table, create/edit admin interface, post listing page, and individual post detail pages. Include the Jetpack-style email subscription widget (replaced with a modern form).

### PHASE 5 — Registration & Enrollment System
Build the enrollment page with pricing tiers, registration logic, and Supabase integration for tracking registrations. Include the registration timeline (early bird, regular, late pricing) and the closed state when registration is not open.

### PHASE 6 — Polish, SEO, Testing & Launch Prep
Add meta tags, Open Graph, responsive refinements, animation polish, accessibility audit, and final content population with the 2027 dates. Set up redirects from old WordPress URLs.

---

## BRAND TOKENS (Do NOT default to generic corporate styling)

### Color Palette
```
--color-bg-primary:      #0f172a   /* Deep navy — main page background */
--color-bg-secondary:    #1e293b   /* Slightly lighter navy — cards, sections */
--color-bg-elevated:       #334155   /* Elevated surfaces — hover states, borders */
--color-accent-gold:       #d4a853   /* Warm gold — CTAs, highlights, buttons */
--color-accent-gold-hover: #c49a47   /* Darker gold for hover states */
--color-text-primary:      #f8fafc   /* Near-white — headings, primary text */
--color-text-secondary:    #94a3b8   /* Slate gray — body text, descriptions */
--color-text-muted:        #64748b   /* Muted gray — captions, dates, meta */
--color-border:            #334155   /* Subtle borders for cards and dividers */
--color-error:             #ef4444   /* Red — form validation errors */
--color-success:           #22c55e   /* Green — success states, confirmation */
```

### Typography
```
--font-display:   'Playfair Display', Georgia, serif   /* Hero headings, camp name, page titles */
--font-body:      'Inter', -apple-system, sans-serif    /* Body text, navigation, UI elements */
--font-accent:    'Caveat', cursive                       /* Handwritten-style accents, taglines, quotes */

Font sizes (mobile-first, rem-based):
--text-xs:    0.75rem   /* 12px — captions, meta */
--text-sm:    0.875rem  /* 14px — secondary text, nav items */
--text-base:  1rem      /* 16px — body text */
--text-lg:    1.125rem  /* 18px — lead paragraphs */
--text-xl:    1.25rem   /* 20px — subheadings */
--text-2xl:   1.5rem    /* 24px — section headings */
--text-3xl:   1.875rem  /* 30px — page titles */
--text-4xl:   2.25rem   /* 36px — hero heading */
--text-5xl:   3rem      /* 48px — main hero display (desktop) */
--text-6xl:   3.75rem   /* 60px — oversized hero (desktop large) */
```

### Spacing Scale
```
--space-1:  0.25rem  /* 4px */
--space-2:  0.5rem   /* 8px */
--space-3:  0.75rem  /* 12px */
--space-4:  1rem     /* 16px */
--space-5:  1.25rem  /* 20px */
--space-6:  1.5rem   /* 24px */
--space-8:  2rem     /* 32px */
--space-10: 2.5rem   /* 40px */
--space-12: 3rem     /* 48px */
--space-16: 4rem     /* 64px */
--space-20: 5rem     /* 80px */
--space-24: 6rem     /* 96px */
```

### Border Radius
```
--radius-sm:  4px   /* Buttons, small elements */
--radius-md:  8px   /* Cards, inputs */
--radius-lg:  12px  /* Large cards, image containers */
--radius-xl:  16px  /* Hero images, featured sections */
--radius-full: 9999px /* Pill buttons, avatars */
```

---

## SUPABASE SCHEMA

### Table: `posts` (Blog / Announcements)
```sql
create table posts (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  slug text not null unique,
  excerpt text,
  content text not null,
  category text not null default 'announcement' check (category in ('announcement', 'news', 'media')),
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  featured boolean default false,
  image_url text,
  published_at timestamp with time zone,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  author_name text default 'Anabaptist Orchestra Camp'
);

-- RLS: Public can read published posts
alter table posts enable row level security;

create policy "Public can view published posts"
  on posts for select
  using (status = 'published');

create policy "Authenticated users can manage posts"
  on posts for all
  to authenticated
  using (true)
  with check (true);

-- Trigger for updated_at
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger posts_updated_at
  before update on posts
  for each row execute function update_updated_at();

-- Index for slug lookups
create index posts_slug_idx on posts(slug);
create index posts_status_published_at_idx on posts(status, published_at desc);
```

### Table: `enrollments` (Registration Tracking)
```sql
create table enrollments (
  id uuid default gen_random_uuid() primary key,
  first_name text not null,
  last_name text not null,
  email text not null,
  instrument text,
  age integer,
  accompanying_adult text,
  lodging_type text default 'host_family' check (lodging_type in ('host_family', 'self_arranged')),
  meal_plan boolean default true,
  registration_fee decimal(10,2),
  tuition_fee decimal(10,2),
  meal_fee decimal(10,2),
  lodging_fee decimal(10,2),
  total_paid decimal(10,2) default 0,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'cancelled', 'waitlisted')),
  payment_status text default 'unpaid' check (payment_status in ('unpaid', 'partial', 'paid', 'refunded')),
  notes text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table enrollments enable row level security;

create policy "Users can view their own enrollment"
  on enrollments for select
  to authenticated
  using (email = auth.user()->>'email');

create policy "Admins can manage all enrollments"
  on enrollments for all
  to authenticated
  using (true)
  with check (true);

create trigger enrollments_updated_at
  before update on enrollments
  for each row execute function update_updated_at();
```

### Table: `camp_settings` (Backend-Editable Dates & Settings)
```sql
create table camp_settings (
  id integer primary key default 1,
  camp_year integer not null,
  start_date date not null,
  end_date date not null,
  registration_opens date,
  registration_closes date,
  early_registration_deadline date,
  regular_registration_deadline date,
  location_venue text,
  concert_venue text,
  registration_status text default 'closed' check (registration_status in ('open', 'closed', 'waitlist')),
  updated_at timestamp with time zone default now()
);

-- Insert 2027 data (editable by admin)
insert into camp_settings (
  id, camp_year, start_date, end_date, registration_opens, registration_closes,
  early_registration_deadline, regular_registration_deadline,
  location_venue, concert_venue, registration_status
) values (
  1, 2027, '2027-08-12', '2027-08-15', '2027-03-01', '2027-07-15',
  '2027-05-01', '2027-07-01',
  'Bethel Fellowship Church, Millersburg, Ohio',
  'Central Christian School, Kidron, Ohio',
  'closed'
);

alter table camp_settings enable row level security;

create policy "Public can read camp settings"
  on camp_settings for select
  using (true);

create policy "Admins can update camp settings"
  on camp_settings for update
  to authenticated
  using (true)
  with check (true);
```

### Table: `team_members` (Steering Committee)
```sql
create table team_members (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  role text not null,
  location text,
  bio text not null,
  image_url text,
  email text,
  sort_order integer default 0,
  is_active boolean default true,
  created_at timestamp with time zone default now()
);

alter table team_members enable row level security;

create policy "Public can view team members"
  on team_members for select
  using (is_active = true);

create policy "Admins can manage team members"
  on team_members for all
  to authenticated
  using (true)
  with check (true);
```

### Table: `media_items` (Concert Videos & Photos)
```sql
create table media_items (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  type text not null check (type in ('video', 'photo', 'audio')),
  url text not null,
  thumbnail_url text,
  year integer,
  sort_order integer default 0,
  is_featured boolean default false,
  created_at timestamp with time zone default now()
);

alter table media_items enable row level security;

create policy "Public can view media items"
  on media_items for select
  using (true);

create policy "Admins can manage media"
  on media_items for all
  to authenticated
  using (true)
  with check (true);
```

---

## SITE MAP & PAGE STRUCTURE

### Navigation (Top Nav — sticky, dark background)
```
[Logo: Anabaptist Orchestra Camp]  Home | About | Blog | Contact | Enroll | FAQ | Media
                                                                       ^^^^^^ CTA button (gold)
```
**Note**: "Choose an Instrument" is **ELIMINATED** per user request.

### Pages

#### 1. Homepage (`/`)
- **Hero Section**: Full-width hero with the 2027 camp date banner (Aug 12–15, 2027). Dark background with gold accent text. "Where Anabaptist instrumentalists fellowship and develop their skills" tagline.
- **Date Announcement Card**: Prominent card displaying: "August 12–15, 2027 | Holmes County, Ohio | Registration opens Spring 2027"
- **What to Expect**: 3-column grid — Rehearsals, Fellowship, Concert — with icon + brief description
- **Featured Blog Posts**: 3 most recent published posts from `posts` table
- **Newsletter CTA**: Email signup section (replaces old Jetpack widget)
- **Social Links**: Facebook, partner links (Hymns of the Church, SCMC Music Camp)

#### 2. About (`/about`)
- **Mission Statement**: Full-width text — "Anabaptist Orchestra Camp exists to offer praise to the Lord by giving Anabaptist instrumental musicians the opportunity to play their instruments with other believers, to develop their skill, and to enjoy fellowship with other musicians."
- **Weekend Overview**: What happens Thursday–Sunday (rehearsals, chapel, workshops, sectional practice, recreation, concert)
- **History**: Founded October 2011. First camp: 2 dozen musicians, 5 brass/woodwinds. Now grown significantly.
- **Team Grid**: Steering committee cards from `team_members` table:
  - Sarah Sommers (Dalton, OH) — Violin, Suzuki certified, 18+ years teaching
  - Jeff Swanson (Terre Hill, PA) — Conductor & Administrator, FSU/SMU degrees, former Grand Rapids Symphony & Philadelphia Orchestra
  - Deana Swanson (Terre Hill, PA) — Administrative Assistant, flute player
  - Carmen Yoder (New Paris, IN) — Registrar, clarinet
- **Location**: Bethel Fellowship Church, Millersburg, OH + Central Christian School, Kidron, OH
- **Map Embed**: Google Maps embed with directions

#### 3. Blog (`/blog`)
- **Post Listing**: All published posts, sorted by `published_at` desc, paginated
- **Categories**: Announcement (default), News, Media
- **Featured Post**: First featured post gets a large hero card at the top
- **Post Card**: Title, excerpt, date, category badge, read more link
- **Post Detail** (`/blog/:slug`): Full content, back to blog link, related posts
- **Admin**: `/admin/blog` — create, edit, delete posts with rich text editor (Lovable built-in)

#### 4. FAQ (`/faq`)
- Accordion layout (Lovable shadcn Accordion component)
- **Sections**:
  - When & Where (2027 dates, location, schedule)
  - Eligibility (age 14+, skill level, accompaniment policy)
  - Cost (early $20, regular $30, late $40; tuition $90; meals $65; lodging $12/$6 per night)
  - Preparation (music download, practice, supplies)
  - What to Bring (instrument, stand, folder, pencils)
  - Lodging (host family or self-arranged)
  - Dress Code (men: full-length pants, sleeved shirts; women: dresses/skirts, head covering; concert: black & white)
  - Families & Visitors (3 families for full activities; others at dress rehearsal + concert only)
  - Contact Info (strings → Sarah, woodwinds/brass → Jeff, registration → Carmen)

#### 5. Enroll (`/enroll`)
- **Registration Status Banner**: Pulled from `camp_settings`. Shows "Registration Closed" or "Registration Open" with countdown to deadline.
- **Pricing Tiers**: Visual timeline showing early ($20), regular ($30), late ($40) registration fees + tuition ($90) + meals ($65) + lodging.
- **Registration Form**: First name, last name, email, instrument, age, accompanying adult, lodging preference, meal plan, payment.
- **Enrollment Closed State**: "Registration for Orchestra Camp 2027 is not yet open. Sign up for email updates to be notified."
- **Nonparticipating Family**: Separate form/section with adult ($65) and child ($40) fees.

#### 6. Media (`/media`)
- **Concert Video Grid**: YouTube embeds for past concerts (2013, 2014, 2016, 2017, 2018, 2019, 2022)
- **Photo Gallery**: Optional — carousel or grid of camp photos
- **Audio**: Any audio recordings if available
- **Year Filters**: Tabbed navigation by year

#### 7. Contact (`/contact`)
- **Contact Form**: Name, Email, Subject, Message (no captcha — use honeypot or Supabase rate limiting instead)
- **Direct Contacts**: Sarah (strings), Jeff (woodwinds/brass), Carmen (registration) — cards with email addresses
- **General Info**: `info@orchestracamp.info`
- **Social**: Facebook link (OrchestraCamp page)
- **Location**: Address + embedded map

#### 8. Admin Dashboard (`/admin`) — Protected Route
- **Camp Settings Editor**: Edit dates, venues, registration status in `camp_settings` table
- **Blog Manager**: CRUD for `posts` table
- **Enrollment Viewer**: View `enrollments` table, filter by status
- **Team Manager**: CRUD for `team_members` table
- **Media Manager**: CRUD for `media_items` table
- **Analytics**: Simple view of subscriber count, enrollment stats

---

## CONTENT MIGRATION INVENTORY

### Text Content (Copy-verbatim from existing site)

#### Homepage Tagline
> "Where Anabaptist instrumentalists fellowship and develop their skills"

#### Mission Statement
> "Anabaptist Orchestra Camp exists to offer praise to the Lord by giving Anabaptist instrumental musicians the opportunity to play their instruments with other believers, to develop their skill, and to enjoy fellowship with other musicians."

#### Weekend Description
> "The weekend consists of rehearsals, chapel, workshops, individual and sectional practice time, as well as time for recreation and conversation."

#### History (About Page)
> "In October 2011, we held the first camp with two dozen musicians, mostly strings, and a grand total of five brass and woodwinds. We played several hymns, staple classical pieces, 'He Shall Feed His Flock' and 'Come Unto Me' from Messiah, and others. Since then, the camp has grown significantly."

#### Team Bios (Full text — copy exactly)

**Sarah Sommers, Dalton, Ohio**
> After begging her parents for several years, Sarah received her first violin at age 12. She studied violin with Mary Bontrager for 10 years and has played with local orchestras and string quartets. She has been teaching violin for more than 18 years and is Level 3 Suzuki Violin School certified. She is passionate about facilitating student collaboration and serves on the steering committee of the Anabaptist Orchestra. In her spare time, she loves hanging out with her nieces and nephews, going to concerts, traveling, and baking.

**Jeff Swanson, Terre Hill, Pennsylvania**
> Jeff Swanson is the conductor and administrator for the Anabaptist Orchestra. He holds Bachelor's and Master's degrees in Music Performance from Florida State University in Tallahassee, Florida, and Southern Methodist University in Dallas, Texas respectively. He also received his certification in Music Education from Aquinas College in Grand Rapids, Michigan. A professional musician for the first nine years of his career, Jeff played French horn in the Grand Rapids Symphony and the Philadelphia Orchestra before he decided to be a full-time educator. He has been a choir director, band director, and teacher since 1999. He is currently the director of music at Terre Hill Mennonite High School and Shalom Mennonite School, both in Terre Hill, Pennsylvania. He enjoys singing, running, restoring antique furniture, playing games late at night with his family, and talking to his cats.

**Deana Swanson, Terre Hill, Pennsylvania**
> Deana Swanson has been a member of the Anabaptist Orchestra since 2012, and serves as the administrative assistant on the steering committee. She holds a Bachelor's degree in Communications from the University of Texas at Arlington where she also played in the concert band, and completed her courses in Secondary English Education from the University of Valdosta. Deana began playing the flute in the 6th grade and has played ever since. She currently plays with the Anabaptist Orchestra and Lyrica Sacra. Deana lives in Terre Hill, Pennsylvania with her husband, Jeff, three of her five children, and four cats.

**Carmen Yoder, New Paris, Indiana**
> Although she knew nothing about the strange instrument at the time, Carmen decided to play the clarinet in the 5th grade band. She continued playing several years in school, as well as occasionally playing at church and with friends. She began attending the Anabaptist Orchestra Camp in 2013, and is now serving as the registrar for the camp. When she's not delighting friends and family with the melodic honking of her clarinet, Carmen enjoys working at a local coffee shop, reading, eating, traveling, and spending time with the people she loves.

#### FAQ Content (Full text — copy exactly)
All FAQ content extracted from `/faq` page is included above. Copy each question/answer pair verbatim into the accordion component.

#### Blog Posts to Migrate (Seed Data for `posts` table)
```sql
insert into posts (title, slug, excerpt, content, category, status, featured, published_at) values
('We Are Practicing . . .', 'we-are-practicing', 'The orchestra is preparing for the upcoming camp.', 'Full content here...', 'announcement', 'published', false, '2026-05-01'),
('Registration Opens Tomorrow!', 'registration-opens-tomorrow', 'Get ready — enrollment opens soon.', 'Full content here...', 'announcement', 'published', true, '2026-03-15'),
('Save the Dates!', 'save-the-dates-2027', 'Anabaptist Orchestra Camp 2027: August 12–15, 2027.', 'Anabaptist Orchestra Camp will be held August 12–15, 2027, at Bethel Fellowship Church in Millersburg, Ohio, and the concert will be at Central Christian School in Kidron, Ohio. Mark your calendars!', 'announcement', 'published', true, '2026-01-15'),
('You\'ve Only Got \'Till Midnight!', 'until-midnight', 'Last chance to register for camp.', 'Full content here...', 'announcement', 'published', false, '2025-07-14'),
('One More Day to Sign Up!', 'one-more-day', 'Final day of registration. Don\'t miss out!', 'Full content here...', 'announcement', 'published', false, '2025-07-13');
```

#### Media Items to Migrate (Seed Data for `media_items` table)
```sql
insert into media_items (title, type, url, year, sort_order) values
('Anabaptist Orchestra Concert 2022', 'video', 'https://www.youtube.com/embed/VIDEO_ID_2022', 2022, 1),
('Anabaptist Orchestra Concert 2019', 'video', 'https://www.youtube.com/embed/VIDEO_ID_2019', 2019, 2),
('Anabaptist Orchestra Concert 2018', 'video', 'https://www.youtube.com/embed/VIDEO_ID_2018', 2018, 3),
('Anabaptist Orchestra Concert 2017', 'video', 'https://www.youtube.com/embed/VIDEO_ID_2017', 2017, 4),
('Anabaptist Orchestra Concert 2016', 'video', 'https://www.youtube.com/embed/VIDEO_ID_2016', 2016, 5),
('Anabaptist Orchestra Concert 2014', 'video', 'https://www.youtube.com/embed/VIDEO_ID_2014', 2014, 6),
('Anabaptist Orchestra Concert 2013', 'video', 'https://www.youtube.com/embed/VIDEO_ID_2013', 2013, 7);
```
**Note**: YouTube video IDs need to be extracted from the existing WordPress embeds or replaced with actual YouTube links. Current site has embeds that need manual review.

---

## ASSET MANIFEST

### Logo
```
Source:   http://orchestracamp.info/wp-content/uploads/Orchestra-Camp-Logo.jpg
Migrate:  Upload to Supabase Storage → /assets/logo-aoc.jpg
Usage:    Header logo, favicon source, social sharing image
```

### Hero Banner Images (5 slides from current carousel)
```
1. AOC-Banners-Stage.jpg       ("Pray" slide — stage/orchestra photo)
   Source: https://i0.wp.com/www.orchestracamp.info/wp-content/uploads/AOC-Banners-Stage.jpg
   
2. ChatGPT-Image-Jul-16-2026-05_14_47-PM.png ("Camp Date" slide — 2026 dates banner)
   Source: https://i0.wp.com/www.orchestracamp.info/wp-content/uploads/ChatGPT-Image-Jul-16-2026-05_14_47-PM.png
   ACTION: Generate new 2027 version with dates: "August 12–15, 2027"
   
3. AOC-Banners-Violin.jpg      ("Bach" slide — violin close-up)
   Source: https://i0.wp.com/www.orchestracamp.info/wp-content/uploads/AOC-Banners-Violin.jpg
   
4. AOC-Banners-Clarinet.jpg    ("Mozart" slide — clarinet close-up)
   Source: https://i0.wp.com/www.orchestracamp.info/wp-content/uploads/AOC-Banners-Clarinet.jpg
   
5. AOC-Banners-French-Horn.jpg ("Beethoven" slide — French horn close-up)
   Source: https://i0.wp.com/www.orchestracamp.info/wp-content/uploads/AOC-Banners-French-Horn.jpg

All migrate to: Supabase Storage /assets/banners/
Usage: Homepage hero carousel (Phase 2)
```

### About Page Image
```
Source:   https://orchestracamp.info/wp-content/uploads/2012/06/Violin-jr.png
Migrate:  /assets/about-violin.png
Usage:    About page sidebar or decorative element
```

### Team Member Photos
```
NEED: Request headshot photos from:
- Sarah Sommers
- Jeff Swanson
- Deana Swanson
- Carmen Yoder

Fallback: Use initials/avatar generator with gold-on-navy color scheme
Migrate to: /assets/team/
```

### Social Assets
```
Facebook: https://www.facebook.com/OrchestraCamp
Action:   Verify page still active, update cover photo for 2027 branding
```

---

## SEO & META CONFIGURATION

### Global Meta
```
Title Template:       {page_title} | Anabaptist Orchestra Camp
Default Title:        Anabaptist Orchestra Camp | Serving and cultivating the instrumentalists among us
Default Description:  Anabaptist Orchestra Camp offers Anabaptist instrumental musicians the opportunity to play together, develop their skills, and enjoy fellowship. Held annually in Holmes County, Ohio.
Keywords:             anabaptist, orchestra, camp, music, instrumental, mennonite, amish, classical, christian, ohio, holmes county, millersburg, kidron
```

### Page-Specific Meta
```
Home:     "Anabaptist Orchestra Camp 2027 | August 12–15 | Holmes County, Ohio"
About:    "About Anabaptist Orchestra Camp | Our Mission, History, and Team"
Blog:     "News & Announcements | Anabaptist Orchestra Camp"
FAQ:      "FAQ | Anabaptist Orchestra Camp Registration, Dates, and Policies"
Enroll:   "Register for Orchestra Camp 2027 | Enrollment and Pricing"
Media:    "Concert Videos & Media | Anabaptist Orchestra Camp"
Contact:  "Contact Us | Anabaptist Orchestra Camp"
```

### Open Graph (Social Sharing)
```
og:site_name:   Anabaptist Orchestra Camp
og:type:        website
og:image:       /assets/og-image-2027.jpg (generate: 1200×630, navy background + gold text + camp dates)
twitter:card:   summary_large_image
```

### Redirects (from old WordPress URLs)
```
/old-url → /new-url
/pick-an-instrument/ → / (ELIMINATED — redirect to homepage)
/anabaptist-orchestra-camp-blog/ → /blog
/category/announcements/ → /blog (filter by category)
```

---

## FUNCTIONALITY & FEATURES

### 1. Email Newsletter Subscription
Replace the old Jetpack subscription widget (203 subscribers) with a modern Supabase-backed form:
```sql
create table subscribers (
  id uuid default gen_random_uuid() primary key,
  email text not null unique,
  subscribed_at timestamp with time zone default now(),
  is_active boolean default true
);
```
- Form: Email input + "Subscribe" button (gold CTA)
- Confirmation: Success toast message
- Admin: Export to CSV for email marketing (Mailchimp migration optional)

### 2. Registration Fee Calculator (Enroll Page)
```javascript
function calculateTotal(registrationDate, options) {
  const fees = {
    early: { deadline: '2027-05-01', fee: 20 },
    regular: { deadline: '2027-07-01', fee: 30 },
    late: { deadline: '2027-07-15', fee: 40 }
  };
  
  let regFee;
  if (registrationDate <= fees.early.deadline) regFee = fees.early.fee;
  else if (registrationDate <= fees.regular.deadline) regFee = fees.regular.fee;
  else regFee = fees.late.fee;
  
  const tuition = 90;
  const meals = options.mealPlan ? 65 : 0;
  const lodging = options.lodgingNights * (options.age >= 13 ? 12 : 6);
  
  return regFee + tuition + meals + lodging;
}
```

### 3. Countdown Timer (Homepage Hero)
- Display countdown to camp start date (Aug 12, 2027)
- Days / Hours / Minutes / Seconds
- Gold accent color on dark background
- Auto-updates from `camp_settings.start_date`

### 4. Admin Authentication
- Use Lovable's built-in auth (Supabase Auth) or Clerk
- Admin role: `is_admin` claim in user metadata
- Protect `/admin/*` routes with auth guard

### 5. Blog Content Editor
- Use Lovable's built-in rich text editor or TipTap
- Image upload via Supabase Storage
- Slug auto-generation from title
- Published/draft toggle

### 6. Mobile Navigation
- Hamburger menu on mobile (< 768px)
- Slide-out drawer with nav links
- Logo always visible in header
- Sticky header on scroll

### 7. Footer
- 4-column layout:
  - About: Logo + "Anabaptist Orchestra Camp is held near Holmes County, Ohio. Click here for driving directions."
  - Links: Hymns of the Church, SCMC – Music Camp
  - Social: Facebook connect button
  - Newsletter: Email subscribe form
- Copyright: "© 2027 Anabaptist Orchestra Camp"
- Credits: "Designed with care for the Anabaptist music community"

---

## RESPONSIVE BREAKPOINTS
```
Mobile:     < 640px   (single column, hamburger nav, stacked hero)
Tablet:     640–1024px (2-column grids, condensed nav)
Desktop:    > 1024px  (full layout, multi-column, side-by-side sections)
Wide:       > 1280px  (max-width container, larger spacing)
```

---

## ACCESSIBILITY REQUIREMENTS
- WCAG 2.1 AA compliance
- Color contrast ratio: 4.5:1 minimum for all text
- Focus visible states on all interactive elements
- Alt text for all images (descriptive, not decorative)
- Keyboard navigation for all interactive components
- Skip to content link
- Semantic HTML (nav, main, article, section, footer)
- ARIA labels for icon-only buttons
- Reduced motion support: `@media (prefers-reduced-motion: reduce)`

---

## ACCEPTANCE CRITERIA

### Homepage
- [ ] Hero displays "August 12–15, 2027" prominently
- [ ] 5-second carousel auto-rotation with manual controls
- [ ] Tagline renders in italic accent font
- [ ] Featured blog posts load from Supabase (3 posts)
- [ ] Newsletter signup form submits to `subscribers` table
- [ ] Facebook link opens in new tab
- [ ] Responsive: single column on mobile, 3-column on desktop

### About
- [ ] Mission statement displays full-width
- [ ] Team member cards pull from `team_members` table
- [ ] Each card shows: photo, name, role, location, bio
- [ ] Map embed shows correct location (Millersburg, OH)
- [ ] History section includes 2011 founding date

### Blog
- [ ] Post listing shows all published posts with pagination
- [ ] Featured posts get larger card treatment
- [ ] Post detail page renders full content with rich text
- [ ] Admin can create/edit/delete posts at `/admin/blog`
- [ ] Slug auto-generation works from title
- [ ] Published/draft toggle functions correctly

### FAQ
- [ ] All questions from existing FAQ page are included
- [ ] Accordion expands/collapses with smooth animation
- [ ] Content is verbatim from existing site (copy-paste preserved)
- [ ] Dress code section is clearly formatted
- [ ] Contact emails are clickable mailto: links

### Enroll
- [ ] Registration status pulls from `camp_settings.registration_status`
- [ ] Pricing calculator shows correct totals based on date
- [ ] Form validates all required fields
- [ ] Confirmation email sent on submission (via Supabase/Resend)
- [ ] Enrollment records saved to `enrollments` table
- [ ] Closed state displays "Registration not yet open" message

### Media
- [ ] All 7 concert years represented (2013–2022)
- [ ] YouTube embeds are responsive (16:9 aspect ratio)
- [ ] Year filter tabs work correctly
- [ ] Thumbnail images load from `media_items.thumbnail_url`

### Contact
- [ ] Contact form submits to Supabase + sends email notification
- [ ] No captcha — use honeypot field + rate limiting
- [ ] Direct contact cards show: name, role, email, phone (if available)
- [ ] Map embed shows correct location
- [ ] Success message displays after submission

### Admin
- [ ] All admin routes require authentication
- [ ] Camp settings editor updates `camp_settings` table
- [ ] Blog manager CRUD works for `posts` table
- [ ] Team manager CRUD works for `team_members` table
- [ ] Enrollment viewer shows all records with filtering
- [ ] Media manager CRUD works for `media_items` table

---

## TECHNICAL NOTES FOR LOVABLE

1. **No generic corporate styling** — Use the navy + gold palette defined above. Do not default to blue/white gradients or generic SaaS aesthetics.

2. **Blog content is editable by non-technical camp staff** — Deana, Carmen, and Sarah need to post announcements without touching code. Use the `posts` table with the admin interface.

3. **Camp dates are backend-editable** — The `camp_settings` table allows changing dates, venues, and registration windows without redeployment. This is the "easy to edit on the backend" requirement.

4. **The "Choose an Instrument" page is eliminated** — Do not include it in navigation. Redirect `/pick-an-instrument/` to `/`.

5. **Stars/ratings feature** — Per user request: "don't worry about the stars for now, just make it easy to edit that on the backend." Add a nullable `rating` or `stars` integer field to any relevant table for future use. Do not display stars UI.

6. **SEO-first** — Meta descriptions, Open Graph tags, and semantic HTML are required for search visibility. The site currently ranks for "anabaptist orchestra camp" and "holmes county music camp" — preserve and improve this.

7. **Email subscribers** — 203 existing Jetpack subscribers need to be migrated. Export from WordPress admin, import to Supabase `subscribers` table, or connect to Mailchimp/ConvertKit.

8. **YouTube embeds** — Current Media page has 7 concert videos. Extract actual YouTube URLs from existing embeds or request them from the camp team.

9. **Image assets** — Download all banner images from the current WordPress `wp-content/uploads/` directory and upload to Supabase Storage. The ChatGPT-generated 2026 banner needs a 2027 remake.

10. **Performance** — Lazy-load images, defer non-critical JS, use WebP for photos. Target Lighthouse score > 90.

---

## PROJECT FILES & REPOSITORY

This build brief should be committed to the GitHub repository as the single source of truth for the Lovable build. The repository should also contain:

```
/orchestracamp-website/
├── README.md                    (this file)
├── docs/
│   ├── brand-tokens.md          (color, typography, spacing)
│   ├── content-migration.md     (all text content from old site)
│   ├── asset-manifest.md        (image URLs, download paths)
│   └── seo-plan.md              (meta tags, keywords, redirects)
├── sql/
│   ├── schema.sql               (all Supabase table definitions)
│   └── seed-data.sql            (initial data: settings, team, posts, media)
└── assets/
    ├── banners/                 (carousel images)
    ├── logo/                    (logo files, favicons)
    ├── team/                    (headshots, or placeholder avatars)
    └── og/                      (Open Graph social images)
```

---

## CONTACTS (for content verification)

- **Sarah Sommers** (Strings, Repertoire): sarah@orchestracamp.info
- **Jeff Swanson** (Woodwinds, Brass, Conductor): jeff@orchestracamp.info
- **Carmen Yoder** (Registration, General): info@orchestracamp.info
- **Deana Swanson** (Admin, Website): [request email]
- **Facebook**: https://www.facebook.com/OrchestraCamp

---

## PRICING REFERENCE (for enrollment page — display verbatim)

```
Registration (due with online enrollment form):
- Early Registration: $20 (before May 1)
- Starting May 1: $30
- Starting July 1: $40
- REGISTRATION CLOSES ON JULY 15

Tuition: $90
Meals: $65
Lodging: $12/night per adult (13+) | $6/night per child (3-12)
Music: Provided at no charge (must be returned at end of camp)

Nonparticipating Adult: $65
Nonparticipating Child: $40
Note: Only one nonparticipating adult per family due to limited space.
```

---

*End of Lovable Build Brief for Anabaptist Orchestra Camp Website Redesign*
*Prepared July 19, 2026 for 2027 camp season (August 12–15, 2027)*
