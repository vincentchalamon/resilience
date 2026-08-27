# Trousse anti-crise

App Android perso, outil de crise pour un profil TDAH + anxieux. Trois ecrans qui **guident une action au lieu de la reflechir** : faire redescendre l'anxiete (respiration guidee puis ancrage 5-4-3-2-1), laisser passer une envie de sucre (minuteur d'attente), et ralentir un repas (minuteur + pause a mi-repas). Chaque ecran peut etre lance en un tap depuis un **widget d'ecran d'accueil**.

| Anxiete | Envie de sucre | Repas |
|---|---|---|
| ![Anxiete](docs/screenshots/anxiete.png) | ![Envie de sucre](docs/screenshots/sucre.png) | ![Repas](docs/screenshots/repas.png) |

## APK

L'APK est **buildé automatiquement** à chaque GitHub Release et attaché comme asset : page
[Releases](../../releases) du repo → `app-debug.apk`. Il est debug-signé, donc installable directement
(autoriser les "sources inconnues" sur le téléphone). GitHub Packages n'héberge pas d'APK brut, d'où
les Releases.

## Dev

```sh
npm install
npm test        # tests unitaires (Vitest)
npm run e2e     # tests de flux (Playwright)
npm run serve   # sert www/ sur http://127.0.0.1:5173
npm run apk     # cap sync + build APK debug en local (android/app/build/outputs/apk/debug/)
```

Les widgets natifs vivent dans `android/app/src/main/java/coop/tilleuls/resilience/` (`ModeWidget` +
un provider par mode). Un tap ouvre l'app via le deep-link `resilience://open?screen=<mode>&auto=1`.

## Sources des durees

- Respiration lente, expiration plus longue (4s / 6s, ~6 cycles/min) :
  [Frontiers 2025](https://www.frontiersin.org/journals/human-neuroscience/articles/10.3389/fnhum.2025.1605862/full),
  [ScienceDirect](https://www.sciencedirect.com/science/article/pii/S0965229923000249).
- Ancrage 5-4-3-2-1 :
  [Cleveland Clinic](https://health.clevelandclinic.org/54321-grounding-technique),
  [Healthline](https://www.healthline.com/health/anxiety/5-4-3-2-1-grounding-technique-for-anxiety).
