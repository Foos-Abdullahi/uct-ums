import { FileIcon, Trash2, Upload } from 'lucide-react';
import * as React from 'react';
import {
    useCallback,
    useEffect,
    useId,
    useMemo,
    useReducer,
    useRef,
} from 'react';
import type { ChangeEvent, DragEvent } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export interface ValidationError {
    fileName: string;
    type: 'SIZE' | 'TYPE' | 'COUNT';
    message: string;
}

export interface FileUploaderProps {
    id?: string;
    name?: string;
    /** MIME types (e.g. `image/jpeg`), wildcards (`image/*`), and/or extensions (e.g. `.pdf`). Empty allows any type. */
    accept?: string[];
    maxSizeMB?: number;
    maxFiles?: number;
    multiple?: boolean;
    onFilesChange?: (files: File[]) => void;
    className?: string;
    disabled?: boolean;
    title?: string;
    description?: string;
}

interface UploaderState {
    files: File[];
    errors: ValidationError[];
    isDragging: boolean;
    activeIndex: number;
}

type UploaderAction =
    | { type: 'SET_DRAGGING'; payload: boolean }
    | {
          type: 'ADD_FILES';
          payload: { files: File[]; errors: ValidationError[]; multiple: boolean };
      }
    | { type: 'REMOVE_FILE'; payload: number }
    | { type: 'SET_ERRORS'; payload: ValidationError[] }
    | { type: 'SET_ACTIVE'; payload: number };

const uploaderReducer = (state: UploaderState, action: UploaderAction): UploaderState => {
    switch (action.type) {
        case 'SET_DRAGGING':
            return { ...state, isDragging: action.payload };
        case 'ADD_FILES': {
            const { files: incoming, errors, multiple: isMulti } = action.payload;

            if (incoming.length === 0 && errors.length > 0) {
                return { ...state, errors };
            }

            const updatedFiles = isMulti ? [...state.files, ...incoming] : incoming[0] ? [incoming[0]] : state.files;
            const nextActive =
                incoming.length > 0 ? (isMulti ? Math.max(0, state.files.length + incoming.length - 1) : 0) : state.activeIndex;

            return {
                ...state,
                files: updatedFiles,
                errors,
                activeIndex: Math.min(nextActive, Math.max(0, updatedFiles.length - 1)),
            };
        }
        case 'REMOVE_FILE': {
            const next = state.files.filter((_, idx) => idx !== action.payload);
            const nextActive = Math.min(state.activeIndex, Math.max(0, next.length - 1));

            return { ...state, files: next, errors: [], activeIndex: nextActive };
        }
        case 'SET_ERRORS':
            return { ...state, errors: action.payload };
        case 'SET_ACTIVE':
            return { ...state, activeIndex: action.payload };
        default:
            return state;
    }
};

export function formatBytes(bytes: number): string {
    if (bytes === 0) {
        return '0 Bytes';
    }

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
}

function getExtension(name: string): string {
    const parts = name.split('.');

    return parts.length > 1 ? (parts.pop() ?? '').toLowerCase() : '';
}

/**
 * Returns true when `accept` is empty, or the file matches at least one accept token
 * (MIME, `category/*`, or leading-dot extension).
 */
export function fileMatchesAccept(file: File, accept: string[]): boolean {
    if (accept.length === 0) {
        return true;
    }

    const ext = getExtension(file.name);
    const mime = (file.type || '').toLowerCase();

    return accept.some((raw) => {
        const token = raw.trim().toLowerCase();

        if (!token) {
            return false;
        }

        if (token.startsWith('.')) {
            return ext === token.slice(1);
        }

        if (token.endsWith('/*')) {
            const prefix = token.slice(0, -1);

            return mime.startsWith(prefix);
        }

        return mime === token;
    });
}

function summarizeAccept(accept: string[]): string {
    if (accept.length === 0) {
        return 'Any file type';
    }

    return accept
        .map((t) => {
            const s = t.trim();

            if (s.startsWith('.')) {
                return s.toUpperCase();
            }

            if (s.includes('/')) {
                return s.split('/').pop() ?? s;
            }

            return s;
        })
        .join(', ');
}

function formatLastModified(ms: number): string {
    try {
        return new Intl.DateTimeFormat(undefined, {
            dateStyle: 'medium',
            timeStyle: 'short',
        }).format(new Date(ms));
    } catch {
        return new Date(ms).toLocaleString();
    }
}

interface DropZoneProps {
    isDragging: boolean;
    acceptLabel: string;
    maxSizeMB: number;
    multiple: boolean;
    maxFiles: number;
    disabled: boolean;
    inputId: string;
    desc: string;
    onTriggerClick: () => void;
}

function DropZone({
    isDragging,
    acceptLabel,
    maxSizeMB,
    multiple,
    maxFiles,
    disabled,
    inputId,
    desc,
    onTriggerClick,
}: DropZoneProps) {
    return (
        <button
            type="button"
            disabled={disabled}
            onClick={onTriggerClick}
            aria-controls={inputId}
            className={cn(
                'border-input bg-background hover:bg-accent/30 focus-visible:ring-ring flex w-full flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed p-4 text-center transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
                isDragging && 'border-primary bg-primary/5',
                disabled && 'pointer-events-none opacity-50',
            )}
        >
            <Upload className="text-muted-foreground size-6" aria-hidden />
            <div className="space-y-1">
                <p className="text-sm font-medium">
                    <span className="text-primary">Click to upload</span>
                    <span className="text-muted-foreground"> or drag and drop</span>
                </p>
                <p className="text-muted-foreground text-xs">
                    {desc} 
                </p>
            </div>
        </button>
    );
}

function ErrorAlerts({ errors }: { errors: ValidationError[] }) {
    if (errors.length === 0) {
        return null;
    }

    return (
        <div
            role="alert"
            className="border-destructive/30 bg-destructive/5 text-destructive rounded-sm border px-3 py-2 text-xs space-y-1"
        >
            {errors.map((err, idx) => (
                <div key={`${err.type}-${err.fileName}-${idx}`} className="flex gap-2">
                    <span className="font-medium shrink-0">{err.fileName}</span>
                    <span className="min-w-0">{err.message}</span>
                </div>
            ))}
        </div>
    );
}

interface FileMetadataProps {
    file: File;
    imageDimensions: { width: number; height: number } | null;
}

function FileMetadata({ file, imageDimensions }: FileMetadataProps) {
    const ext = getExtension(file.name);

    return (
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
            <dt className="text-muted-foreground">Name</dt>
            <dd className="min-w-0 truncate font-medium" title={file.name}>
                {file.name}
            </dd>
            <dt className="text-muted-foreground">Size</dt>
            <dd>{formatBytes(file.size)}</dd>
            <dt className="text-muted-foreground">Type</dt>
            <dd className="min-w-0 break-all">{file.type || 'Unknown (no MIME)'}</dd>
            <dt className="text-muted-foreground">Extension</dt>
            <dd>{ext ? `.${ext}` : '—'}</dd>
            <dt className="text-muted-foreground">Modified</dt>
            <dd>{formatLastModified(file.lastModified)}</dd>
            {imageDimensions && (
                <>
                    <dt className="text-muted-foreground">Dimensions</dt>
                    <dd>
                        {imageDimensions.width} × {imageDimensions.height} px
                    </dd>
                </>
            )}
        </dl>
    );
}

interface PreviewPaneProps {
    file: File;
    objectUrl: string;
    onImageLoad: (w: number, h: number) => void;
}

function PreviewPane({ file, objectUrl, onImageLoad }: PreviewPaneProps) {
    const kind = file.type.startsWith('image/')
        ? 'image'
        : file.type.startsWith('video/')
          ? 'video'
          : file.type.startsWith('audio/')
            ? 'audio'
            : file.type === 'application/pdf'
              ? 'pdf'
              : 'other';

    if (kind === 'image') {
        return (
            <div className="bg-muted/40 flex max-h-72 items-center justify-center overflow-hidden rounded-md border">
                <img
                    src={objectUrl}
                    alt={`Preview of ${file.name}`}
                    className="max-h-72 w-full object-contain"
                    onLoad={(e) => {
                        const el = e.currentTarget;
                        onImageLoad(el.naturalWidth, el.naturalHeight);
                    }}
                />
            </div>
        );
    }

    if (kind === 'video') {
        return (
            <div className="bg-muted/40 overflow-hidden rounded-md border">
                <video src={objectUrl} controls className="max-h-72 w-full" preload="metadata" />
            </div>
        );
    }

    if (kind === 'audio') {
        return (
            <div className="bg-muted/40 flex flex-col items-center gap-3 rounded-md border p-6">
                <audio src={objectUrl} controls className="w-full max-w-md" preload="metadata" />
            </div>
        );
    }

    if (kind === 'pdf') {
        return (
            <div className="bg-muted/40 h-72 overflow-hidden rounded-md border">
                <iframe title={`PDF preview: ${file.name}`} src={objectUrl} className="size-full border-0" />
            </div>
        );
    }

    return (
        <div className="bg-muted/40 text-muted-foreground flex h-48 flex-col items-center justify-center gap-2 rounded-md border">
            <FileIcon className="size-12 opacity-50" />
            <p className="text-sm">No visual preview for this file type</p>
            <Badge variant="secondary">{file.type || 'Unknown type'}</Badge>
        </div>
    );
}

export function FileUploader({
    id,
    name = 'files',
    accept = [],
    maxSizeMB = 5,
    maxFiles = 1,
    multiple = false,
    onFilesChange,
    className,
    disabled = false,
    description,
}: FileUploaderProps) {
    const reactId = useId();
    const inputId = id ?? `file-upload-${reactId}`;
    const [state, dispatch] = useReducer(uploaderReducer, {
        files: [],
        errors: [],
        isDragging: false,
        activeIndex: 0,
    });

    const fileInputRef = useRef<HTMLInputElement>(null);
    const maxBytes = maxSizeMB * 1024 * 1024;
    const acceptLabel = useMemo(() => summarizeAccept(accept), [accept]);

    const activeFile = state.files[state.activeIndex] ?? null;
    const [imageDimsByKey, setImageDimsByKey] = React.useState<Record<string, { width: number; height: number }>>({});

    const fileKeys = useMemo(
        () => state.files.map((f, i) => `${f.name}-${f.size}-${f.lastModified}-${i}`),
        [state.files],
    );

    const objectUrls = useMemo(() => {
        const map = new Map<string, string>();
        state.files.forEach((file, i) => {
            map.set(fileKeys[i]!, URL.createObjectURL(file));
        });

        return map;
    }, [state.files, fileKeys]);

    useEffect(() => {
        return () => {
            objectUrls.forEach((url) => URL.revokeObjectURL(url));
        };
    }, [objectUrls]);

    const activeKey = activeFile ? fileKeys[state.activeIndex] : null;
    const activeObjectUrl = activeKey ? objectUrls.get(activeKey) : undefined;

    const setDimsForKey = useCallback((key: string, w: number, h: number) => {
        setImageDimsByKey((prev) => {
            const cur = prev[key];

            if (cur?.width === w && cur?.height === h) {
                return prev;
            }

            return { ...prev, [key]: { width: w, height: h } };
        });
    }, []);

    const validateAndDispatch = useCallback(
        (incomingFiles: File[]) => {
            const list = multiple ? incomingFiles : incomingFiles.slice(0, 1);
            const freshErrors: ValidationError[] = [];
            const passingFiles: File[] = [];

            if (multiple && state.files.length + list.length > maxFiles) {
                freshErrors.push({
                    fileName: 'Selection',
                    type: 'COUNT',
                    message: `You can upload at most ${maxFiles} files (currently ${state.files.length} selected).`,
                });
                dispatch({ type: 'SET_ERRORS', payload: freshErrors });

                return;
            }

            if (!multiple && list.length > 1) {
                freshErrors.push({
                    fileName: 'Selection',
                    type: 'COUNT',
                    message: 'Only one file is allowed.',
                });
                dispatch({ type: 'SET_ERRORS', payload: freshErrors });

                return;
            }

            list.forEach((file) => {
                if (accept.length > 0 && !fileMatchesAccept(file, accept)) {
                    freshErrors.push({
                        fileName: file.name,
                        type: 'TYPE',
                        message: `File type is not allowed. Accepted: ${acceptLabel}.`,
                    });

                    return;
                }

                if (file.size > maxBytes) {
                    freshErrors.push({
                        fileName: file.name,
                        type: 'SIZE',
                        message: `File is too large (${formatBytes(file.size)}). Maximum is ${maxSizeMB} MB.`,
                    });

                    return;
                }

                passingFiles.push(file);
            });

            dispatch({
                type: 'ADD_FILES',
                payload: { files: passingFiles, errors: freshErrors, multiple },
            });

            if (onFilesChange && passingFiles.length > 0) {
                const nextFiles = multiple ? [...state.files, ...passingFiles] : [passingFiles[0]!];
                onFilesChange(nextFiles);
            }
        },
        [accept, acceptLabel, maxBytes, maxFiles, maxSizeMB, multiple, onFilesChange, state.files],
    );

    const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.length) {
            validateAndDispatch(Array.from(e.target.files));
        }

        e.target.value = '';
    };

    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        dispatch({ type: 'SET_DRAGGING', payload: false });

        if (e.dataTransfer.files?.length) {
            validateAndDispatch(Array.from(e.dataTransfer.files));
        }
    };

    const removeFileAtIndex = (index: number) => {
        const key = fileKeys[index];
        dispatch({ type: 'REMOVE_FILE', payload: index });

        if (key) {
            setImageDimsByKey((prev) => {
                if (!(key in prev)) {
                    return prev;
                }

                const next = { ...prev };
                delete next[key];

                return next;
            });
        }

        if (onFilesChange) {
            onFilesChange(state.files.filter((_, idx) => idx !== index));
        }
    };

    const acceptAttr = accept.join(',');

    return (
        <div className={cn('w-full space-y-1', className)}>
            <Card className='p-0 bg-transparent shadow-none border-none'>
                <CardContent className="space-y-1 p-0">
                    {state.files.length < 1 && (
                        <div
                            onDragOver={(e) => {
                                e.preventDefault();

                                if (!disabled) {
                                    dispatch({ type: 'SET_DRAGGING', payload: true });
                                }
                            }}
                            onDragLeave={() => dispatch({ type: 'SET_DRAGGING', payload: false })}
                            onDrop={disabled ? undefined : handleDrop}
                        >
                            <DropZone
                                isDragging={state.isDragging}
                                acceptLabel={acceptLabel}
                                maxSizeMB={maxSizeMB}
                                multiple={multiple}
                                maxFiles={maxFiles}
                                disabled={disabled}
                                inputId={inputId}
                                desc={description ? description : ''}
                                onTriggerClick={() => {
                                    if (!disabled) {
                                        fileInputRef.current?.click();
                                    }
                                }}
                            />
                            <input
                                id={inputId}
                                name={name}
                                type="file"
                                ref={fileInputRef}
                                onChange={handleInputChange}
                                accept={acceptAttr || undefined}
                                multiple={multiple}
                                disabled={disabled}
                                className="sr-only"
                            />
                        </div>
                    )}

                    <ErrorAlerts errors={state.errors} />

                    {/* {state.files.length > 0 && activeFile && activeObjectUrl && (
                        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
                            <div className="space-y-2">
                                <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">Preview</p>
                                <PreviewPane
                                    file={activeFile}
                                    objectUrl={activeObjectUrl}
                                    onImageLoad={(w, h) => {
                                        if (activeKey) {
                                            setDimsForKey(activeKey, w, h);
                                        }
                                    }}
                                />
                            </div>
                            <div className="space-y-3">
                                <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">Metadata</p>
                                <FileMetadata
                                    file={activeFile}
                                    imageDimensions={activeKey ? imageDimsByKey[activeKey] ?? null : null}
                                />
                            </div>
                        </div>
                    )} */}

                    {state.files.length > 0 && (
                        <ul className="divide-border border-border divide-y rounded-md border">
                            {state.files.map((file, index) => {
                                const key = fileKeys[index]!;
                                const thumbUrl = objectUrls.get(key);
                                const isImage = file.type.startsWith('image/');

                                return (
                                    <li
                                        key={key}
                                        className={cn(
                                            'flex items-center gap-3 px-3 py-2',
                                            index === state.activeIndex && 'bg-muted/40',
                                        )}
                                    >
                                        <button
                                            type="button"
                                            className="flex min-w-0 flex-1 items-center gap-3 text-left"
                                            onClick={() => dispatch({ type: 'SET_ACTIVE', payload: index })}
                                        >
                                            {isImage && thumbUrl ? (
                                                <img
                                                    src={thumbUrl}
                                                    alt=""
                                                    className="bg-muted size-10 shrink-0 rounded object-cover"
                                                />
                                            ) : (
                                                <div className="bg-muted text-muted-foreground flex size-10 shrink-0 items-center justify-center rounded text-xs font-medium">
                                                    {(getExtension(file.name) || '?').slice(0, 4).toUpperCase()}
                                                </div>
                                            )}
                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-medium">{file.name}</p>
                                                <p className="text-muted-foreground text-xs">{formatBytes(file.size)}</p>
                                            </div>
                                        </button>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="text-muted-foreground hover:text-destructive shrink-0"
                                            onClick={() => removeFileAtIndex(index)}
                                            disabled={disabled}
                                            aria-label={`Remove ${file.name}`}
                                        >
                                            <Trash2 className="size-4" />
                                        </Button>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                    
                </CardContent>
            </Card>
        </div>
    );
}
