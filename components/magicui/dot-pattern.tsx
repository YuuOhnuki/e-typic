import * as React from 'react';

import { cn } from '@/lib/utils';

interface DotPatternProps extends React.SVGProps<SVGSVGElement> {
    width?: number;
    height?: number;
    cx?: number;
    cy?: number;
    cr?: number;
}

/**
 * MagicUI Dot Pattern inspired background SVG.
 */
export function DotPattern({
    className,
    width = 24,
    height = 24,
    cx = 1.25,
    cy = 1.25,
    cr = 1.25,
    ...props
}: DotPatternProps) {
    const patternId = React.useId();
    const { style, ...restProps } = props;

    return (
        <svg
            aria-hidden="true"
            className={cn('pointer-events-none absolute inset-0 h-full w-full', className)}
            {...restProps}
            style={{ color: 'var(--foreground)', ...style }}
        >
            <defs>
                <pattern id={patternId} width={width} height={height} patternUnits="userSpaceOnUse">
                    <circle cx={cx} cy={cy} r={cr} fill="currentColor" fillOpacity={0.34} />
                </pattern>
            </defs>
            <rect width="100%" height="100%" fill={`url(#${patternId})`} />
        </svg>
    );
}
