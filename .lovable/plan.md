

## Plan: Fix iOS Safari Auto-Zoom on Inputs + Update README

### Problem
iOS Safari auto-zooms when an input's `font-size` is less than 16px. Several inputs across the app use `text-sm` (14px) or inline `font-size: 13px`, which triggers this behavior on mobile.

### Approach: Scale-Down Trick
Set `font-size: 16px` on all inputs to prevent zoom, then use `transform: scale(0.875)` (14/16) with appropriate container adjustments where a smaller visual size is desired. For the `Input` and `Textarea` components, we'll use 16px base on all breakpoints. For inline inputs (LiveDemoChat, EmbedChat), apply the same fix.

### Changes

**1. `src/components/ui/input.tsx`**
- Change `text-base md:text-sm` → `text-base` (always 16px, no downscale on desktop since it already looks fine at 16px in most contexts)

**2. `src/components/ui/textarea.tsx`**
- Change `text-sm` → `text-base` (16px always)

**3. `src/components/LiveDemoChat.tsx`**
- Change the inline input's `text-sm` → `text-base`

**4. `src/pages/EmbedChat.tsx`**
- Change `.embed-input` `font-size: 13px` → `font-size: 16px`

**5. `src/components/ui/select.tsx`**
- Change `text-sm` → `text-base` on the trigger to prevent zoom on select focus

**6. `README.md`**
- Rewrite to describe Profile.Mu: an AI-powered platform that lets professionals create AI twins of themselves, with features like resume/text import, knowledge management, embeddable chat widgets, conversation history, and social auth.

### Technical Details
- The `text-base` class in Tailwind = `font-size: 1rem` = 16px — exactly what iOS Safari requires
- For the embed widget's inline CSS, a direct `font-size: 16px` is used
- No `transform: scale()` hack needed since 16px works well with the current UI spacing and the project's design system already uses generous padding

