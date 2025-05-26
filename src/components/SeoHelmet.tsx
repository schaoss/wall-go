import { Helmet } from 'react-helmet-async'
import { useTranslation } from 'react-i18next'

export default function SeoHelmet() {
  const { t, i18n } = useTranslation()

  return (
    <Helmet>
      <html lang={i18n.language} />
      <title>{t('seo.title', 'Wall Go | Online Strategy Board Game | Devil\'s Plan Inspired')}</title>
      <meta name="description" content={t('seo.description', 'Wall Go – Free online strategy board game inspired by Devil’s Plan. Play solo or with friends, territory scoring, undo/redo, and a modern UI. No signup needed, just play!')} />
      <meta name="keywords" content={t('seo.keywords', 'Wall Go, Devil\'s Plan, board game, strategy game, undo redo, territory, open source, browser game, wallgo, devil\'s plan game, wall go single player')} />
      <meta name="robots" content="index,follow" />
      <meta name="theme-color" content="#f43f5e" />
      <meta property="og:type" content="website" />
      <meta property="og:title" content={t('seo.title', 'Wall Go | Online Strategy Board Game | Devil\'s Plan Inspired')} />
      <meta property="og:description" content={t('seo.description', 'Wall Go – Free online strategy board game inspired by Devil’s Plan. Play solo or with friends, territory scoring, undo/redo, and a modern UI. No signup needed, just play!')} />
      <meta property="og:url" content="https://schaoss.github.io/wall-go/" />
      <meta property="og:image" content="https://schaoss.github.io/wall-go/cover.png" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={t('seo.title', 'Wall Go | Online Strategy Board Game | Devil\'s Plan Inspired')} />
      <meta name="twitter:description" content={t('seo.description', 'Wall Go – Free online strategy board game inspired by Devil’s Plan. Play solo or with friends, territory scoring, undo/redo, and a modern UI. No signup needed, just play!')} />
      <meta name="twitter:image" content="https://schaoss.github.io/wall-go/cover.png" />
      <link rel="icon" type="image" href="/wall-go/favicon.ico" />
      <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    </Helmet>
  )
}
