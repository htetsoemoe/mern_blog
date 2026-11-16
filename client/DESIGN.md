---
version: alpha
name: Commonplace
colors:
  ink: '#20272d'
  muted: '#647078'
  brand: '#315eab'
  primary: '#315eab'
  background: '#ffffff'
  surface: '#f5f7fa'
  line: '#e5e8eb'
  danger: '#a32c35'
typography:
  sans:
    fontFamily: '"Segoe UI", "Helvetica Neue", Arial, sans-serif'
  editorial:
    fontFamily: '"Iowan Old Style", "Palatino Linotype", "Book Antiqua", Georgia, serif'
rounded:
  control: '6px'
  panel: '7px'
spacing:
  field: '24px'
  gridGap: '28px'
components:
  button:
    height: '44px'
    backgroundColor: '{colors.primary}'
    textColor: '{colors.background}'
    rounded: '{rounded.control}'
  shell:
    width: '1184px'
    textColor: '{colors.ink}'
    backgroundColor: '{colors.background}'
  metadata:
    textColor: '{colors.muted}'
  panel:
    backgroundColor: '{colors.surface}'
  divider:
    backgroundColor: '{colors.line}'
  danger:
    textColor: '{colors.danger}'
  link:
    textColor: '{colors.brand}'
---

## Overview

Commonplace is a multi-author general-interest blog for readers and independent writers. Its public routes feel like a personal reading shelf: one generous latest-story feature, quieter previews below, and ample room around the words. The writing and account routes use the same visual vocabulary with practical forms.

The signature is the lowercase blue `c.` bookmark, paired with restrained editorial headlines. Avoid dashboard statistics, decorative charts, oversized marketing claims, cream/terracotta palettes, or invented stories. The server supplies all published content. English is the initial interface language.

## Colors

The frontmatter values map directly to `src/styles.css`: ink, muted and brand are `@theme` variables, background is the root background, surface is `--surface`, line is `--line`, and danger is `--danger`. CSS is the single runtime token owner; Tailwind uses these theme variables rather than a separate configuration palette. Blue signals actions/categories. Red is reserved for errors and deletion. Success feedback uses a dark green notification. Light mode only.

## Typography

Use the editorial system serif stack for story headlines, reading content and page headings. Use the system sans stack for navigation, metadata, forms and controls. These local stacks avoid font downloads and layout shifts. Article body text is 20px on desktop and 19px on mobile, with 1.9 line height. Headlines must wrap even for long unbroken titles. Never truncate the full reading page.

## Layout

The shell is at most 1184px wide. Three preview columns become two below 800px and one below 600px. Category links wrap rather than hide behind a scrollbar. The article body is at most 700px wide. Forms scroll with the document; the editor sidebar follows the body on mobile. Breakpoints are 1050px, 800px and 600px. Account navigation wraps to a second row without a hidden menu.

## Elevation & Depth

Static content uses borders and surface tones without shadows. Only notifications and modal dialogs cast shadows. Media reserves aspect-ratio space while loading. Missing images receive the quiet blue bookmark fallback.

## Shapes

Controls use 6px corners, panels use 7–8px, and avatars are circular. Avoid pill-shaped controls and excessive rounding.

## Components

Canonical owners are documented in UX-CONTRACT.md. Shared styles live in `src/styles.css`; shared controls live in `src/components/ui.jsx`. Lucide outlines are used only to clarify actions. Animations are limited to loading indicators and subtle hover transitions, respecting reduced motion. All product-owned scrolling regions inherit global standards-based scrollbar styling and WebKit fallbacks, including a forced-colors escape path.

## Do's and Don'ts

Use real API categories, visible labels, descriptive errors, explicit upload size limits and accessible confirmation dialogs. Preserve form values after failures. Keep the published reading experience free of editing controls except for the author's edit link. Do not introduce search, pagination, drafts, comments, likes, bookmarks, password recovery, roles or general attachments without a server contract.
