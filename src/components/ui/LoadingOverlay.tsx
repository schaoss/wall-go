import { useTranslation } from 'react-i18next';

interface LoadingOverlayProps {
  message?: string;
  isVisible: boolean;
}

export function LoadingOverlay({ message, isVisible }: LoadingOverlayProps) {
  const { t } = useTranslation();

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/70">
      <div className="flex flex-col items-center space-y-4 rounded-lg bg-white p-8 shadow-xl dark:bg-gray-800">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600 dark:border-gray-600 dark:border-t-blue-400"></div>
        {message && (
          <p className="text-center text-gray-700 dark:text-gray-200">
            {message}
          </p>
        )}
        {!message && (
          <p className="text-center text-gray-700 dark:text-gray-200">
            {t('common.loading')}
          </p>
        )}
      </div>
    </div>
  );
}