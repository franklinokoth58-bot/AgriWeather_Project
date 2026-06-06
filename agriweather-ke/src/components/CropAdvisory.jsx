import { motion } from 'framer-motion';
import { getAdvisoriesFromWeatherData } from '../utils/cropAdvisory';

const levelStyles = {
  good: {
    container: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700',
    badge: 'bg-green-100 dark:bg-green-800/50 text-green-700 dark:text-green-300',
    title: 'text-green-800 dark:text-green-300',
    message: 'text-green-700 dark:text-green-400',
  },
  caution: {
    container: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700',
    badge: 'bg-amber-100 dark:bg-amber-800/50 text-amber-700 dark:text-amber-300',
    title: 'text-amber-800 dark:text-amber-300',
    message: 'text-amber-700 dark:text-amber-400',
  },
  warning: {
    container: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700',
    badge: 'bg-red-100 dark:bg-red-800/50 text-red-700 dark:text-red-300',
    title: 'text-red-800 dark:text-red-300',
    message: 'text-red-700 dark:text-red-400',
  },
};

const levelLabel = { good: 'Good', caution: 'Caution', warning: 'Warning' };

/**
 * CropAdvisory — derives and displays actionable farming advice.
 *
 * @prop {object} weatherData - Full API weather response
 */
function CropAdvisory({ weatherData }) {
  const advisories = getAdvisoriesFromWeatherData(weatherData);

  if (!advisories.length) return null;

  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl">🌾</span>
        <h2 className="font-bold text-lg text-slate-800 dark:text-slate-100">Crop Advisory</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {advisories.map((advisory, index) => {
          const styles = levelStyles[advisory.level];
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.35, delay: index * 0.07 }}
              className={`rounded-xl border p-4 ${styles.container}`}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl shrink-0 mt-0.5">{advisory.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className={`font-semibold text-sm ${styles.title}`}>
                      {advisory.title}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${styles.badge}`}>
                      {levelLabel[advisory.level]}
                    </span>
                  </div>
                  <p className={`text-sm leading-relaxed ${styles.message}`}>
                    {advisory.message}
                  </p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

export default CropAdvisory;
