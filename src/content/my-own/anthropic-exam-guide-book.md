---
title: Anthropic Exam Guide Book
tagline: A free, independent, bilingual (Vietnamese / English) study guide for the four Claude certification exams.
status: Live
role: Builder — content pipeline, translation, hosting
started: '11/2026'
url: https://claude-guide-book.mobeautyanalyst.com/en/
screenshot: /images/what-i-build/anthropic-exam-guide-book.webp
stack: [Python, Static HTML, Docker, Caddy, Cloudflare Tunnel]
order: 1
why:
  question: Why did I build it?
  answer: Learners preparing for the Claude certification exams needed one place to study, in Vietnamese or in English, without signing up for anything.
---

### What's inside?

- **Study notes for all four exams** — Associate, Developer and Architect (Foundations), and Architect (Professional): 123 lessons plus an overview for each exam.
- **An exam guide** — how registration and the exam itself work.
- **Every page in both languages** — switch between Vietnamese and English with one click.

### How is it built?

A small Python pipeline turns the notes into a static site of about 270 pages, translates only new text, and checks the English pages for untranslated leftovers. The site runs as a read-only container on my own VPS behind a Cloudflare Tunnel.

<p class="note">Independent study material, not affiliated with or endorsed by Anthropic.</p>
