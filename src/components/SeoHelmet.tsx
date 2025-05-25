import { Helmet } from 'react-helmet-async'
import { useTranslation } from 'react-i18next'

export default function SeoHelmet() {
  const { t, i18n } = useTranslation()

  return (
    <Helmet>
      <html lang={i18n.language} />
      <title>{t('seo.title', 'Wall Go (牆壁圍棋) | React + TypeScript | Devil\'s Plan Strategy Board Game')}</title>
      <meta name="description" content={t('seo.description', 'Wall Go (牆壁圍棋) – open-source React + TypeScript implementation. Play the strategy board game from Devil’s Plan 2 in your browser. Undo/redo, territory scoring, and beautiful UI. Free, open source, single-player, and playable in your browser.')} />
      <meta name="keywords" content={t('seo.keywords', 'Wall Go, 牆壁圍棋, Devil\'s Plan, React, TypeScript, board game, strategy game, undo redo, territory, GitHub, 開源, 桌遊, 線上遊戲, 小遊戲, browser game, 圍棋, wallgo, devil\'s plan game, wall go single player')} />
      <meta name="robots" content="index,follow" />
      <meta name="theme-color" content="#f43f5e" />
      <meta property="og:type" content="website" />
      <meta property="og:title" content={t('seo.title', 'Wall Go (牆壁圍棋) | React + TypeScript | Devil\'s Plan Strategy Board Game')} />
      <meta property="og:description" content={t('seo.description', 'Wall Go (牆壁圍棋) – open-source React + TypeScript implementation. Play the strategy board game from Devil’s Plan 2 in your browser. Undo/redo, territory scoring, and beautiful UI. Free, open source, single-player, and playable in your browser.')} />
      <meta property="og:url" content="https://schaoss.github.io/wall-go/" />
      <meta property="og:image" content="https://schaoss.github.io/wall-go/cover.png" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={t('seo.title', 'Wall Go (牆壁圍棋) | React + TypeScript | Devil\'s Plan Strategy Board Game')} />
      <meta name="twitter:description" content={t('seo.description', 'Wall Go (牆壁圍棋) – open-source React + TypeScript implementation. Play the strategy board game from Devil’s Plan 2 in your browser. Undo/redo, territory scoring, and beautiful UI. Free, open source, single-player, and playable in your browser.')} />
      <meta name="twitter:image" content="https://schaoss.github.io/wall-go/cover.png" />
      <link rel="icon" type="image" href="/wall-go/favicon.ico" />
      <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    </Helmet>
  )
}
