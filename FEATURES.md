# PromptEnhancer — Complete Features List

> AI-powered prompt enhancement companion web application.

---

## Table of Contents

1. [Landing Page](#1-landing-page)
2. [Authentication & User Management](#2-authentication--user-management)
3. [Prompt Enhancement (Core)](#3-prompt-enhancement-core)
4. [Enhancement Output & Actions](#4-enhancement-output--actions)
5. [Enhancement Modes](#5-enhancement-modes)
6. [Prompt Templates](#6-prompt-templates)
7. [History](#7-history)
8. [User Settings / Profile](#8-user-settings--profile)
9. [Internationalization (i18n)](#9-internationalization-i18n)
10. [Help Page](#10-help-page)
11. [Admin Control Dashboard](#11-admin-control-dashboard)
12. [Technical Architecture](#12-technical-architecture)

---

## 1. Landing Page

- Hero section with animated scroll effects (parallax, fade)
- Feature highlights with scroll-reveal animations
- Pricing section with monthly/yearly toggle
- Newsletter email subscription with Zod validation
- Social media links
- Locale switcher for multi-language support
- Authenticated users see profile dropdown instead of login button

---

## 2. Authentication & User Management

- **Sign Up** — Email + password registration with email verification
- **Sign In** — Email + password login
- **Password Reset** — Forgot password flow with reset email
- **Profile Setup** — Post-registration profile completion page
- **Protected Routes** — All app pages require authentication
- **Session Persistence** — Auth state managed via Supabase Auth with auto-refresh
- **Profile Dropdown** — Quick access to settings, help, and logout

---

## 3. Prompt Enhancement (Core)

- **Text Input** — Large textarea for entering prompts
- **Target Model Selection** — Dropdown to choose the AI model the prompt is intended for:
  - ChatGPT, Claude, Gemini (Chat)
  - GitHub Copilot, Cursor (Code)
  - Midjourney, DALL·E, Stable Diffusion (Image)
- **Voice Input** — Speech-to-text via Web Speech API with mic toggle
- **File Attachments** — Attach files to provide context for enhancement
- **Streaming Response** — Real-time streamed output from the AI backend
- **Stop Generation** — Abort button to cancel in-progress streaming
- **Clear Fields** — Button to reset all input fields after generation
- **Parameters Panel** — Configure language and word limit for the enhanced output
- **AI Quality Score** — Automatic 0–10 quality score generated for every enhancement

---

## 4. Enhancement Output & Actions

- **Text View** — Rendered enhanced prompt with markdown support
- **JSON View** — Structured JSON export of the enhanced prompt
- **Copy to Clipboard** — One-click copy with visual confirmation
- **Download** — Export as `.txt` or `.json` file
- **Save to History** — Persist enhancement to local storage
- **Re-Enhance** — One-click to re-run enhancement on the same prompt
- **Feedback Button** — Inline 1–5 star rating without interrupting workflow
- **Rating Dialog** — Appears on copy/download if user hasn't already rated via feedback
- **Auto-Logging** — Every enhancement is automatically logged to the database (action_type: "system") with quality score, even if the user doesn't copy or download
- **Performance Metrics** — Collapsible panel showing generation time, AI model used, and quality score

---

## 5. Enhancement Modes

| Mode | Description |
|------|-------------|
| **Quick** | Paste prompt → click Enhance → get improved prompt instantly |
| **Wizard** | Guided step-by-step form: intent, audience, tone, format, constraints |
| **Assisted** | Conversational/chat-based enhancement with back-and-forth refinement |

---

## 6. Prompt Templates

- **Built-in Templates** — Categorized library of pre-made prompt templates
- **Custom Templates** — Users can create, edit, and delete their own templates
- **Template Categories** — Filter templates by category
- **One-Click Apply** — Select a template to auto-fill the prompt input and target model
- **Sidebar Access** — Templates accessible from the collapsible sidebar

---

## 7. History

- **Local Persistence** — Enhancement history stored in browser localStorage
- **Search** — Full-text search across original and enhanced prompts
- **Filter** — Filter by target model or favorites
- **Favorites** — Star/unstar individual enhancements
- **Copy** — Quick-copy any historical enhanced prompt
- **Delete** — Remove individual records or clear all history
- **Animated List** — Smooth enter/exit animations via Framer Motion

---

## 8. User Settings / Profile

- **Profile Management** — Edit full name, country, company, occupation, bio, website, phone
- **Country Selector** — Searchable dropdown with all countries
- **Phone Code Selector** — Country-code-prefixed phone input
- **Theme Preference** — Light / Dark / System toggle (persisted per user)
- **Data Export** — Export all settings and history as JSON
- **Data Import** — Import previously exported JSON backup

---

## 9. Internationalization (i18n)

- Multi-language UI with locale switcher
- Translation system via `src/lib/translations.ts`
- Price formatting adapts to locale
- All user-facing strings are translatable

---

## 10. Help Page

- Getting started guide with numbered steps
- Enhancement modes explained
- Tips for writing better prompts
- Feature overview cards

---

## 11. Admin Control Dashboard

The admin panel is accessible only to users with the `admin` role (checked via `has_admin_role` database function and RLS policies). It contains the following tabs:

### 11.1 Dashboard (Overview)

- **Stat Cards:**
  - Total enhancements count
  - Average rating (1–5 stars)
  - Total users count
  - Average generation time (ms)
- **Charts:**
  - Enhancement volume over time (bar chart)
  - Rating distribution (pie chart)
  - Mode usage breakdown (pie chart)
  - Usage trend over time (line chart)
- **Quick Refresh** — Reload all dashboard data

### 11.2 Providers

- **Add Provider** — Dialog with provider presets:
  - OpenRouter
  - Google Gemini
  - Lovable AI
  - AIML API
  - Groq
  - Mistral
  - Bytez
  - NVIDIA NIM
  - refactored the model browser into a single generic system that dynamically shows "Browse" buttons for all active providers that support it: OpenRouter, AIML API, Groq, Mistral, Bytez, and NVIDIA NIM.
- **API Key Configuration** — Securely store provider API keys (encrypted in database)
- **Toggle Active/Inactive** — Enable or disable providers without deleting
- **Delete Provider** — Remove a provider and its associated models

### 11.3 Models

- **Add Model Manually** — Dialog to create a model with display name, model ID, provider, description, and free/paid flag
- **Browse OpenRouter Models** — Search and import models from the OpenRouter catalog
- **Browse AIML API Models** — Search and import models from the AIML API catalog
- **Refactored  model browser** - it is into a single generic system that dynamically shows "Browse" buttons for all active providers that support it: OpenRouter, AIML API, Groq, Mistral, Bytez, and NVIDIA NIM. Then use rcan and import models from the catalog.
- **Set Active Model** — Select which provider + model combination is used for enhancements
- **Toggle Model Active/Inactive** — Enable or disable individual models
- **Delete Model** — Remove a model from the database

### 11.4 System Prompts

- **View & Edit System Prompts** — Access and modify system prompts stored in `app_settings`
- **Prompt Keys:**
  - `system_prompt_quick` — System prompt for Quick mode
  - `system_prompt_wizard` — System prompt for Wizard mode
  - `system_prompt_assisted` — System prompt for Assisted mode
- **Inline Editing** — Click to edit, save/cancel controls
- **Auto-Fetch** — Prompts loaded on admin page mount

### 11.5 Logs & Ratings

A unified view combining all enhancement logs and user ratings:

- **Entry Details:**
  - User rating (1–5 stars)
  - Quality Score (0–10, displayed as raw number, not converted to stars)
  - Username (resolved from profiles table)
  - Original prompt (expandable)
  - Enhanced prompt (expandable)
  - Target model, enhancement mode, AI model used
  - Generation time (ms)
  - Action type badge: SYSTEM, COPY, DOWNLOAD, SAVE, EXPORT, FEEDBACK
  - Timestamp
- **Filtering:**
  - By action type (all / system / copy / download / save / export / feedback)
  - By text search (searches prompts)
  - By date range (from/to date pickers)
- **Pagination** — 20 items per page with prev/next controls
- **CSV Export** — Download all logs & ratings as a CSV file including quality scores and usernames
- **Refresh** — Manual reload button

### 11.6 Error Logs

- **Error Details:**
  - Error type and error message
  - HTTP error code
  - Enhancement mode and AI model used
  - Provider name
  - Timestamp
- **Filter by Error Type** — Dropdown: all / api_error / edge_function_error / network_error / rate_limit / unknown
- **Pagination** — 20 items per page with prev/next controls
- **CSV Export** — Download all error logs as CSV
- **Refresh** — Manual reload button
- **Error Diagnostics** — Logs capture rate limits, provider failures, configuration errors, etc.

### 11.7 Users

- **User List** — All users with assigned roles
- **Username Display** — Full name resolved from profiles table
- **Role Assignment** — View roles (admin/user) per user
- **Role-Based Access Control** — Admin role verified via `has_admin_role()` security-definer function

---

## 12. Technical Architecture

| Layer | Technology |
|-------|------------|
| Frontend | React 18, TypeScript, Vite |
| Styling | Tailwind CSS, shadcn/ui, Framer Motion |
| State | React Query (TanStack), React Hooks |
| Routing | React Router v6 with lazy-loaded pages |
| Backend | Lovable Cloud (Supabase) |
| Database | PostgreSQL with Row-Level Security |
| Auth | Supabase Auth (email/password) |
| AI | Edge Function (`/chat`) with configurable providers |
| Streaming | Server-Sent Events (SSE) for real-time AI output |
| i18n | Custom translation system with locale context |
| Storage | localStorage for history, Supabase for ratings/logs |
| Security | RLS policies, security-definer functions, role-based access |

### Database Tables

| Table | Purpose |
|-------|---------|
| `profiles` | User profile data (name, country, company, etc.) |
| `user_roles` | Role assignments (admin, user) |
| `ai_providers` | AI provider configurations (OpenRouter, Google, etc.) |
| `ai_models` | Available AI models per provider |
| `app_settings` | App-wide settings (active model, system prompts) |
| `prompt_ratings` | Enhancement logs, ratings, and quality scores |
| `error_logs` | Enhancement failure diagnostics |

---

*Last updated: March 2026*
