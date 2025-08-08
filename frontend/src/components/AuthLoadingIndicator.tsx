import { motion } from 'framer-motion';
import NeoCircleLoader from './NeoCircleLoader';

interface AuthLoadingIndicatorProps {
  message?: string;
}

const AuthLoadingIndicator = ({ 
  message = "verifying you" 
}: AuthLoadingIndicatorProps) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="h-[500px] w-[100%] relative rounded-lg overflow-hidden bg-[var(--off-white)]"
    >
      {/* top-centered message (pushed slightly lower) */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-full text-center px-4">
        <p className="text-xl nyr text-black">{message}</p>
      </div>

      {/* centered loader */}
      <div className="absolute inset-0 flex items-center justify-center">
        <NeoCircleLoader size={110} />
      </div>

      {/* details text intentionally removed per request */}
    </motion.div>
  );
};

export default AuthLoadingIndicator;
