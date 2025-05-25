import { Helmet } from 'react-helmet-async'
import { useTranslation } from 'react-i18next'

export default function SeoHelmet() {
  const { t, i18n } = useTranslation()

  return (
    <Helmet>
      <html lang={i18n.language} />
      <title>{t('seo.title', 'Wall Go（牆壁圍棋）| 線上策略桌遊 | Devil\'s Plan 同款遊戲')}</title>
      <meta name="description" content={t('seo.description', 'Wall Go（牆壁圍棋）－免費線上策略桌遊，支援單人/雙人、領地計分、復原重做、現代化 UI。Devil’s Plan 2 同款遊戲，開源、免註冊、直接開玩！')} />
      <meta name="keywords" content={t('seo.keywords', 'Wall Go, 牆壁圍棋, Devil\'s Plan, board game, strategy game, undo redo, territory, GitHub, 開源, 桌遊, 線上遊戲, 小遊戲, browser game, 圍棋, wallgo, devil\'s plan game, wall go single player')} />
      <meta name="robots" content="index,follow" />
      <meta name="theme-color" content="#f43f5e" />
      <meta property="og:type" content="website" />
      <meta property="og:title" content={t('seo.title', 'Wall Go（牆壁圍棋）| 線上策略桌遊 | Devil\'s Plan 同款遊戲')} />
      <meta property="og:description" content={t('seo.description', 'Wall Go（牆壁圍棋）－免費線上策略桌遊，支援單人/雙人、領地計分、復原重做、現代化 UI。Devil’s Plan 2 同款遊戲，開源、免註冊、直接開玩！')} />
      <meta property="og:url" content="https://schaoss.github.io/wall-go/" />
      <meta property="og:image" content="https://schaoss.github.io/wall-go/cover.png" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={t('seo.title', 'Wall Go（牆壁圍棋）| 線上策略桌遊 | Devil\'s Plan 同款遊戲')} />
      <meta name="twitter:description" content={t('seo.description', 'Wall Go（牆壁圍棋）－免費線上策略桌遊，支援單人/雙人、領地計分、復原重做、現代化 UI。Devil’s Plan 2 同款遊戲，開源、免註冊、直接開玩！')} />
      <meta name="twitter:image" content="https://schaoss.github.io/wall-go/cover.png" />
      <link rel="icon" type="image" href="/wall-go/favicon.ico" />
      <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    </Helmet>
  )
}
