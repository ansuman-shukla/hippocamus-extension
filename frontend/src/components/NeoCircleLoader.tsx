import React from 'react';

/**
 * Neomorphic circular loader with green palette.
 * Self-contained CSS via <style> to avoid new deps.
 */
interface NeoCircleLoaderProps {
  size?: number; // overall square size in px
}

const NeoCircleLoader: React.FC<NeoCircleLoaderProps> = ({ size = 110 }) => {
  return (
    <div className="neo-circle-loader-wrapper">
      <div className="neo-circle-loader" style={{ width: size, height: size }}>
        <div className="neo-circle" />
      </div>

      <style>{`
        .neo-circle-loader-wrapper {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .neo-circle-loader {
          position: relative;
          overflow: hidden;
          background: #ffffff; /* surface */
          border-radius: 32px;
          transform-style: preserve-3d;
          /* neomorphic surface */
          box-shadow:
            12px 12px 24px rgba(0,0,0,0.12),
            -8px -8px 20px rgba(255,255,255,0.95),
            inset 2px 2px 6px rgba(0,0,0,0.06),
            inset -2px -2px 6px rgba(255,255,255,0.85);
        }

        .neo-circle {
          position: absolute;
          inset: 26px;
          background: #f3f7ef; /* subtle soft green tint */
          border-radius: 50%;
          transform-style: preserve-3d;
          box-shadow:
            6px 6px 16px rgba(21, 43, 74, 0.15),
            inset 6px 6px 10px rgba(255, 255, 255, 0.75),
            -8px -8px 16px rgba(255, 255, 255, 1);
        }

        .neo-circle::before {
          content: "";
          position: absolute;
          inset: 4px;
          background: conic-gradient(
            from 0deg,
            #3cb371,
            #44c978,
            #6fe28f,
            #b6f25e,
            #6fe28f,
            #44c978,
            #3cb371
          );
          mix-blend-mode: multiply;
          border-radius: 50%;
          animation: neo-anim 1.8s linear infinite;
        }

        .neo-circle::after {
          content: "";
          position: absolute;
          inset: 18px;
          filter: blur(0.6px);
          background: #ffffff;
          border-radius: 50%;
          z-index: 1;
          box-shadow:
            inset 6px 6px 10px rgba(0,0,0,0.04),
            inset -6px -6px 10px rgba(255,255,255,0.9);
        }

        @keyframes neo-anim {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default NeoCircleLoader;

