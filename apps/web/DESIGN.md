# Sori Web Design System

## Surface mode

**Operate:** a learner comes here to complete a short study task. Prioritize a clear next lesson, readable Korean, and immediate feedback. The Sori name is provisional.

## Direction

Create a warm study space with the tactility of a small paper learning journal and the color confidence of a contemporary Korean learning product. Use KORI only as an inspiration for approachability and polish. Keep Sori’s identity, writing, layout, illustrations, and assets original.

The lesson surface is the signature interaction: Korean characters sit in a calm, pale-green practice field; answer choices use a consistent row control; feedback explains the answer; returning items appear in a short review flow. The dashboard puts the next lesson first and keeps progress information secondary.

## Foundations

### Color tokens

| Token           | Value     | Use                                    |
| --------------- | --------- | -------------------------------------- |
| `canvas`        | `#FFFAF3` | Main application background            |
| `surface`       | `#FFFDF9` | Lesson and content surfaces            |
| `surface-muted` | `#FCF8F1` | Navigation rail                        |
| `ink`           | `#27322C` | Primary text                           |
| `ink-soft`      | `#48534D` | Secondary text                         |
| `ink-muted`     | `#626B63` | Supporting copy on light surfaces      |
| `forest`        | `#314F42` | Primary action and selected navigation |
| `forest-deep`   | `#233B31` | Hover and pressed primary action       |
| `sage`          | `#DFE8D7` | Lesson focus surface                   |
| `leaf`          | `#91A584` | Success and completed learning state   |
| `coral`         | `#E98167` | Focused lesson cue and small emphasis  |
| `butter`        | `#F7DA72` | Sparse illustration accent             |
| `line`          | `#E9E3DA` | Dividers and control boundaries        |

Use accent colors for actions and states. Do not use muted gray alone to indicate disabled or upcoming status; pair it with clear text. Verify text contrast against the actual surface before launch.

### Typography

Use a familiar system sans stack with Korean system font fallbacks. Use one family for product UI; reserve Georgia for a short, occasional editorial emphasis. Keep interface labels compact but readable, and keep Hangul at a generous size in lesson and speaking contexts.

### Spacing and shape

Use a 4px base spacing rhythm. Controls have compact, consistent heights. Most control and content corners use 9–16px radii; a single large feature panel may use 20–24px. Use borders for panel separation and reserve shadow for overlays.

## Components and behavior

- **Navigation:** persistent left rail on wide screens; fixed bottom navigation on narrow screens. Always identify the selected route in text and state.
- **Primary action:** forest background, light text, consistent height, clear verb label, visible keyboard focus, and disabled state when the action is unavailable.
- **Lesson choices:** full-width selectable buttons with a clear selected state and explanatory feedback after checking.
- **Review:** reveal the answer before self-rating. A remembered item returns after progressively longer intervals; a missed item returns sooner.
- **Dialog:** use for a focused lesson or review flow only. Close with the visible control, Escape, or a click outside; keep keyboard focus inside and return focus to the opener.
- **Progress:** display counts from learner activity, never seeded sample numbers. Distinguish estimated lesson minutes from measured time.
- **Upcoming course units:** mark as upcoming and disable them until their content exists.

## Motion

Motion communicates state or gentle physical character only. Keep most transitions under 200ms, respect `prefers-reduced-motion`, and leave content visible without animation.

## Responsive behavior

- Below 820px, hide the persistent sidebar and use the four-item bottom navigation.
- Below 560px, stack the course and review content, preserve readable Korean type, and keep the primary action within thumb reach.
- Ensure lesson dialogs fit within the dynamic viewport and remain scrollable on small screens.

## Accessibility baseline

Use semantic headings, buttons, labels, and live feedback. Interactive controls must work by keyboard, maintain visible focus, and not rely on color alone. Support reduced motion. Speaking practice must work without audio input; audio output depends on browser support and should have a readable text alternative.
