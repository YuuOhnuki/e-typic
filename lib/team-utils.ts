/**
 * Team mode utility functions - styling and classification
 */

import { TeamMode } from '@/types/multiplayer';

/**
 * Get CSS class for team-related text display
 */
export const getTeamNameClass = (mode: TeamMode, teamId: 'A' | 'B' | null | undefined): string => {
    if (mode !== 'two-teams') return 'text-foreground';
    if (teamId === 'A') return 'text-cyan-600 dark:text-cyan-300';
    if (teamId === 'B') return 'text-rose-600 dark:text-rose-300';
    return 'text-muted-foreground';
};

/**
 * Get CSS class for team badge display
 */
export const getTeamBadgeClass = (mode: TeamMode, teamId: 'A' | 'B' | null | undefined): string => {
    if (mode !== 'two-teams') return 'bg-muted text-muted-foreground';
    if (teamId === 'A') return 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300';
    if (teamId === 'B') return 'bg-rose-500/15 text-rose-700 dark:text-rose-300';
    return 'bg-muted text-muted-foreground';
};
