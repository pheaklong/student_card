import React from 'react';

// Official Coat of Arms / Ministry of Education, Youth & Sport Emblem
export const MoEYSEmblem: React.FC<{ className?: string; size?: number }> = ({
  className = '',
  size = 54,
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Outer Golden Sun Rays / Lotus ring */}
      <circle cx="50" cy="50" r="48" fill="#FBF3DB" stroke="#B45309" strokeWidth="1.5" />
      <circle cx="50" cy="50" r="44" fill="#0284C7" stroke="#F59E0B" strokeWidth="1.5" />
      
      {/* Ray spikes */}
      {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
        <line
          key={deg}
          x1="50"
          y1="6"
          x2="50"
          y2="10"
          stroke="#F59E0B"
          strokeWidth="2"
          strokeLinecap="round"
          transform={`rotate(${deg} 50 50)`}
        />
      ))}

      {/* Inner sacred lotus pedestal & lamp of wisdom */}
      <circle cx="50" cy="50" r="34" fill="#0C4A6E" stroke="#FEF08A" strokeWidth="1" />
      
      {/* Lotus base petals */}
      <path
        d="M26 64 C35 58, 42 62, 50 67 C58 62, 65 58, 74 64 C70 73, 58 75, 50 75 C42 75, 30 73, 26 64 Z"
        fill="#F59E0B"
        stroke="#B45309"
        strokeWidth="1"
      />
      <path
        d="M32 68 C40 64, 46 66, 50 69 C54 66, 60 64, 68 68 C64 74, 56 75, 50 75 C44 75, 36 74, 32 68 Z"
        fill="#FEF08A"
      />

      {/* Trai-Pidok Sacred Manuscript Box / Open Book on Pedestal */}
      <path
        d="M35 55 Q50 51 65 55 L65 59 Q50 55 35 59 Z"
        fill="#FFFFFF"
        stroke="#0284C7"
        strokeWidth="0.8"
      />
      <path
        d="M36 52 Q50 48 64 52 L64 54 Q50 50 36 54 Z"
        fill="#FDE047"
        stroke="#B45309"
        strokeWidth="0.5"
      />

      {/* Flaming Sacred Torch / Pen of Wisdom */}
      <path
        d="M48 24 C46 32, 44 42, 47 48 L53 48 C56 42, 54 32, 52 24 C50 20, 50 20, 48 24 Z"
        fill="#EF4444"
      />
      <path
        d="M49 26 C48 32, 47 38, 48 44 L52 44 C53 38, 52 32, 51 26 Z"
        fill="#FBBF24"
      />
      
      {/* Flame top aura */}
      <path
        d="M50 16 C48 20, 47 22, 50 25 C53 22, 52 20, 50 16 Z"
        fill="#F59E0B"
      />

      {/* Left and Right Rice/Kbach Garland ears */}
      <path
        d="M24 48 C22 36, 30 28, 36 25 C34 31, 31 38, 34 46"
        stroke="#FBBF24"
        strokeWidth="1.8"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M76 48 C78 36, 70 28, 64 25 C66 31, 69 38, 66 46"
        stroke="#FBBF24"
        strokeWidth="1.8"
        strokeLinecap="round"
        fill="none"
      />

      {/* Lower ribbon with year/stars */}
      <circle cx="50" cy="80" r="1.5" fill="#F59E0B" />
      <circle cx="44" cy="79" r="1.2" fill="#F59E0B" />
      <circle cx="56" cy="79" r="1.2" fill="#F59E0B" />
    </svg>
  );
};

// Official Red Seal Stamp (ត្រាក្រហមរដ្ឋបាល)
export const OfficialRedStamp: React.FC<{
  schoolName?: string;
  principalName?: string;
  className?: string;
  size?: number;
}> = ({
  schoolName = 'វិទ្យាល័យ តាំងក្រូច',
  principalName = 'ម៉ិច កន្នដ្ឋារ៉ា',
  className = '',
  size = 86,
}) => {
  return (
    <div
      className={`relative inline-block select-none pointer-events-none shrink-0 max-w-none max-h-none ${className}`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        minWidth: `${size}px`,
        minHeight: `${size}px`,
        maxWidth: 'none',
        maxHeight: 'none',
      }}
    >
      <svg
        viewBox="0 0 100 100"
        style={{
          width: `${size}px`,
          height: `${size}px`,
          minWidth: `${size}px`,
          minHeight: `${size}px`,
          maxWidth: 'none',
          maxHeight: 'none',
        }}
        className="transform -rotate-6 opacity-85 mix-blend-multiply block max-w-none max-h-none"
      >
        {/* Outer and inner concentric red rings with ink bleed effect */}
        <circle
          cx="50"
          cy="50"
          r="46"
          fill="none"
          stroke="#DC2626"
          strokeWidth="2.2"
          strokeDasharray="95 1"
        />
        <circle
          cx="50"
          cy="50"
          r="42"
          fill="none"
          stroke="#DC2626"
          strokeWidth="0.8"
        />
        <circle
          cx="50"
          cy="50"
          r="26"
          fill="none"
          stroke="#DC2626"
          strokeWidth="1.2"
        />

        {/* Circular text top: ក្រសួងអប់រំ យុវជន និងកីឡា */}
        <path
          id="upperStampPath"
          d="M 18,50 A 32,32 0 1,1 82,50"
          fill="none"
        />
        <text
          fill="#DC2626"
          fontSize="6.2"
          fontWeight="700"
          fontFamily="'Kantumruy Pro', 'Kantumruy', sans-serif"
        >
          <textPath href="#upperStampPath" startOffset="50%" textAnchor="middle">
            ក្រសួងអប់រំ យុវជន និងកីឡា
          </textPath>
        </text>

        {/* Circular text bottom: School name */}
        <path
          id="lowerStampPath"
          d="M 18,50 A 32,32 0 0,0 82,50"
          fill="none"
        />
        <text
          fill="#DC2626"
          fontSize="5.8"
          fontWeight="700"
          fontFamily="'Kantumruy Pro', 'Kantumruy', sans-serif"
        >
          <textPath href="#lowerStampPath" startOffset="50%" textAnchor="middle">
            {schoolName.length > 22 ? schoolName.slice(0, 22) + '...' : schoolName}
          </textPath>
        </text>

        {/* Center Star and Khmer symbol */}
        <polygon
          points="50,33 53,42 62,42 55,47 57,56 50,51 43,56 45,47 38,42 47,42"
          fill="#DC2626"
          opacity="0.9"
        />
        {/* Center text */}
        <text
          x="50"
          y="63"
          textAnchor="middle"
          fill="#DC2626"
          fontSize="5"
          fontWeight="bold"
          fontFamily="'Kantumruy Pro', sans-serif"
        >
          នាយក
        </text>
      </svg>
    </div>
  );
};

// Principal Calligraphic Signature SVG
export const PrincipalSignature: React.FC<{ className?: string; width?: number; height?: number }> = ({
  className = '',
  width = 110,
  height = 42,
}) => {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 160 60"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M15 45 C30 20, 45 10, 52 25 C58 37, 48 50, 40 45 C32 40, 36 28, 55 18 C74 8, 88 38, 92 48 C96 58, 102 30, 115 22 C125 15, 138 25, 148 40"
        stroke="#1E3A8A"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M48 38 Q80 44 140 32"
        stroke="#1E3A8A"
        strokeWidth="2.1"
        strokeLinecap="round"
      />
      <path
        d="M95 18 L108 42"
        stroke="#1E3A8A"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
};

// Default Cambodian Student Avatar (Boy / Girl Silhouette in uniform)
export const DefaultStudentAvatar: React.FC<{
  gender?: 'ប្រុស' | 'ស្រី' | string;
  className?: string;
}> = ({ gender = 'ប្រុស', className = '' }) => {
  const isFemale = gender === 'ស្រី';

  return (
    <div
      className={`w-full h-full bg-gradient-to-b from-sky-50 to-sky-100 flex flex-col items-center justify-end overflow-hidden ${className}`}
    >
      <svg
        viewBox="0 0 80 100"
        className="w-full h-full text-slate-700"
        fill="currentColor"
      >
        {/* Head */}
        <circle cx="40" cy="32" r="16" fill="#D1D5DB" />
        {/* Hair */}
        {isFemale ? (
          <path
            d="M20 36 C20 18, 30 14, 40 14 C50 14, 60 18, 60 36 C55 34, 48 24, 40 24 C32 24, 25 34, 20 36 Z"
            fill="#374151"
          />
        ) : (
          <path
            d="M23 30 C24 18, 32 14, 40 14 C48 14, 56 18, 57 30 C53 26, 48 24, 40 24 C32 24, 27 26, 23 30 Z"
            fill="#374151"
          />
        )}
        {/* Shoulders & Uniform White Shirt */}
        <path
          d="M10 92 C10 65, 26 55, 40 55 C54 55, 70 65, 70 92 Z"
          fill="#FFFFFF"
          stroke="#9CA3AF"
          strokeWidth="1"
        />
        {/* Collar & Tie */}
        <polygon points="40,55 34,65 40,63 46,65" fill="#E5E7EB" stroke="#9CA3AF" strokeWidth="0.5" />
        <polygon points="38,64 42,64 43,80 40,84 37,80" fill="#1E3A8A" />
      </svg>
    </div>
  );
};
