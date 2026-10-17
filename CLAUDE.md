# Контекст для Claude Code

Сайт-лендинг «АРКА 123» (тестовое задание вайбкодера для Медиа Лайн). Next.js 15 App Router, TypeScript strict, без UI-библиотек.

- Язык интерфейса и комментариев — русский.
- Стили — только `app/globals.css` (обычный CSS, токены в `:root`, тёмная тема через `prefers-color-scheme` и `[data-theme]`). Tailwind не используется.
- 3D: `lib/arkaScene.ts` — императивный модуль three.js **0.147** (не обновлять без перенастройки света). React-обёртка — `components/SceneProvider.tsx`; сцена грузится динамическим `import()` только на клиенте.
- Анимации — GSAP 3 + ScrollTrigger; в компонентах использовать `gsap.context()` и откатывать в cleanup.
- Размеры зала (123 м², потолок 4,5 м, окна 4 × 3,5 м) — из ТЗ; вместимость считается в `lib/layouts.ts`, не хардкодить числа.
- Уважать `prefers-reduced-motion` во всех новых анимациях.
- Проверка перед коммитом: `npx tsc --noEmit && npm run build`.
