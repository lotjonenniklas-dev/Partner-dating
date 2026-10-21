import type { Scene } from "@/lib/people"

function Hair({ style, color }: { style: Scene["hairStyle"]; color: string }) {
  if (style === "bob") {
    return (
      <path
        d="M118 118c2-46 28-72 82-74 58-2 86 28 84 78 2 18-4 28-8 36-8-28-22-40-36-28-6 22-18 34-40 34s-36-14-42-36c-12-8-28 2-36 26-6-10-8-22-4-36z"
        fill={color}
      />
    )
  }
  if (style === "short") {
    return (
      <path
        d="M126 124c0-48 26-70 74-72 50-2 78 24 78 70 0 10-2 16-4 20-16-22-36-28-52-16-8-18-28-24-48-12-14-16-34-12-46 8-2-6-2-14-2 2z"
        fill={color}
      />
    )
  }
  if (style === "wavy") {
    return (
      <path
        d="M108 140c6-62 36-96 94-98 62-2 96 36 92 98-2 20 8 34 6 58-16 6-20-16-28-28-10 22-8 48-2 70-18-6-22-28-30-44-8 20-6 42 2 62-20 0-28-24-34-42-8 16-4 36 4 52-22-4-36-28-38-52 4-16-8-36-18-46-12-10-28-6-40-8-6-24 2-48 10-70-8-16-22-22-18-52z"
        fill={color}
      />
    )
  }
  if (style === "bun") {
    return (
      <g fill={color}>
        <circle cx="200" cy="58" r="28" />
        <path d="M132 128c2-42 24-66 68-68 46-2 74 26 72 68 0 8-8 14-16 12-10-28-24-36-40-22-10-20-34-24-50-6-12-18-28-14-34 16z" />
      </g>
    )
  }
  if (style === "crop") {
    return (
      <path
        d="M138 112c8-36 28-52 62-52s56 16 64 50c6 4 14 16 10 28-18-8-28-2-34 12-12-16-30-20-46-8-14-14-32-12-44 4-8-12-16-22-12-34z"
        fill={color}
      />
    )
  }
  if (style === "curls") {
    return (
      <g fill={color}>
        <circle cx="150" cy="96" r="22" />
        <circle cx="176" cy="74" r="24" />
        <circle cx="208" cy="68" r="26" />
        <circle cx="240" cy="82" r="24" />
        <circle cx="258" cy="110" r="20" />
        <circle cx="146" cy="124" r="18" />
        <circle cx="258" cy="138" r="16" />
        <path d="M150 130c8 28 22 40 50 40s44-14 52-40c-16 10-34 14-52 14s-36-4-50-14z" />
      </g>
    )
  }
  return (
    <g fill={color}>
      <path d="M128 126c4-46 30-70 74-72 48-2 76 26 74 72-2 8-10 12-16 8 2-24-8-40-28-46-6 20-22 32-42 30-16-16-36-14-50-2-8-8-14-6-12 10z" />
      <path d="M236 118c28 10 48 42 52 78 8 4 20 2 24-8-6-40-24-74-58-90-8 6-14 14-18 20z" />
    </g>
  )
}

function Prop({ kind, accent }: { kind: Scene["prop"]; accent: string }) {
  if (kind === "arch") {
    return (
      <g fill="none" stroke={accent} strokeWidth="7" opacity="0.85">
        <path d="M36 168 V78 h36 a28 28 0 0 1 56 0 h36 V168" />
      </g>
    )
  }
  if (kind === "pan") {
    return (
      <g>
        <ellipse cx="78" cy="132" rx="34" ry="12" fill={accent} />
        <rect x="108" y="127" width="42" height="8" rx="4" fill="#5c4034" />
      </g>
    )
  }
  if (kind === "sketch") {
    return (
      <g>
        <rect x="36" y="70" width="70" height="86" rx="4" fill="#f3f5f7" transform="rotate(-8 70 110)" />
        <path d="M48 100c16-14 24 8 40-8M50 122h36" stroke={accent} strokeWidth="3" fill="none" />
      </g>
    )
  }
  if (kind === "trail") {
    return (
      <path
        d="M24 150c36-24 44 8 78-6 30-12 34 14 66 2"
        fill="none"
        stroke="#e6eeea"
        strokeWidth="10"
        strokeLinecap="round"
      />
    )
  }
  if (kind === "boat") {
    return (
      <g>
        <path d="M286 150c24 14 58 14 86 0l-8 18h-70z" fill="#eef2f4" />
        <path d="M328 150 V96" stroke="#eef2f4" strokeWidth="4" />
        <path d="M328 100 l34 24 h-34" fill={accent} />
      </g>
    )
  }
  if (kind === "guitar") {
    return (
      <g transform="translate(332 78) rotate(16)">
        <ellipse cx="0" cy="40" rx="18" ry="24" fill={accent} />
        <circle cx="0" cy="42" r="6" fill="#2c2430" />
        <rect x="-3" y="-20" width="6" height="58" rx="3" fill="#e7d7b4" />
      </g>
    )
  }
  if (kind === "vase") {
    return (
      <g>
        <path d="M48 150c6-24 16-32 24-32s18 8 24 32c2 8-6 12-24 12s-26-4-24-12z" fill={accent} />
        <rect x="64" y="112" width="14" height="12" fill={accent} />
        <ellipse cx="71" cy="112" rx="12" ry="4" fill="#f6efe6" />
      </g>
    )
  }
  return (
    <g>
      <rect x="28" y="132" width="96" height="12" rx="3" fill="#8a5a32" />
      <rect x="40" y="144" width="8" height="24" fill="#6d4630" />
      <rect x="104" y="144" width="8" height="24" fill="#6d4630" />
    </g>
  )
}

export function Portrait({
  scene,
  className,
}: {
  scene: Scene
  className?: string
}) {
  return (
    <svg
      viewBox="0 0 400 520"
      className={className}
      aria-hidden="true"
      preserveAspectRatio="xMidYMid slice"
    >
      <rect width="400" height="520" fill={scene.sky} />
      <circle cx="320" cy="80" r="70" fill={scene.skyDeep} opacity="0.85" />
      <rect y="300" width="400" height="220" fill={scene.ground} />
      <Prop kind={scene.prop} accent={scene.accent} />
      <g>
        <path
          d="M92 470c18-110 40-150 108-150s92 40 108 150"
          fill={scene.shirt}
        />
        <path d="M176 300h48v36h-48z" fill={scene.skin} />
        <ellipse cx="200" cy="236" rx="58" ry="68" fill={scene.skin} />
        <g transform="translate(0 78)">
          <Hair style={scene.hairStyle} color={scene.hair} />
        </g>
        {scene.beard && (
          <path
            d="M162 246h76c2 18-12 36-38 36s-40-18-38-36z"
            fill={scene.hair}
            opacity="0.92"
          />
        )}
        <ellipse cx="178" cy="232" rx="3.5" ry="4" fill="#241c18" />
        <ellipse cx="222" cy="232" rx="3.5" ry="4" fill="#241c18" />
        <path
          d="M188 262h24"
          fill="none"
          stroke="#8d6256"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </g>
    </svg>
  )
}

export function Monogram({
  name,
  className,
}: {
  name: string
  className?: string
}) {
  const letter = name.trim().charAt(0).toUpperCase() || "P"
  return (
    <div
      className={`grid place-items-center bg-primary font-heading text-primary-foreground ${className ?? ""}`}
      aria-hidden="true"
    >
      {letter}
    </div>
  )
}
