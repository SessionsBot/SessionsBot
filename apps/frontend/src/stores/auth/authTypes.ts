// Response class/types:
type ResyncSuccess<T> = {
    success: true;
    data: T;
}

type ResyncError = {
    success: false;
    data: {
        reason: 'COOLDOWN' | 'BUSY' | 'NO SESSION' | 'NO TOKEN' | 'NO SYNC DATE' | 'REFRESH ERROR';
        message: string;
        rawErr?: unknown;
    }
}

export type ResyncResult<T> = ResyncSuccess<T> | ResyncError;